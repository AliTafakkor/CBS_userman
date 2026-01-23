from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Department, PrincipalInvestigator, SponsoredUser, UserChangeRecord, Project, ProjectSpeedcode

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active']

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(queryset=PrincipalInvestigator.objects.all())
    owner_name = serializers.CharField(source='owner.user.get_full_name', read_only=True)
    collaborating_pis = serializers.PrimaryKeyRelatedField(many=True, queryset=PrincipalInvestigator.objects.all(), required=False)
    
    class Meta:
        model = Project
        fields = '__all__'

class ProjectSpeedcodeSerializer(serializers.ModelSerializer):
    pi_name = serializers.CharField(source='pi.user.get_full_name', read_only=True)
    
    class Meta:
        model = ProjectSpeedcode
        fields = '__all__'

class PrincipalInvestigatorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    department_id = serializers.IntegerField(write_only=True)
    default_project = ProjectSerializer(read_only=True)
    
    class Meta:
        model = PrincipalInvestigator
        fields = '__all__'

class SponsoredUserSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    sponsor = PrincipalInvestigatorSerializer(read_only=True)
    sponsor_id = serializers.IntegerField(write_only=True)
    project = ProjectSerializer(read_only=True)
    project_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = SponsoredUser
        fields = '__all__'

class UserChangeRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserChangeRecord
        fields = '__all__'