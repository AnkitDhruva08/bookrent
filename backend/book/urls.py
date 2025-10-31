from django.conf import settings
from django.urls import path, include, re_path
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from book.views.auth_views import RegisterView, LoginView, AddNewStudentView, GetStudentsView
from book.views.book_rental_views import BookSearchView, CreateRentalView,  ExtendRentalView, StudentRentalsView, AllRentalsView,ReturnRentalView

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),

    #  Register  
    path('register/', RegisterView.as_view(), name='register-view'),
    # login
    path('login/', LoginView.as_view(), name='login-view'),

    # add new student 
    path('students/add/', AddNewStudentView.as_view(), name='add-new-student-view'),
    # get students
    path('student/list/', GetStudentsView.as_view(), name='get-students-view'),

    # search book 
    path('books/search/', BookSearchView.as_view(), name='book-search-view'),

    # Rental endpoints
    path('rentals/create/', CreateRentalView.as_view(), name='rental-create'),
    path('rentals/extend/<int:rental_id>/', ExtendRentalView.as_view(), name='rental-extend'),
    path('rentals/student/<int:student_id>/', StudentRentalsView.as_view(), name='student-rentals'),
    path('rentals/list/', AllRentalsView.as_view(), name='all-rentals'),

    path('rentals/return/<int:rental_id>/', ReturnRentalView.as_view(), name='rental-return'),

    


]

if settings.DEBUG is True:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)