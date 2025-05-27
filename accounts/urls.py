from django.urls import path
from .views import TestLoginView, TestCreateUserView, RequestListCreateView, user_status, user_email, list_projects  # Only import implemented views

urlpatterns = [
    # Testing endpoints - remove in production
    path('test-login/', TestLoginView.as_view(), name='test-login'),
    path('test-create-user/', TestCreateUserView.as_view(), name='test-create-user'),
    path('requests/', RequestListCreateView.as_view(), name='request-list-create'),
    path('user-status/', user_status, name='user-status'),
    path('me/email/', user_email, name='user-email'),
    path('projects/', list_projects, name='list-projects'),
]