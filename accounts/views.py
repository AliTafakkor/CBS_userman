from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, viewsets, permissions, filters
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.authtoken.models import Token
from .models import (
    Department, PrincipalInvestigator, SponsoredUser,
    UserChangeRecord, Project, ProjectSpeedcode, Request,
)
from .serializers import (
    UserSerializer, DepartmentSerializer, PrincipalInvestigatorSerializer,
    SponsoredUserSerializer, UserChangeRecordSerializer,
    ProjectSerializer, ProjectSpeedcodeSerializer, RequestSerializer,
)
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
    queryset = ProjectSpeedcode.objects.all()
    serializer_class = ProjectSpeedcodeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['speedcode', 'pi__user__first_name', 'pi__user__last_name', 'project__name']
    ordering_fields = ['authorized_date', 'allocation_percentage']


class PrincipalInvestigatorViewSet(viewsets.ModelViewSet):
    queryset = PrincipalInvestigator.objects.all()
    serializer_class = PrincipalInvestigatorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'employee_id']
    ordering_fields = ['user__last_name', 'department__name']

    @transaction.atomic
    def perform_create(self, serializer):
        pi = serializer.save()
        default_project = Project.objects.create(
            name=f"{pi.user.get_full_name()}'s Default Project",
            description=f"Default project for {pi.user.get_full_name()}",
            owner=pi,
            is_default=True,
        )
        ProjectSpeedcode.objects.create(
            project=default_project,
            pi=pi,
            speedcode=pi.speedcode,
            allocation_percentage=100.00,
        )
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
        instance = serializer.save()
        UserChangeRecord.objects.create(
            user=instance.user,
            change_type='create',
            changed_by=self.request.user,
            previous_data=None,
            new_data=SponsoredUserSerializer(instance).data,
            notes=f"Account created by {self.request.user.get_full_name()}",
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        previous_data = dict(SponsoredUserSerializer(instance).data)
        updated_instance = serializer.save()
        UserChangeRecord.objects.create(
            user=updated_instance.user,
            change_type='update',
            changed_by=self.request.user,
            previous_data=previous_data,
            new_data=SponsoredUserSerializer(updated_instance).data,
            notes=f"Account updated by {self.request.user.get_full_name()}",
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
    """Temporary login endpoint — returns a DRF token. Replace with SSO in production."""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_staff": user.is_staff,
                    "is_superuser": user.is_superuser,
                },
            })
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


class TestLogoutView(APIView):
    """Invalidates the user's auth token."""
    permission_classes = [AllowAny]

    def post(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer ') or auth_header.startswith('Token '):
            token_key = auth_header.split(' ', 1)[1]
            Token.objects.filter(key=token_key).delete()
        return Response({"message": "Logout successful"})


class TestCreateUserView(APIView):
    """Temporary endpoint to create users for testing."""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not (username and password):
            return Response({"error": "Username and password are required"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(
            username=username,
            password=password,
            email=request.data.get('email', ''),
            first_name=request.data.get('first_name', ''),
            last_name=request.data.get('last_name', ''),
        )
        return Response({"message": "User created successfully", "user_id": user.id, "username": user.username},
                        status=status.HTTP_201_CREATED)


class CurrentUserView(APIView):
    """Returns the authenticated user's info based on a Bearer/Token header."""
    permission_classes = [AllowAny]

    def get(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer ') or auth_header.startswith('Token '):
            token_key = auth_header.split(' ', 1)[1]
            try:
                token = Token.objects.get(key=token_key)
                u = token.user
                return Response({
                    "id": u.id,
                    "username": u.username,
                    "email": u.email,
                    "first_name": u.first_name,
                    "last_name": u.last_name,
                    "is_staff": u.is_staff,
                    "is_superuser": u.is_superuser,
                })
            except Token.DoesNotExist:
                pass
        return Response({"error": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)


class RequestViewSet(viewsets.ModelViewSet):
    serializer_class = RequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            qs = Request.objects.all()
            status_filter = self.request.query_params.get('status')
            if status_filter:
                qs = qs.filter(status=status_filter)
            return qs
        return Request.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        req = self.get_object()
        req.status = 'approved'
        req.admin_notes = request.data.get('admin_notes', '')
        req.approved_by = request.user
        req.save()
        return Response(RequestSerializer(req).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def deny(self, request, pk=None):
        req = self.get_object()
        req.status = 'denied'
        req.admin_notes = request.data.get('admin_notes', '')
        req.approved_by = request.user
        req.save()
        return Response(RequestSerializer(req).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_status(request):
    user = request.user
    if user.is_staff:
        return Response({'status': 'active', 'role': 'admin'})
    try:
        pi = PrincipalInvestigator.objects.get(user=user)
        return Response({'status': 'active', 'role': 'pi', 'pi_id': pi.id})
    except PrincipalInvestigator.DoesNotExist:
        pass
    try:
        sponsored = SponsoredUser.objects.get(user=user)
        role = 'user' if sponsored.status == 'active' else None
        return Response({'status': sponsored.status, 'role': role})
    except SponsoredUser.DoesNotExist:
        return Response({'status': 'not_found', 'role': None})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_email(request):
    return Response({'email': request.user.email})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_projects(request):
    projects = Project.objects.all().values('id', 'name')
    return Response(list(projects))
