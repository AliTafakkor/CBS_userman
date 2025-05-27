from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import generics, permissions
from .models import Request, UserProfile, ProjectGroup
from .serializers import RequestSerializer
from rest_framework.decorators import api_view, permission_classes

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

class RequestListCreateView(generics.ListCreateAPIView):
    serializer_class = RequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Admins see all, users see their own
        user = self.request.user
        if user.is_staff:
            return Request.objects.all()
        return Request.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_status(request):
    user = request.user
    if user.is_staff:
        return Response({'status': 'active', 'role': 'admin'})
    try:
        profile = UserProfile.objects.get(user=user)
        if profile.status == 'active':
            role = 'pi' if profile.is_pi else 'user'
            return Response({'status': 'active', 'role': role})
        else:
            return Response({'status': 'inactive', 'role': None})
    except UserProfile.DoesNotExist:
        return Response({'status': 'not_found', 'role': None})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_email(request):
    user = request.user
    try:
        profile = UserProfile.objects.get(user=user)
        return Response({'email': profile.uwo_email})
    except UserProfile.DoesNotExist:
        return Response({'email': user.email})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_projects(request):
    projects = ProjectGroup.objects.all().values('id', 'name')
    return Response(list(projects))