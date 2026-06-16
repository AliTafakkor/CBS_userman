from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Department, PrincipalInvestigator, SponsoredUser,
    UserChangeRecord, Project, ProjectSpeedcode, Request,
)


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
    collaborating_pis = serializers.PrimaryKeyRelatedField(
        many=True, queryset=PrincipalInvestigator.objects.all(), required=False
    )

    class Meta:
        model = Project
        fields = '__all__'


class ProjectSpeedcodeSerializer(serializers.ModelSerializer):
    pi_name = serializers.CharField(source='pi.user.get_full_name', read_only=True)
    pi_speedcode = serializers.CharField(source='pi.speedcode', read_only=True)

    class Meta:
        model = ProjectSpeedcode
        fields = '__all__'
        read_only_fields = ['authorized_date']

    def validate(self, data):
        pi = data.get('pi')
        speedcode = data.get('speedcode')
        if pi and speedcode and speedcode != pi.speedcode:
            raise serializers.ValidationError({
                'speedcode': (
                    f'Speedcode "{speedcode}" does not belong to PI {pi.user.get_full_name()}. '
                    f'This PI owns speedcode: {pi.speedcode}'
                )
            })
        return data


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


class RequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = ['id', 'user', 'request_type', 'data', 'status', 'admin_notes', 'approved_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'status', 'admin_notes', 'approved_by', 'created_at', 'updated_at']
