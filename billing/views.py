from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import BillingRate, BillingCycle, BillingRecord, StorageType, StorageAllocation, StorageBillingRecord, SpeedcodeBillingAllocation
from accounts.models import PrincipalInvestigator, SponsoredUser, Project, ProjectSpeedcode
from .serializers import (
    BillingRateSerializer, BillingCycleSerializer, BillingRecordSerializer,
    StorageTypeSerializer, StorageAllocationSerializer, StorageBillingRecordSerializer,
    SpeedcodeBillingAllocationSerializer
)
from django.utils import timezone
import datetime
from decimal import Decimal

class BillingRateViewSet(viewsets.ModelViewSet):
    queryset = BillingRate.objects.all()
    serializer_class = BillingRateSerializer
    permission_classes = [permissions.IsAuthenticated]

class StorageTypeViewSet(viewsets.ModelViewSet):
    queryset = StorageType.objects.all()
    serializer_class = StorageTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

class StorageAllocationViewSet(viewsets.ModelViewSet):
    queryset = StorageAllocation.objects.all()
    serializer_class = StorageAllocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['project__name', 'storage_type__name']
    ordering_fields = ['start_date', 'allocated_tb']

class BillingCycleViewSet(viewsets.ModelViewSet):
    queryset = BillingCycle.objects.all()
    serializer_class = BillingCycleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def generate_billing(self, request, pk=None):
        """Generate billing records for all active users in this cycle"""
        cycle = self.get_object()
        if cycle.is_processed:
            return Response({"error": "This billing cycle has already been processed"}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Clear any existing billing records for this cycle
        BillingRecord.objects.filter(cycle=cycle).delete()
        
        # Get all active sponsored users
        sponsored_users = SponsoredUser.objects.filter(status='active')
        records_created = 0
        
        for sponsored_user in sponsored_users:
            # Find applicable rate
            try:
                rate = BillingRate.objects.filter(
                    user_type=sponsored_user.user_type,
                    effective_from__lte=cycle.start_date,
                    effective_to__gte=cycle.end_date
                ).first()
                
                if not rate:
                    # Try to find a rate with no end date
                    rate = BillingRate.objects.filter(
                        user_type=sponsored_user.user_type,
                        effective_from__lte=cycle.start_date,
                        effective_to=None
                    ).first()
                
                if not rate:
                    # Skip if no applicable rate
                    continue
                
                # Calculate prorated days if necessary
                start_date = max(sponsored_user.start_date, cycle.start_date)
                end_date = cycle.end_date
                if sponsored_user.end_date and sponsored_user.end_date < cycle.end_date:
                    end_date = sponsored_user.end_date
                
                # Calculate days in cycle
                cycle_days = (cycle.end_date - cycle.start_date).days + 1
                actual_days = (end_date - start_date).days + 1
                
                # Skip if user wasn't active during this cycle
                if actual_days <= 0:
                    continue
                
                # Calculate amount
                if actual_days < cycle_days:
                    # Prorated billing
                    daily_rate = rate.rate_per_month / Decimal(30)  # Simplified
                    amount = daily_rate * Decimal(actual_days)
                else:
                    # Full billing
                    amount = rate.rate_per_month
                
                # Create billing record
                BillingRecord.objects.create(
                    cycle=cycle,
                    pi=sponsored_user.sponsor,
                    sponsored_user=sponsored_user,
                    rate_used=rate,
                    prorated_days=actual_days if actual_days < cycle_days else 0,
                    total_amount=amount.quantize(Decimal('0.01')),
                    notes=f"Generated for {cycle.name}"
                )
                records_created += 1
                
            except Exception as e:
                print(f"Error processing user {sponsored_user}: {str(e)}")
                continue
        
        # Mark cycle as processed
        cycle.is_processed = True
        cycle.processed_date = timezone.now()
        cycle.save()
        
        return Response({
            "message": f"Successfully generated {records_created} billing records",
            "records_created": records_created
        })

class BillingRecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BillingRecord.objects.all()
    serializer_class = BillingRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['pi__user__last_name', 'sponsored_user__user__last_name']
    ordering_fields = ['generation_date', 'total_amount']
    
    @action(detail=False, methods=['get'])
    def pi_summary(self, request):
        """Get billing summary by PI"""
        cycle_id = request.query_params.get('cycle_id', None)
        
        queryset = BillingRecord.objects.all()
        if cycle_id:
            queryset = queryset.filter(cycle_id=cycle_id)
            
        # Group by PI and sum amounts
        pi_summary = []
        pis = PrincipalInvestigator.objects.all()
        
        for pi in pis:
            pi_records = queryset.filter(pi=pi)
            total = pi_records.aggregate(total=Sum('total_amount'))['total'] or 0
            user_count = pi_records.values('sponsored_user').distinct().count()
            
            if total > 0:
                pi_summary.append({
                    'pi_id': pi.id,
                    'pi_name': pi.user.get_full_name(),
                    'department': pi.department.name if pi.department else 'N/A',
                    'total_amount': total,
                    'user_count': user_count
                })
                
        return Response(pi_summary)