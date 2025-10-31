from django.db import models,transaction
from django.contrib.auth.models import AbstractUser
from datetime import timedelta, date
from decimal import Decimal
import uuid
from django.utils import timezone

# -----------------------
# Custom User model
# -----------------------
class User(AbstractUser):
    """
    Custom user with email as the unique identifier.
    Admins are handled by Django's is_staff flag.
    Students are normal users (is_staff=False).
    """
    username = models.CharField(max_length=150, unique=False)
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.username or self.email
    


class Student(models.Model):
    """
    Student table linked to User, with a system-generated stu_id.
    """
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    stu_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    student_name = models.CharField(max_length=150)
    email = models.EmailField()

    date_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student_name} ({self.email})"


# -----------------------
# Book model
# -----------------------
class Book(models.Model):
    """
    Represents a book fetched via OpenLibrary.
    """
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True, null=True)
    pages = models.PositiveIntegerField(default=0)
    cover_url = models.URLField(blank=True, null=True)
    olid = models.CharField(max_length=50, blank=True, null=True)
    first_publish_year = models.PositiveIntegerField(blank=True, null=True)

    def __str__(self):
        return self.title


# -----------------------
# Rental model
# -----------------------


class Rental(models.Model):
    """
    Represents a student renting a book.
    Automatically handles:
    - Free first month
    - Monthly fee calculation
    - Rental status (Active / Extended / Returned)
    """
    STATUS_CHOICES = [
        ("active", "Active"),
        ("extended", "Extended"),
        ("returned", "Returned"),
    ]

    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="rentals")
    book = models.ForeignKey("Book", on_delete=models.CASCADE, related_name="rentals")
    start_date = models.DateField(auto_now_add=True)
    end_date = models.DateField(blank=True, null=True)
    total_fee = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    class Meta:
        ordering = ["-start_date"]

    # ----------------------------
    # Utility methods
    # ----------------------------
    def _calculate_fee(self, end_date=None):
        """
        Internal: Calculate fee based on pages and how many months have passed
        after the free period.
        """
        end_date = end_date or self.end_date or timezone.now().date()
        free_month_end = self.start_date + timedelta(days=30)

        if end_date <= free_month_end:
            return Decimal("0.00")

        extra_days = (end_date - free_month_end).days
        months_extra = (extra_days // 30) + 1  # charge per full month beyond free
        fee_per_month = Decimal(self.book.pages) / Decimal("100")
        return round(months_extra * fee_per_month, 2)

    # ----------------------------
    # Public logic
    # ----------------------------
    def calculate_fee(self):
        """Public fee calculation"""
        return self._calculate_fee()

    def extend_rental(self, months=1):
        """
        Extend rental by given number of months (default 1)
        and automatically recalculate total fee and update status.
        """
        with transaction.atomic():
            extra_days = months * 30
            # If rental is already returned, we can't extend it
            if self.status == "returned":
                raise ValueError("Cannot extend a returned rental")
            
            # Calculate new end date
            current_end_date = self.end_date or timezone.now().date()
            self.end_date = current_end_date + timedelta(days=extra_days)
            
            # Recalculate total fee
            self.total_fee = self._calculate_fee(self.end_date)
            
            # Set status to "extended" (NOT "returned")
            self.status = "extended"
            
            # Save the changes
            self.save(update_fields=["end_date", "total_fee", "status"])

    def mark_returned(self):
        """
        Mark rental as returned and auto-update fee.
        """
        with transaction.atomic():
            # Set end date to today if not already set
            if not self.end_date:
                self.end_date = timezone.now().date()
            
            # Recalculate total fee up to return date
            self.total_fee = self._calculate_fee(self.end_date)
            
            # Set status to returned
            self.status = "returned"
            
            # Save the changes
            self.save(update_fields=["end_date", "total_fee", "status"])

    def update_status(self):
        """
        Automatically detect current status based on end_date and today's date.
        Called during save().
        """
        today = timezone.now().date()

        # If already returned, don't change status
        if self.status == "returned":
            return

        # If end_date is set, it means the rental has ended/returned
        if self.end_date:
            if self.end_date <= today:
                self.status = "returned"
            else:
                self.status = "extended"
        else:
            # No end date set, check if we're past free period
            free_month_end = self.start_date + timedelta(days=30)
            if today > free_month_end:
                self.status = "extended"
            else:
                self.status = "active"

        # Always recalculate fee when status updates
        self.total_fee = self._calculate_fee()

    def save(self, *args, **kwargs):
        """Auto-update status and total_fee before saving"""
        self.update_status()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} rented {self.book.title} ({self.status})"