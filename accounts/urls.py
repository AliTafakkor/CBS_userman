from django.urls import path
from .views import TestLoginView, TestCreateUserView, RequestListCreateView  # Only import implemented views

urlpatterns = [
    # Testing endpoints - remove in production
    path('test-login/', TestLoginView.as_view(), name='test-login'),
    path('test-create-user/', TestCreateUserView.as_view(), name='test-create-user'),
    path('requests/', RequestListCreateView.as_view(), name='request-list-create'),
]