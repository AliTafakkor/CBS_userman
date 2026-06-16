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
    list_pis_for_form,
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'project-speedcodes', ProjectSpeedcodeViewSet, basename='projectspeedcode')
router.register(r'principal-investigators', PrincipalInvestigatorViewSet, basename='principalinvestigator')
router.register(r'sponsored-users', SponsoredUserViewSet, basename='sponsoreduser')
router.register(r'change-records', UserChangeRecordViewSet, basename='userchangerecord')
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
    path('all-pis/', list_pis_for_form, name='list-pis-for-form'),
]
