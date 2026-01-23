from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils import timezone

class Department(models.Model):
    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.code})"

class Project(models.Model):
    """Project for organizing users and storage allocations"""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    owner = models.ForeignKey('PrincipalInvestigator', on_delete=models.PROTECT, related_name='owned_projects')
    collaborating_pis = models.ManyToManyField('PrincipalInvestigator', related_name='collaborative_projects', blank=True)
    is_default = models.BooleanField(default=False)
    created_date = models.DateField(auto_now_add=True)
    
    class Meta:
        unique_together = ['owner', 'name']
    
    def __str__(self):
        return f"{self.name} (Owner: {self.owner.user.last_name})"

class ProjectSpeedcode(models.Model):
    """Speedcodes assigned to a project for cost splitting"""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='speedcodes')
    pi = models.ForeignKey('PrincipalInvestigator', on_delete=models.CASCADE)
    speedcode = models.CharField(max_length=50)
    allocation_percentage = models.DecimalField(max_digits=5, decimal_places=2, help_text="Percentage of project costs to charge to this speedcode")
    
    class Meta:
        unique_together = ['project', 'speedcode']
    
    def __str__(self):
        return f"{self.project.name} - {self.speedcode} ({self.allocation_percentage}%)"

class PrincipalInvestigator(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='principal_investigators')
    employee_id = models.CharField(max_length=50, unique=True)
    speedcode = models.CharField(max_length=50, unique=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    default_project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='default_for_pi')
    
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
        ('basic', 'Basic'),
        ('poweruser', 'Power User'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    user_role = models.CharField(max_length=100, choices=USER_ROLE_CHOICES)
    sponsor = models.ForeignKey(PrincipalInvestigator, on_delete=models.CASCADE, related_name='sponsored_users')
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name='users')
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