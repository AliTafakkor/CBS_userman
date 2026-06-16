from decimal import Decimal
from django.db.models import Sum
from rest_framework import serializers
from .models import (
    BillingRate, BillingCycle, BillingRecord,
    StorageType, StorageAllocation, StorageBillingRecord,
    SpeedcodeBillingAllocation,
)
from accounts.serializers import ProjectSerializer


class BillingRateSerializer(serializers.ModelSerializer):
    user_type_display = serializers.SerializerMethodField()

    class Meta:
        model = BillingRate
        fields = '__all__'

    def get_user_type_display(self, obj):
        choices = {'basic': 'Basic', 'poweruser': 'Power User'}
        return choices.get(obj.user_type, obj.user_type)


class StorageTypeSerializer(serializers.ModelSerializer):
    name_display = serializers.SerializerMethodField()

    class Meta:
        model = StorageType
        fields = '__all__'

    def get_name_display(self, obj):
        return obj.get_name_display()


class StorageAllocationSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)
    project_id = serializers.IntegerField(write_only=True)
    storage_type = StorageTypeSerializer(read_only=True)
    storage_type_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = StorageAllocation
        fields = '__all__'


class BillingCycleSerializer(serializers.ModelSerializer):
    user_record_count = serializers.SerializerMethodField()
    storage_record_count = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()

    class Meta:
        model = BillingCycle
        fields = '__all__'

    def get_user_record_count(self, obj):
        return obj.billing_records.count()

    def get_storage_record_count(self, obj):
        return obj.storage_billing_records.count()

    def get_grand_total(self, obj):
        user_total = obj.billing_records.aggregate(t=Sum('total_amount'))['t'] or Decimal('0')
        stor_total = obj.storage_billing_records.aggregate(t=Sum('total_amount'))['t'] or Decimal('0')
        return str((user_total + stor_total).quantize(Decimal('0.01')))


class BillingRecordSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)
    sponsored_user_name = serializers.SerializerMethodField()
    rate_display = serializers.SerializerMethodField()

    class Meta:
        model = BillingRecord
        fields = '__all__'

    def get_sponsored_user_name(self, obj):
        if obj.sponsored_user:
            return obj.sponsored_user.user.get_full_name()
        return None

    def get_rate_display(self, obj):
        if obj.rate_used:
            return f"${obj.rate_used.rate_per_month}/month ({obj.rate_used.user_type})"
        return None


class StorageBillingRecordSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)

    class Meta:
        model = StorageBillingRecord
        fields = '__all__'


class SpeedcodeBillingAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpeedcodeBillingAllocation
        fields = '__all__'
