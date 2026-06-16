from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet,
    ProjectViewSet,
    ProjectSpeedcodeViewSet,
    PrincipalInvestigatorViewSet,
    SponsoredUserViewSet,
    UserChangeRecordViewSet,
    RequestViewSet,
    TestLoginView,
    TestCreateUserView,
    TestLogoutView,
    CurrentUserView,
    user_status,
    user_email,
    list_projects,
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'project-speedcodes', ProjectSpeedcodeViewSet)
router.register(r'principal-investigators', PrincipalInvestigatorViewSet)
router.register(r'sponsored-users', SponsoredUserViewSet)
router.register(r'change-records', UserChangeRecordViewSet)
router.register(r'requests', RequestViewSet, basename='request')

urlpatterns = [
    path('', include(router.urls)),
    path('test-login/', TestLoginView.as_view(), name='test-login'),
    path('test-logout/', TestLogoutView.as_view(), name='test-logout'),
    path('test-create-user/', TestCreateUserView.as_view(), name='test-create-user'),
    path('current-user/', CurrentUserView.as_view(), name='current-user'),
    path('user-status/', user_status, name='user-status'),
    path('me/email/', user_email, name='user-email'),
    path('all-projects/', list_projects, name='list-projects'),
]
