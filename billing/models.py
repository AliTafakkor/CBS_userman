from django.db import models
from accounts.models import PrincipalInvestigator, SponsoredUser, Project, ProjectSpeedcode
import uuid
from django.utils import timezone

class BillingRate(models.Model):
    user_type = models.CharField(max_length=50)
    rate_per_month = models.DecimalField(max_digits=10, decimal_places=2)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user_type} - ${self.rate_per_month}/month"

class StorageType(models.Model):
    """Types of storage with different rates"""
    STORAGE_TYPE_CHOICES = [
        ('legacy_2018', 'Legacy (2018)'),
        ('onefs_2025', 'OneFS (2025)'),
    ]
    
    name = models.CharField(max_length=50, choices=STORAGE_TYPE_CHOICES, unique=True)
    rate_per_tb_per_year = models.DecimalField(max_digits=10, decimal_places=2, help_text="Cost per TB per year")
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.get_name_display()} - ${self.rate_per_tb_per_year}/TB/year"

class StorageAllocation(models.Model):
    """Storage allocated to a project"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='storage_allocations')
    storage_type = models.ForeignKey(StorageType, on_delete=models.PROTECT)
    allocated_tb = models.DecimalField(max_digits=10, decimal_places=2, help_text="Storage allocated in TB")
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.project.name} - {self.allocated_tb}TB {self.storage_type.get_name_display()}"

class BillingCycle(models.Model):
    name = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    is_processed = models.BooleanField(default=False)
    processed_date = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.start_date} to {self.end_date})"

class BillingRecord(models.Model):
    """Billing record for a sponsored user assigned to a project"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cycle = models.ForeignKey(BillingCycle, on_delete=models.CASCADE, related_name='billing_records')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='billing_records')
    sponsored_user = models.ForeignKey(SponsoredUser, on_delete=models.CASCADE, related_name='billing_records', null=True, blank=True)
    rate_used = models.ForeignKey(BillingRate, on_delete=models.PROTECT, null=True, blank=True)
    prorated_days = models.IntegerField(default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    generation_date = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"Billing for {self.project.name} - {self.cycle.name}"

class StorageBillingRecord(models.Model):
    """Billing record for storage allocated to a project"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cycle = models.ForeignKey(BillingCycle, on_delete=models.CASCADE, related_name='storage_billing_records')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='storage_billing_records')
    storage_allocation = models.ForeignKey(StorageAllocation, on_delete=models.CASCADE, related_name='billing_records')
    prorated_days = models.IntegerField(default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    generation_date = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"Storage billing for {self.project.name} - {self.cycle.name}"

class SpeedcodeBillingAllocation(models.Model):
    """Distribution of billing record costs across speedcodes"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    billing_record = models.ForeignKey(BillingRecord, on_delete=models.CASCADE, related_name='speedcode_allocations', null=True, blank=True)
    storage_billing_record = models.ForeignKey(StorageBillingRecord, on_delete=models.CASCADE, related_name='speedcode_allocations', null=True, blank=True)
    project_speedcode = models.ForeignKey(ProjectSpeedcode, on_delete=models.CASCADE)
    allocated_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.project_speedcode.speedcode} - ${self.allocated_amount}"