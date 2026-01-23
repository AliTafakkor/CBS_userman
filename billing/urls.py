from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BillingRateViewSet, BillingCycleViewSet, BillingRecordViewSet,
    StorageTypeViewSet, StorageAllocationViewSet
)

router = DefaultRouter()
router.register(r'rates', BillingRateViewSet)
router.register(r'cycles', BillingCycleViewSet)
router.register(r'records', BillingRecordViewSet)
router.register(r'storage-types', StorageTypeViewSet)
router.register(r'storage-allocations', StorageAllocationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]