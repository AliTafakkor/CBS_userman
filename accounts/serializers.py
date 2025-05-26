from rest_framework import serializers
from .models import Request

class RequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = ['id', 'user', 'request_type', 'data', 'status', 'admin_notes', 'approved_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'status', 'admin_notes', 'approved_by', 'created_at', 'updated_at'] 