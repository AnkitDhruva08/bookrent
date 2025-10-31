from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Book, Rental, Student


# -----------------------
# Custom User Admin
# -----------------------
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ['id']
    list_display = ['email', 'username', 'is_staff', 'is_active']
    list_filter = ['is_staff', 'is_active']
    search_fields = ['email', 'username']

    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'is_staff', 'is_active'),
        }),
    )

    # Define username field as non-unique, email is unique
    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        return fieldsets


# -----------------------
# Book Admin
# -----------------------
@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'pages', 'olid', 'first_publish_year']
    search_fields = ['title', 'author', 'olid']
    list_filter = ['author', 'first_publish_year']
    ordering = ['title']

# -----------------------
# Rental Admin
# -----------------------
@admin.register(Rental)
class RentalAdmin(admin.ModelAdmin):
    list_display = ['user', 'book', 'start_date', 'end_date', 'total_fee']
    list_filter = ['start_date', 'end_date']
    search_fields = ['user__username', 'book__title']
    ordering = ['-start_date']
    readonly_fields = ['total_fee']

    def save_model(self, request, obj, form, change):
        """
        Automatically recalculate total_fee before saving in admin.
        """
        obj.total_fee = obj.calculate_fee()
        super().save_model(request, obj, form, change)


# -----------------------
# Student Admin
# -----------------------
@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("stu_id", "student_name", "email", "user", "date_created")
    search_fields = ("student_name", "email", "stu_id", "user__email")
    list_filter = ("date_created",)
    ordering = ("-date_created",)

    readonly_fields = ("stu_id", "date_created")  

    fieldsets = (
        ("Student Info", {"fields": ("stu_id", "student_name", "email")}),
        ("Linked User", {"fields": ("user",)}),
        ("Metadata", {"fields": ("date_created",)}),
    )

    def get_readonly_fields(self, request, obj=None):
        """
        Make stu_id and date_created read-only even when editing.
        """
        if obj:  # editing existing record
            return self.readonly_fields + ("user",)
        return self.readonly_fields