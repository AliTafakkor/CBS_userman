from django.urls import path
from .views import TestLoginView, TestCreateUserView, RequestListCreateView, user_status  # Only import implemented views

urlpatterns = [
    # Testing endpoints - remove in production
    path('test-login/', TestLoginView.as_view(), name='test-login'),
    path('test-create-user/', TestCreateUserView.as_view(), name='test-create-user'),
    path('requests/', RequestListCreateView.as_view(), name='request-list-create'),
    path('user-status/', user_status, name='user-status'),
]