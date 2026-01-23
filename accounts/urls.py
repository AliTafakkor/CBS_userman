from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet,
    ProjectViewSet,
    ProjectSpeedcodeViewSet,
    PrincipalInvestigatorViewSet, 
    SponsoredUserViewSet, UserChangeRecordViewSet,
    TestLoginView, TestCreateUserView, TestLogoutView, CurrentUserView  # New views for testing
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'project-speedcodes', ProjectSpeedcodeViewSet)
router.register(r'principal-investigators', PrincipalInvestigatorViewSet)
router.register(r'sponsored-users', SponsoredUserViewSet)
router.register(r'change-records', UserChangeRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Testing endpoints - remove in production
    path('test-login/', TestLoginView.as_view(), name='test-login'),
    path('test-create-user/', TestCreateUserView.as_view(), name='test-create-user'),
    # Aliases for frontend compatibility
    path('test-logout/', TestLogoutView.as_view(), name='test-logout'),
    path('current-user/', CurrentUserView.as_view(), name='current-user'),
]