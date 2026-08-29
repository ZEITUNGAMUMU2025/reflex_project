from rest_framework import serializers
from .models import Delivery, DeliveryStatusHistory
from django.contrib.auth import get_user_model

User = get_user_model()

class DeliverySerializer(serializers.ModelSerializer):
    rider_name = serializers.CharField(source='rider.username', read_only=True)
    retailer_name = serializers.CharField(source='retailer.username', read_only=True)

    class Meta:
        model = Delivery
        fields = '__all__'
        read_only_fields = ('retailer', 'rider', 'status', 'created_at', 'updated_at', 'delivered_at')

class DeliveryStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.username', read_only=True)

    class Meta:
        model = DeliveryStatusHistory
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'role']
