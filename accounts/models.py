from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils import timezone

class UserProfile(models.Model):
    USER_TYPE_CHOICES = [
        ('heavy', 'Heavy'),
        ('basic', 'Basic'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending PI Confirmation'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    uwo_email = models.EmailField(unique=True)
    is_pi = models.BooleanField(default=False)
    is_sponsored = models.BooleanField(default=False)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='basic')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({'PI' if self.is_pi else 'Sponsored'})"

class ProjectGroup(models.Model):
    name = models.CharField(max_length=100)
    pis = models.ManyToManyField(UserProfile, related_name='project_groups')
    speedcodes = models.CharField(max_length=200, help_text='Comma-separated speedcodes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class StorageAllocation(models.Model):
    project = models.ForeignKey(ProjectGroup, on_delete=models.CASCADE, related_name='storage_allocations')
    storage_amount = models.PositiveIntegerField(help_text='Storage in GB')
    users_with_access = models.ManyToManyField(UserProfile, related_name='storage_access')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.project.name}: {self.storage_amount} GB"

# Version control for user changes
class UserChangeRecord(models.Model):
    CHANGE_TYPE_CHOICES = [
        ('create', 'Account Creation'),
        ('update', 'Account Update'),
        ('status', 'Status Change'),
        ('sponsor', 'Sponsor Change'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='change_records')
    change_type = models.CharField(max_length=20, choices=CHANGE_TYPE_CHOICES)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='changes_made')
    timestamp = models.DateTimeField(default=timezone.now)
    previous_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField()
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-timestamp']

class Request(models.Model):
    REQUEST_TYPE_CHOICES = [
        ('new_pi', 'New PI Account'),
        ('new_user', 'New User Account'),
        ('user_update', 'User Account Update'),
        ('pi_update', 'PI Account Update'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('denied', 'Denied'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests')
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES)
    data = models.JSONField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    approved_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='approved_requests')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.request_type} ({self.status})"