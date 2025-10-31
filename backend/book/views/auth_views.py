from django.conf import settings
from itertools import count
import re
from django.db.models import Q
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import uuid
import string
import random
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import permission_classes, api_view
from book.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model
from datetime import datetime
from rest_framework_simplejwt.authentication import JWTAuthentication
import traceback
from django.utils.timezone import now
from datetime import timedelta
from book.models import User, Student
import json
import traceback
# User Model
User = get_user_model() 



class RegisterView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        try:
            data = request.data
            print('data coming in register:', data)

            email = data.get("email")
            username = data.get("username") or data.get("name")
            password = data.get("password")

            # ✅ Validate required fields
            if not email or not username or not password:
                return Response(
                    {"error": "Email, username, and password are required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ✅ Check if user already exists
            if User.objects.filter(email=email).exists():
                return Response(
                    {"error": "Email is already registered."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Optional: Check duplicate username (if desired)
            if User.objects.filter(username=username).exists():
                return Response(
                    {"error": "Username already taken."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ✅ Create the user
            user = User.objects.create(
                email=email,
                username=username,
                password=make_password(password)
            )

            # ✅ Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            # ✅ Response
            return Response({
                "message": "🎉 User registered successfully!",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email
                },
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh)
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print("Exception Traceback:\n", traceback.format_exc())
            return Response(
                {"error": "Something went wrong while registering. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 
        


# login views
class LoginView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        try:
            data = request.data
            print("Login data received:", data)

            email = data.get("email")
            password = data.get("password")

            # ✅ Validate input
            if not email or not password:
                return Response(
                    {"error": "Email and password are required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # ✅ Authenticate user
            user = authenticate(request, email=email, password=password)
            if user is None:
                # Check manually if email exists but wrong password
                if User.objects.filter(email=email).exists():
                    return Response(
                        {"error": "Invalid password."},
                        status=status.HTTP_401_UNAUTHORIZED,
                    )
                else:
                    return Response(
                        {"error": "No account found with this email."},
                        status=status.HTTP_404_NOT_FOUND,
                    )

            # ✅ Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "✅ Login successful!",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                    },
                    "tokens": {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            print("Exception Traceback:\n", traceback.format_exc())
            return Response(
                {"error": "Something went wrong during login. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        


class AddNewStudentView(APIView):
    """
    Admin or authenticated user can create a new student.
    It will:
    1 Create a new User entry with default password 'Password@123'
    2 Create a Student entry linked to that User
    """
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        try:
            data = request.data
            print("📥 AddNewStudentView data:", data)

            student_name = data.get("student_name")
            email = data.get("email")

            # ✅ Validate required fields
            if not student_name or not email:
                return Response(
                    {"error": "Student name and email are required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ✅ Check if student/user already exists
            if User.objects.filter(email=email).exists():
                return Response(
                    {"error": "A user with this email already exists."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ✅ Create a new User first
            user = User.objects.create(
                username=student_name,
                email=email,
                password=make_password("Password@123")  # default password
            )

            # ✅ Create the Student profile linked to User
            student = Student.objects.create(
                user=user,
                student_name=student_name,
                email=email
            )

            # ✅ Optional: Generate JWT token for the student (if needed)
            refresh = RefreshToken.for_user(user)

            # ✅ Success response
            return Response({
                "message": "🎉 Student profile created successfully!",
                "student": {
                    "id": user.id,
                    "stu_id": str(student.stu_id),
                    "student_name": student.student_name,
                    "email": student.email,
                    "default_password": "Password@123"
                },
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh)
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print("❌ Exception Traceback:\n", traceback.format_exc())
            return Response(
                {"error": "Something went wrong while creating student profile. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        



class GetStudentsView(APIView):
    """
    List all students or search by name/email using ?search=<query>
    Example:
      GET /api/student/list/
      GET /api/student/list/?search=alice
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            search_query = request.GET.get("search", "").strip()

            students = Student.objects.all()

            if search_query:
                students = students.filter(
                    Q(student_name__icontains=search_query) |
                    Q(email__icontains=search_query)
                )

            results = [
                {
                    "id": student.user.id,
                    "stu_id": str(student.stu_id),
                    "student_name": student.student_name,
                    "email": student.email,
                    "date_created": student.date_created.strftime("%Y-%m-%d %H:%M:%S"),
                }
                for student in students
            ]

            return Response(
                {"count": len(results), "results": results},
                status=status.HTTP_200_OK
            )

        except Exception:
            print("❌ Exception Traceback:\n", traceback.format_exc())
            return Response(
                {"error": "Something went wrong while fetching students."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )