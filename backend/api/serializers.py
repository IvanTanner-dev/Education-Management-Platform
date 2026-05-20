from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Course, Lesson, LessonProgress, Profile
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class LessonSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'course', 'title', 'content', 'video_url', 'order', 'is_completed']
    
    def get_is_completed(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return LessonProgress.objects.filter(
                user=user, 
                lesson=obj, 
                is_completed=True
            ).exists()
        return False

class CourseSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    
    teacher_name = serializers.SerializerMethodField()
    teacher_username = serializers.CharField(source='teacher.username', read_only=True)
    is_enrolled = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 
            'title', 
            'description', 
            'teacher',
            'teacher_name', 
            'teacher_username',
            'lessons', 
            'students',
            'is_enrolled',
            'progress_percentage',
            'created_at'
            ]
        read_only_fields = ['teacher', 'students']
    
    def get_teacher_name(self, obj):
        return f"{obj.teacher.first_name} {obj.teacher.last_name}".strip() or obj.teacher.username

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, "user") and request.user.is_authenticated:
            return obj.students.filter(id=request.user.id).exists()
        return False
    
    def get_progress_percentage(self, obj):
        request = self.context.get('request')
        if not request or not hasattr(request, "user") or not request.user.is_authenticated:
            return 0
        
        total_lessons = obj.lessons.count()
        if total_lessons == 0: return 0
            
        completed_lessons = LessonProgress.objects.filter(
            user=request.user, 
            lesson__course=obj, 
            is_completed=True
        ).count()
        
        return int((completed_lessons / total_lessons) * 100)
    
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        data['user'] = {
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'username': self.user.username,
            'role': self.user.profile.role, 
        }
        return data
    
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['role']

class AdminUserEditSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer() 

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']
        read_only_fields = ['username'] 

    def update(self, instance, validated_data):
        # 1. Handle the Profile data
        profile_data = validated_data.pop('profile', None)
        if profile_data:
            profile = instance.profile
            profile.role = profile_data.get('role', profile.role)
            profile.save()

        # 2. Handle the User data
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance

class UserUpdateSerializer(serializers.ModelSerializer):
    """Used for Student Registration and basic Profile updates"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']
        extra_kwargs = {'password': {'write_only': True}} 

    def create(self, validated_data):
        
        user = User.objects.create_user(**validated_data)
        return user
