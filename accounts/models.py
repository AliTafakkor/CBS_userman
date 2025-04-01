from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils import timezone

class PrincipalInvestigator(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    speedcode = models.CharField(max_length=50, unique=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.get_full_name()} (Speedcode: {self.speedcode})"

class SponsoredUser(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('pending', 'Pending Approval'),
        ('inactive', 'Inactive'),
    ]
    
    USER_ROLE_CHOICES = [
        ('student', 'Student'),
        ('staff', 'Staff'),
        ('faculty', 'Faculty'),
        ('external', 'External Collaborator'),
    ]

    USER_TYPE_CHOICES = [
        ('cpu heavy', 'CPU Heavy', 'CPU', 'Heavy', 'heavy'),
        ('gpu heavy', 'GPU Heavy', 'GPU'),
        ('basic', 'Basic'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    user_role = models.CharField(max_length=100, choices=USER_ROLE_CHOICES)
    sponsor = models.ForeignKey(PrincipalInvestigator, on_delete=models.CASCADE, related_name='sponsored_users')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.get_full_name()} (Sponsored by: {self.sponsor.user.last_name})"

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