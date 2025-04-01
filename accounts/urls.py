from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet, PrincipalInvestigatorViewSet, 
    SponsoredUserViewSet, UserChangeRecordViewSet,
    TestLoginView, TestCreateUserView  # New views for testing
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet)
router.register(r'principal-investigators', PrincipalInvestigatorViewSet)
router.register(r'sponsored-users', SponsoredUserViewSet)
router.register(r'change-records', UserChangeRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Testing endpoints - remove in production
    path('test-login/', TestLoginView.as_view(), name='test-login'),
    path('test-create-user/', TestCreateUserView.as_view(), name='test-create-user'),
]