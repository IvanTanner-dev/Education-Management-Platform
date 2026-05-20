from django.contrib.auth import get_user_model
from rest_framework import viewsets, status, permissions, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    MyTokenObtainPairSerializer,
    UserUpdateSerializer,
    CourseSerializer,
    LessonSerializer,
    AdminUserEditSerializer
)
from .permissions import IsTeacherRole, IsTeacherOrReadOnly
from .models import Course, Lesson, LessonProgress

User = get_user_model()
 
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    # Define granular access control to balance public visibility with protected actions.
    def get_permissions(self):
        """
        Enforce role-based access control (RBAC):
        - Teachers manage their own content (CUD).
        - Students interact with specific course actions (Enroll/View Enrolled).
        - Anonymous users can browse the catalog.
        """
        if self.action in ['create']:
            return [IsAuthenticated(), IsTeacherRole()]
        if self.action in ['update', 'partial_update', 'destroy', 'add_student']:
            return [IsAuthenticated(), IsTeacherOrReadOnly()] 
        if self.action in ['enroll', 'enrolled']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        # Establish ownership by linking the course record to the authenticated creator.
        serializer.save(teacher=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def enroll(self, request, pk=None):
        course = self.get_object()
        # Persist the enrollment relationship in the Many-to-Many join table.
        course.students.add(request.user)
        return Response({"status": "enrolled"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsTeacherOrReadOnly])
    def add_student(self, request, pk=None):
        course = self.get_object()
        username = request.data.get('username')
        try:
            student = User.objects.get(username=username)
            course.students.add(student)
            return Response({"status": "student added"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def enrolled(self, request):
        # Retrieve personalized course lists by checking student membership.
        courses = Course.objects.filter(students=request.user)
        serializer = CourseSerializer(courses, many=True, context={'request': request})
        return Response(serializer.data)
    
class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def complete(self, request, pk=None):
        lesson = self.get_object()
        # Upsert lesson completion state to ensure data consistency across multiple clicks.
        progress, _ = LessonProgress.objects.get_or_create(
            user=request.user,
            lesson=lesson
        )
        progress.is_completed = True
        progress.save()

        return Response(
            {'status': 'success', 'message': 'Lesson marked as complete'},
            status=status.HTTP_200_OK
        )
    
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Administrative endpoints for managing system users and their roles.
    """
    queryset = User.objects.all()
    serializer_class = AdminUserEditSerializer
    permission_classes = [permissions.IsAdminUser] # Strictly only for is_staff=True

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserUpdateSerializer # Ensure this handles 'password' correctly

    def perform_create(self, serializer):
        # Security requirement: apply one-way hashing to the raw password string before persistence.
        user = serializer.save()
        user.set_password(self.request.data.get('password'))
        user.save()


    