from datetime import timedelta, date
from decimal import Decimal
import traceback

from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from book.models import User, Student, Book, Rental 
from book.utils import fetch_book_from_openlibrary


# ---------------------- Helper Fee Functions ----------------------

def calculate_monthly_fee(pages):
    """Calculate monthly fee based on book pages."""
    return Decimal(pages) / Decimal("100")


# ---------------------- Book Search View ----------------------

class BookSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        title = request.GET.get("title", "").strip()
        if not title:
            return Response({"error": "Title parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        books = Book.objects.filter(title__icontains=title)
        if books.exists():
            results = [
                {
                    "title": b.title,
                    "author": b.author,
                    "pages": b.pages,
                    "coverUrl": b.cover_url,
                    "olid": b.olid,
                    "firstPublishYear": b.first_publish_year,
                }
                for b in books
            ]
            return Response({"results": results}, status=status.HTTP_200_OK)

        book_info = fetch_book_from_openlibrary(title)
        if not book_info:
            return Response({"results": []}, status=status.HTTP_200_OK)

        result = {
            "title": book_info["title"],
            "author": book_info["author"],
            "pages": book_info["pages"],
            "coverUrl": book_info["cover_url"],
            "olid": book_info["olid"],
            "firstPublishYear": book_info["first_publish_year"],
        }
        return Response({"results": [result]}, status=status.HTTP_200_OK)


# ---------------------- Create Rental View ----------------------

class CreateRentalView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        try:
            title = request.data.get("title")
            student_id = request.data.get("student_id")
            
            if not title:
                return Response({"error": "Book title is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Find or create book
            book = Book.objects.filter(title__iexact=title).first()
            if not book:
                book_info = fetch_book_from_openlibrary(title)
                if not book_info:
                    return Response({"error": "Book not found in OpenLibrary"}, status=status.HTTP_404_NOT_FOUND)

                book = Book.objects.create(
                    title=book_info["title"],
                    author=book_info["author"],
                    pages=book_info["pages"],
                    cover_url=book_info["cover_url"],
                    olid=book_info["olid"],
                    first_publish_year=book_info["first_publish_year"],
                )

            # Find user based on student_id or use default
            if student_id:
                try:
                    student = Student.objects.get(id=student_id)
                    user = student.user
                except Student.DoesNotExist:
                    return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
            else:
                # Fallback to first user if no student specified
                user = User.objects.first()

            # Create rental - model will automatically set dates and calculate fees
            rental = Rental.objects.create(
                user=user,
                book=book
            )
            
            monthly_fee = calculate_monthly_fee(book.pages)

            return Response({
                "message": f"Book '{book.title}' rented successfully!",
                "rental": {
                    "id": rental.id,
                    "book": book.title,
                    "start_date": rental.start_date.strftime("%Y-%m-%d"),
                    "end_date": rental.end_date.strftime("%Y-%m-%d") if rental.end_date else None,
                    "free_month_ends": (rental.start_date + timedelta(days=30)).strftime("%Y-%m-%d"),
                    "status": rental.status,
                    "total_fee": f"${rental.total_fee:.2f}",
                    "monthly_fee": f"${monthly_fee:.2f}",
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print("Rental creation error:", e)
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ---------------------- Student Rentals View ----------------------

class StudentRentalsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, student_id):
        try:
            student = Student.objects.get(id=student_id)
            rentals = Rental.objects.filter(user=student.user).select_related("book")

            rental_data = []
            total_fees = Decimal("0.00")
            
            for rental in rentals:
                monthly_fee = calculate_monthly_fee(rental.book.pages)
                free_month_ends = rental.start_date + timedelta(days=30)

                rental_data.append({
                    "id": rental.id,
                    "book": {
                        "title": rental.book.title, 
                        "author": rental.book.author, 
                        "pages": rental.book.pages,
                        "cover_url": rental.book.cover_url,
                    },
                    "start_date": rental.start_date.strftime("%Y-%m-%d"),
                    "end_date": rental.end_date.strftime("%Y-%m-%d") if rental.end_date else None,
                    "free_month_ends": free_month_ends.strftime("%Y-%m-%d"),
                    "monthly_fee": f"${monthly_fee:.2f}",
                    "total_fee": f"${rental.total_fee:.2f}",
                    "status": rental.status,
                })
                total_fees += rental.total_fee

            return Response({
                "student": {
                    "id": student.id, 
                    "name": student.student_name, 
                    "email": student.email,
                    "student_id": str(student.stu_id) if hasattr(student, 'stu_id') else None
                },
                "rentals": rental_data,
                "total_rentals": len(rental_data),
                "total_fees": f"${total_fees:.2f}"
            }, status=status.HTTP_200_OK)

        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# ---------------------- Extend Rental View (FIXED) ----------------------

class ExtendRentalView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request, rental_id):
        try:
            print('🔄 Extending rental ID:', rental_id)
            print('Request data:', request.data)

            rental = Rental.objects.select_for_update().get(id=rental_id)
            
            if rental.status == "returned":
                return Response({"error": "Cannot extend a returned rental"}, status=status.HTTP_400_BAD_REQUEST)

            # Get months from frontend
            extension_months = request.data.get("extension_months", 1)
            if isinstance(extension_months, str):
                extension_months = int(extension_months)

            print(f'📅 Extending by {extension_months} month(s)')
            print(f'📊 Current status: {rental.status}, Current end_date: {rental.end_date}')

            # Use the model's extend_rental method
            rental.extend_rental(months=extension_months)
            
            # Refresh from database to get updated values
            rental.refresh_from_db()
            
            monthly_fee = calculate_monthly_fee(rental.book.pages)

            print(f'✅ After extension - Status: {rental.status}, End date: {rental.end_date}, Total fee: {rental.total_fee}')

            return Response({
                "message": f"Rental extended successfully by {extension_months} month(s)!",
                "rental": {
                    "id": rental.id,
                    "book": rental.book.title,
                    "start_date": rental.start_date.strftime("%Y-%m-%d"),
                    "end_date": rental.end_date.strftime("%Y-%m-%d") if rental.end_date else None,
                    "free_month_ends": (rental.start_date + timedelta(days=30)).strftime("%Y-%m-%d"),
                    "status": rental.status,  # This should now be "extended"
                    "total_fee": f"${rental.total_fee:.2f}",
                    "monthly_fee": f"${monthly_fee:.2f}",
                }
            }, status=status.HTTP_200_OK)

        except Rental.DoesNotExist:
            return Response({"error": "Rental not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ---------------------- Return Rental View (UNCHANGED) ----------------------

class ReturnRentalView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def put(self, request, rental_id):
        try:
            print('↩️ Returning rental ID:', rental_id)
            rental = Rental.objects.select_for_update().get(id=rental_id)
            
            if rental.status == "returned":
                return Response({"error": "Rental already returned"}, status=status.HTTP_400_BAD_REQUEST)

            print(f'📚 Returning rental: {rental.book.title}, Current status: {rental.status}')

            # Use the model's mark_returned method
            rental.mark_returned()
            
            # Refresh from database to get updated values
            rental.refresh_from_db()
            
            monthly_fee = calculate_monthly_fee(rental.book.pages)

            print(f'✅ After return - Status: {rental.status}, End date: {rental.end_date}')

            return Response({
                "message": f"'{rental.book.title}' returned successfully!",
                "rental": {
                    "id": rental.id,
                    "book": rental.book.title,
                    "start_date": rental.start_date.strftime("%Y-%m-%d"),
                    "end_date": rental.end_date.strftime("%Y-%m-%d") if rental.end_date else None,
                    "free_month_ends": (rental.start_date + timedelta(days=30)).strftime("%Y-%m-%d"),
                    "total_fee": f"${rental.total_fee:.2f}",
                    "monthly_fee": f"${monthly_fee:.2f}",
                    "status": rental.status,  
                }
            }, status=status.HTTP_200_OK)

        except Rental.DoesNotExist:
            return Response({"error": "Rental not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            traceback.print_exc()
            return Response({"error": f"Error returning rental: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ---------------------- Updated All Rentals View ----------------------

class AllRentalsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            print('📘 Fetching all rentals')

            rentals = Rental.objects.select_related("book", "user").all()
            rental_data = []
            total_fees = Decimal("0.00")

            for rental in rentals:
                # Get student information
                student = Student.objects.filter(user=rental.user).first()
                
                # Calculate free month end date (due date for active rentals)
                free_month_ends = rental.start_date + timedelta(days=30)

                student_data = {
                    "id": student.id if student else None,
                    "name": student.student_name if student else rental.user.username,
                    "email": student.email if student else rental.user.email,
                    "student_id": str(student.stu_id) if student and hasattr(student, 'stu_id') else None
                }

                monthly_fee = calculate_monthly_fee(rental.book.pages)

                # Determine frontend status display
                frontend_status = "returned" if rental.status == "returned" else "active"

                rental_data.append({
                    "id": rental.id,
                    "student": student_data,
                    "book": {
                        "title": rental.book.title,
                        "author": rental.book.author,
                        "pages": rental.book.pages,
                        "cover_url": rental.book.cover_url,
                    },
                    "start_date": rental.start_date.strftime("%Y-%m-%d"),
                    "end_date": rental.end_date.strftime("%Y-%m-%d") if rental.end_date else None,
                    "free_month_ends": free_month_ends.strftime("%Y-%m-%d"),
                    "monthly_fee": f"${monthly_fee:.2f}",
                    "total_fee": f"${rental.total_fee:.2f}",
                    "status": frontend_status,  
                    "backend_status": rental.status, 
                })

                total_fees += rental.total_fee

            return Response({
                "total_rentals": len(rental_data),
                "total_fees_collected": f"${total_fees:.2f}",
                "rentals": rental_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
