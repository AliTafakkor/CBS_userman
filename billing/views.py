from decimal import Decimal, ROUND_HALF_UP
from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    BillingRate, BillingCycle, BillingRecord,
    StorageType, StorageAllocation, StorageBillingRecord,
    SpeedcodeBillingAllocation,
)
from accounts.models import SponsoredUser
from .serializers import (
    BillingRateSerializer, BillingCycleSerializer, BillingRecordSerializer,
    StorageTypeSerializer, StorageAllocationSerializer,
    StorageBillingRecordSerializer, SpeedcodeBillingAllocationSerializer,
)

_CENT = Decimal('0.01')
# Average days per month (365.25 / 12) — used to convert monthly rate to daily rate.
# This ensures a quarterly cycle charges 3× the monthly rate (not 1×).
_AVG_DAYS_PER_MONTH = Decimal('365.25') / Decimal('12')


def _find_rate(user_type, cycle_start, cycle_end):
    """Return the BillingRate that covers the full cycle period, or None."""
    return BillingRate.objects.filter(
        user_type=user_type,
        effective_from__lte=cycle_start,
    ).filter(
        Q(effective_to__isnull=True) | Q(effective_to__gte=cycle_end)
    ).first()


def _charge_for_days(monthly_rate, actual_days):
    """
    Convert a monthly rate to a charge for actual_days.

    daily_rate = monthly_rate / 30.4375
    charge     = daily_rate × actual_days

    Examples:
      30 days  → ≈ 1.00 × monthly_rate
      91 days  → ≈ 2.99 × monthly_rate  (one quarter)
      15 days  → ≈ 0.49 × monthly_rate  (half month)
    """
    daily_rate = monthly_rate / _AVG_DAYS_PER_MONTH
    return (daily_rate * Decimal(actual_days)).quantize(_CENT, ROUND_HALF_UP)


def _split_across_speedcodes(speedcodes, total_amount, billing_record=None, storage_billing_record=None):
    """
    Create SpeedcodeBillingAllocation entries for each speedcode.
    Rounding remainder is assigned to the highest-percentage speedcode.
    """
    if not speedcodes:
        return

    allocations = []
    running_total = Decimal('0.00')
    sorted_codes = sorted(speedcodes, key=lambda sc: sc.allocation_percentage, reverse=True)

    for i, sc in enumerate(sorted_codes):
        if i == len(sorted_codes) - 1:
            # Last one gets the remainder to avoid rounding drift
            share = total_amount - running_total
        else:
            share = (total_amount * sc.allocation_percentage / Decimal(100)).quantize(
                _CENT, ROUND_HALF_UP
            )
        running_total += share
        allocations.append(SpeedcodeBillingAllocation(
            billing_record=billing_record,
            storage_billing_record=storage_billing_record,
            project_speedcode=sc,
            allocated_amount=share,
        ))

    SpeedcodeBillingAllocation.objects.bulk_create(allocations)


class BillingRateViewSet(viewsets.ModelViewSet):
    queryset = BillingRate.objects.all()
    serializer_class = BillingRateSerializer
    permission_classes = [permissions.IsAuthenticated]


class StorageTypeViewSet(viewsets.ModelViewSet):
    queryset = StorageType.objects.all()
    serializer_class = StorageTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class StorageAllocationViewSet(viewsets.ModelViewSet):
    queryset = StorageAllocation.objects.select_related('project', 'storage_type').all()
    serializer_class = StorageAllocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['project__name', 'storage_type__name']
    ordering_fields = ['start_date', 'allocated_tb']


