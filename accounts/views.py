from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, viewsets, permissions, filters
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.authtoken.models import Token
from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    rate = '5/min'
    scope = 'login'
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
from .provisioning import provision_pi, provision_sponsored_user


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code']


def _get_pi_for_user(user):
    """Return PrincipalInvestigator for user, or None."""
    try:
        return PrincipalInvestigator.objects.get(user=user)
    except PrincipalInvestigator.DoesNotExist:
        return None


def _get_sponsored_user_for_user(user):
    """Return SponsoredUser for user, or None."""
    try:
        return SponsoredUser.objects.get(user=user)
    except SponsoredUser.DoesNotExist:
        return None


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'owner__user__first_name', 'owner__user__last_name']
    ordering_fields = ['name', 'created_date']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Project.objects.all()
        pi = _get_pi_for_user(user)
        if pi:
            return Project.objects.filter(owner=pi) | Project.objects.filter(collaborating_pis=pi)
        su = _get_sponsored_user_for_user(user)
        if su and su.project:
            return Project.objects.filter(pk=su.project.pk)
        return Project.objects.none()

    @action(detail=True, methods=['get'])
    def speedcodes(self, request, pk=None):
        project = self.get_object()
        speedcodes = ProjectSpeedcode.objects.filter(project=project)
        return Response(ProjectSpeedcodeSerializer(speedcodes, many=True).data)


class ProjectSpeedcodeViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSpeedcodeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['speedcode', 'pi__user__first_name', 'pi__user__last_name', 'project__name']
    ordering_fields = ['authorized_date', 'allocation_percentage']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return ProjectSpeedcode.objects.all()
        pi = _get_pi_for_user(user)
        if pi:
            return ProjectSpeedcode.objects.filter(pi=pi)
        return ProjectSpeedcode.objects.none()


class PrincipalInvestigatorViewSet(viewsets.ModelViewSet):
    serializer_class = PrincipalInvestigatorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'employee_id']
    ordering_fields = ['user__last_name', 'department__name']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return PrincipalInvestigator.objects.all()
        # PIs can see themselves; others cannot browse the PI list
        return PrincipalInvestigator.objects.filter(user=user)

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
        return Response(SponsoredUserSerializer(users, many=True).data)


class SponsoredUserViewSet(viewsets.ModelViewSet):
    serializer_class = SponsoredUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'user_type', 'status']
    ordering_fields = ['user__last_name', 'sponsor__user__last_name', 'start_date']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return SponsoredUser.objects.all()
        pi = _get_pi_for_user(user)
        if pi:
            return SponsoredUser.objects.filter(sponsor=pi)
        su = _get_sponsored_user_for_user(user)
        if su:
            return SponsoredUser.objects.filter(pk=su.pk)
        return SponsoredUser.objects.none()

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
    serializer_class = UserChangeRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'change_type', 'notes']
    ordering_fields = ['timestamp', 'change_type']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            qs = UserChangeRecord.objects.all()
        else:
            pi = _get_pi_for_user(user)
            if pi:
                sponsored_user_ids = SponsoredUser.objects.filter(sponsor=pi).values_list('user_id', flat=True)
                qs = UserChangeRecord.objects.filter(user_id__in=sponsored_user_ids)
            else:
                qs = UserChangeRecord.objects.filter(user=user)
        user_id = self.request.query_params.get('user_id')
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs


class TestLoginView(APIView):
    """Temporary login endpoint — returns a DRF token. Replace with SSO in production."""
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

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
    @transaction.atomic
    def approve(self, request, pk=None):
        req = self.get_object()
        if req.status != 'pending':
            return Response({'error': 'Request is not pending'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if req.request_type == 'new_pi':
                pi, temp_password = provision_pi(req.data)
                note = f"PI account created: username={pi.user.username}"
                if temp_password:
                    note += f", temp_password={temp_password}"
            elif req.request_type == 'new_user':
                su, temp_password = provision_sponsored_user(req.data)
                note = f"Sponsored user created: username={su.user.username}"
                if temp_password:
                    note += f", temp_password={temp_password}"
            else:
                note = ""
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        admin_notes = request.data.get('admin_notes', '')
        req.status = 'approved'
        req.admin_notes = f"{admin_notes}\n[System] {note}".strip() if note else admin_notes
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_pis_for_form(request):
    """Lightweight PI list for populating form dropdowns — authenticated users only."""
    pis = PrincipalInvestigator.objects.select_related('user').all()
    data = [
        {'id': pi.id, 'name': pi.user.get_full_name() or pi.user.username, 'speedcode': pi.speedcode}
        for pi in pis
    ]
    return Response(data)
