from django.db import models
from accounts.models import PrincipalInvestigator, SponsoredUser
import uuid
from django.utils import timezone

class BillingRate(models.Model):
    user_type = models.CharField(max_length=50)
    rate_per_month = models.DecimalField(max_digits=10, decimal_places=2)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user_type} - ${self.rate_per_month}/month"

class BillingCycle(models.Model):
    name = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    is_processed = models.BooleanField(default=False)
    processed_date = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.start_date} to {self.end_date})"

class BillingRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cycle = models.ForeignKey(BillingCycle, on_delete=models.CASCADE, related_name='billing_records')
    pi = models.ForeignKey(PrincipalInvestigator, on_delete=models.CASCADE, related_name='billing_records')
    sponsored_user = models.ForeignKey(SponsoredUser, on_delete=models.CASCADE, related_name='billing_records')
    rate_used = models.ForeignKey(BillingRate, on_delete=models.PROTECT)
    prorated_days = models.IntegerField(default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    generation_date = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"Billing for {self.sponsored_user} - {self.cycle.name}"