class BillingCycleViewSet(viewsets.ModelViewSet):
    queryset = BillingCycle.objects.all().order_by('-start_date')
    serializer_class = BillingCycleSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=True, methods=['post'])
    def generate_billing(self, request, pk=None):
        """
        Generate (or re-generate) billing records for this cycle.

        For each active SponsoredUser:
          - Find the billing rate for their user_type
          - Prorate the monthly charge to the days they were active within the cycle
          - Create a BillingRecord and split the amount across the project's speedcodes
            proportionally to each speedcode's allocation_percentage

        For each StorageAllocation active during the cycle:
          - Compute cost = rate_per_tb_per_year * allocated_tb / 365 * actual_days
          - Create a StorageBillingRecord and split across speedcodes the same way

        The resulting SpeedcodeBillingAllocation rows are the actual per-PI bills.
        """
        cycle = self.get_object()
        if cycle.is_processed:
            return Response(
                {'error': 'Cycle already processed. Use regenerate to overwrite.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return self._run_generation(cycle)

    @action(detail=True, methods=['post'])
    def regenerate_billing(self, request, pk=None):
        """Same as generate_billing but works on already-processed cycles (overwrites)."""
        cycle = self.get_object()
        cycle.is_processed = False
        cycle.save(update_fields=['is_processed'])
        return self._run_generation(cycle)

    def _run_generation(self, cycle):
        # Wipe previous run so this is idempotent
        BillingRecord.objects.filter(cycle=cycle).delete()
        StorageBillingRecord.objects.filter(cycle=cycle).delete()

        cycle_days = (cycle.end_date - cycle.start_date).days + 1
        user_records = 0
        storage_records = 0
        skipped = []

        # ── User charges ──────────────────────────────────────────────────────
        sponsored_users = (
            SponsoredUser.objects
            .filter(status='active')
            .select_related('user', 'project', 'sponsor')
            .prefetch_related('project__speedcodes__pi')
        )

        for su in sponsored_users:
            rate = _find_rate(su.user_type, cycle.start_date, cycle.end_date)
            if not rate:
                skipped.append(f"No rate for user_type={su.user_type} ({su.user.get_full_name()})")
                continue

            eff_start = max(su.start_date, cycle.start_date)
            eff_end = min(su.end_date or cycle.end_date, cycle.end_date)
            if eff_end < eff_start:
                continue  # not active during this cycle

            actual_days = (eff_end - eff_start).days + 1
            amount = _charge_for_days(rate.rate_per_month, actual_days)

            record = BillingRecord.objects.create(
                cycle=cycle,
                project=su.project,
                sponsored_user=su,
                rate_used=rate,
                prorated_days=actual_days if actual_days < cycle_days else 0,
                total_amount=amount,
                notes=(
                    f"{'Prorated ' + str(actual_days) + ' days — ' if actual_days < cycle_days else ''}"
                    f"{su.get_user_type_display()} charge for {su.user.get_full_name()}"
                ),
            )

            speedcodes = list(su.project.speedcodes.all())
            if speedcodes:
                _split_across_speedcodes(speedcodes, amount, billing_record=record)
            user_records += 1

        # ── Storage charges ───────────────────────────────────────────────────
        allocations = (
            StorageAllocation.objects
            .select_related('project', 'storage_type')
            .prefetch_related('project__speedcodes__pi')
            .filter(
                start_date__lte=cycle.end_date,
            ).filter(
                Q(end_date__isnull=True) | Q(end_date__gte=cycle.start_date)
            )
        )

        for alloc in allocations:
            eff_start = max(alloc.start_date, cycle.start_date)
            eff_end = min(alloc.end_date or cycle.end_date, cycle.end_date)
            if eff_end < eff_start:
                continue

            actual_days = (eff_end - eff_start).days + 1
            annual_cost = alloc.storage_type.rate_per_tb_per_year * alloc.allocated_tb
            amount = (annual_cost * Decimal(actual_days) / Decimal(365)).quantize(
                _CENT, ROUND_HALF_UP
            )

            stor_record = StorageBillingRecord.objects.create(
                cycle=cycle,
                project=alloc.project,
                storage_allocation=alloc,
                prorated_days=actual_days if actual_days < cycle_days else 0,
                total_amount=amount,
                notes=(
                    f"{alloc.allocated_tb} TB {alloc.storage_type.get_name_display()} — "
                    f"{'prorated ' + str(actual_days) + ' days' if actual_days < cycle_days else 'full cycle'}"
                ),
            )

            speedcodes = list(alloc.project.speedcodes.all())
            if speedcodes:
                _split_across_speedcodes(speedcodes, amount, storage_billing_record=stor_record)
            storage_records += 1

        cycle.is_processed = True
        cycle.processed_date = timezone.now()
        cycle.save()

        return Response({
            'message': f"Generated {user_records} user billing records and {storage_records} storage records.",
            'user_records': user_records,
            'storage_records': storage_records,
            'skipped': skipped,
        })

    @action(detail=True, methods=['get'])
    def report(self, request, pk=None):
        """
        Return a per-speedcode billing report for this cycle.

        Each entry represents one PI's share of charges for the cycle,
        broken down into user charges and storage charges.
        """
        cycle = self.get_object()

        # Gather all speedcode allocations for this cycle
        user_allocs = (
            SpeedcodeBillingAllocation.objects
            .filter(billing_record__cycle=cycle)
            .select_related(
                'billing_record__sponsored_user__user',
                'billing_record__project',
                'billing_record__rate_used',
                'project_speedcode__pi__user',
                'project_speedcode__pi__department',
            )
        )

        storage_allocs = (
            SpeedcodeBillingAllocation.objects
            .filter(storage_billing_record__cycle=cycle)
            .select_related(
                'storage_billing_record__storage_allocation__storage_type',
                'storage_billing_record__project',
                'project_speedcode__pi__user',
                'project_speedcode__pi__department',
            )
        )

        # Build per-speedcode buckets
        buckets = {}  # speedcode_str -> dict

        def _get_bucket(sc):
            key = sc.speedcode
            if key not in buckets:
                pi = sc.pi
                buckets[key] = {
                    'speedcode': key,
                    'pi_id': pi.id,
                    'pi_name': pi.user.get_full_name() or pi.user.username,
                    'department': pi.department.name if pi.department else '—',
                    'user_charges': [],
                    'storage_charges': [],
                }
            return buckets[key]

        for ua in user_allocs:
            b = _get_bucket(ua.project_speedcode)
            su = ua.billing_record.sponsored_user
            b['user_charges'].append({
                'user': su.user.get_full_name() if su else '—',
                'user_type': su.get_user_type_display() if su else '—',
                'project': ua.billing_record.project.name if ua.billing_record.project else '—',
                'amount': str(ua.allocated_amount),
                'prorated_days': ua.billing_record.prorated_days,
            })

        for sa in storage_allocs:
            b = _get_bucket(sa.project_speedcode)
            alloc = sa.storage_billing_record.storage_allocation
            b['storage_charges'].append({
                'project': sa.storage_billing_record.project.name,
                'allocated_tb': str(alloc.allocated_tb),
                'storage_type': alloc.storage_type.get_name_display(),
                'amount': str(sa.allocated_amount),
                'prorated_days': sa.storage_billing_record.prorated_days,
            })

        # Compute totals
        report = []
        for b in sorted(buckets.values(), key=lambda x: x['pi_name']):
            subtotal_users = sum(Decimal(c['amount']) for c in b['user_charges'])
            subtotal_storage = sum(Decimal(c['amount']) for c in b['storage_charges'])
            report.append({
                **b,
                'subtotal_users': str(subtotal_users),
                'subtotal_storage': str(subtotal_storage),
                'total': str(subtotal_users + subtotal_storage),
            })

        return Response({
            'cycle': BillingCycleSerializer(cycle).data,
            'report': report,
            'grand_total': str(sum(Decimal(r['total']) for r in report)),
        })


class BillingRecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BillingRecord.objects.select_related(
        'cycle', 'project', 'sponsored_user__user', 'rate_used'
    ).all()
    serializer_class = BillingRecordSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['project__name', 'sponsored_user__user__last_name']
    ordering_fields = ['generation_date', 'total_amount']
