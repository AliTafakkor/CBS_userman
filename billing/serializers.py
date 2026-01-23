from rest_framework import serializers
from .models import BillingRate, BillingCycle, BillingRecord, StorageType, StorageAllocation, StorageBillingRecord, SpeedcodeBillingAllocation
from accounts.serializers import PrincipalInvestigatorSerializer, SponsoredUserSerializer, ProjectSerializer

class BillingRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingRate
        fields = '__all__'

class StorageTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = StorageType
        fields = '__all__'

class StorageAllocationSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)
    project_id = serializers.IntegerField(write_only=True)
    storage_type = StorageTypeSerializer(read_only=True)
    storage_type_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = StorageAllocation
        fields = '__all__'

class BillingCycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingCycle
        fields = '__all__'

class BillingRecordSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)
    sponsored_user = SponsoredUserSerializer(read_only=True)
    rate_used = BillingRateSerializer(read_only=True)
    
    class Meta:
        model = BillingRecord
        fields = '__all__'

class StorageBillingRecordSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)
    storage_allocation = StorageAllocationSerializer(read_only=True)
    
    class Meta:
        model = StorageBillingRecord
        fields = '__all__'

class SpeedcodeBillingAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpeedcodeBillingAllocation
        fields = '__all__'