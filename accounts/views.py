from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Department, PrincipalInvestigator, SponsoredUser, UserChangeRecord, Project, ProjectSpeedcode
from .serializers import (
    UserSerializer, DepartmentSerializer, PrincipalInvestigatorSerializer,
    SponsoredUserSerializer, UserChangeRecordSerializer, ProjectSerializer, ProjectSpeedcodeSerializer
)
import json
from django.utils import timezone
from django.db import transaction

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code']

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'owner__user__first_name', 'owner__user__last_name']
    ordering_fields = ['name', 'created_date']
    
    @action(detail=True, methods=['get'])
    def speedcodes(self, request, pk=None):
        project = self.get_object()
        speedcodes = ProjectSpeedcode.objects.filter(project=project)
        serializer = ProjectSpeedcodeSerializer(speedcodes, many=True)
        return Response(serializer.data)

class ProjectSpeedcodeViewSet(viewsets.ModelViewSet):
    \"\"\"
    ViewSet for managing speedcode authorizations on projects.
    
    Each speedcode is owned by a specific PI. Only the owning PI can
    authorize their speedcode to be used in a project for cost allocation.
    \"\"\"
    queryset = ProjectSpeedcode.objects.all()
    serializer_class = ProjectSpeedcodeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['speedcode', 'pi__user__first_name', 'pi__user__last_name', 'project__name']
    ordering_fields = ['authorized_date', 'allocation_percentage']
    
    def perform_create(self, serializer):
        \"\"\"
        Create a speedcode authorization.
        Validation ensures the speedcode belongs to the authorizing PI.
        \"\"\"
        serializer.save()

class PrincipalInvestigatorViewSet(viewsets.ModelViewSet):
    queryset = PrincipalInvestigator.objects.all()
    serializer_class = PrincipalInvestigatorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'employee_id']
    ordering_fields = ['user__last_name', 'department__name']
    
    @transaction.atomic
    def perform_create(self, serializer):
        # Create the PI
        pi = serializer.save()
        
        # Create default project for the PI
        default_project = Project.objects.create(
            name=f"{pi.user.get_full_name()}'s Default Project",
            description=f"Default project for {pi.user.get_full_name()}",
            owner=pi,
            is_default=True
        )
        
        # Create initial speedcode allocation (100% to PI's speedcode)
        ProjectSpeedcode.objects.create(
            project=default_project,
            pi=pi,
            speedcode=pi.speedcode,
            allocation_percentage=100.00
        )
        
        # Set as default project
        pi.default_project = default_project
        pi.save()
    
    @action(detail=True, methods=['get'])
    def sponsored_users(self, request, pk=None):
        pi = self.get_object()
        users = SponsoredUser.objects.filter(sponsor=pi)
        serializer = SponsoredUserSerializer(users, many=True)
        return Response(serializer.data)

class SponsoredUserViewSet(viewsets.ModelViewSet):
    queryset = SponsoredUser.objects.all()
    serializer_class = SponsoredUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'user_type', 'status']
    ordering_fields = ['user__last_name', 'sponsor__user__last_name', 'start_date']
    
    def perform_create(self, serializer):
        # Save initial state and create change record
        instance = serializer.save()
        UserChangeRecord.objects.create(
            user=instance.user,
            change_type='create',
            changed_by=self.request.user,
            previous_data=None,
            new_data=json.loads(SponsoredUserSerializer(instance).data),
            notes=f"Account created by {self.request.user.get_full_name()}"
        )
    
    def perform_update(self, serializer):
        # Get the existing object for comparison
        instance = self.get_object()
        previous_data = json.loads(SponsoredUserSerializer(instance).data)
        
        # Save the updates
        updated_instance = serializer.save()
        
        # Create change record
        UserChangeRecord.objects.create(
            user=updated_instance.user,
            change_type='update',
            changed_by=self.request.user,
            previous_data=previous_data,
            new_data=json.loads(SponsoredUserSerializer(updated_instance).data),
            notes=f"Account updated by {self.request.user.get_full_name()}"
        )

class UserChangeRecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UserChangeRecord.objects.all()
    serializer_class = UserChangeRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'change_type', 'notes']
    ordering_fields = ['timestamp', 'change_type']
    
    def get_queryset(self):
        queryset = UserChangeRecord.objects.all()
        user_id = self.request.query_params.get('user_id', None)
        if user_id is not None:
            queryset = queryset.filter(user_id=user_id)
        return queryset

class TestLoginView(APIView):
    """
    Temporary login endpoint for testing - will be replaced by SSO in production
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if user is not None:
            login(request, user)
            return Response({
                "message": "Login successful",
                "user_id": user.id,
                "username": user.username,
                "is_staff": user.is_staff
            })
        else:
            return Response(
                {"error": "Invalid credentials"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

class TestCreateUserView(APIView):
    """
    Temporary endpoint to create users for testing
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        
        if not (username and password):
            return Response(
                {"error": "Username and password are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already exists"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        
        return Response({
            "message": "User created successfully",
            "user_id": user.id,
            "username": user.username
        }, status=status.HTTP_201_CREATED)