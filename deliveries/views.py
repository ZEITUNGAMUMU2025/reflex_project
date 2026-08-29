from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Delivery, DeliveryStatusHistory
from .serializers import DeliverySerializer, UserSerializer
from .permissions import IsRetailer, IsDispatcher, IsRider, DeliveryPermission
from django.contrib.auth import get_user_model

User = get_user_model()

class DeliveryViewSet(viewsets.ModelViewSet):
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated, DeliveryPermission]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'RETAILER':
            return Delivery.objects.filter(retailer=user).order_by('-created_at')
        elif user.role == 'DISPATCHER':
            return Delivery.objects.all().order_by('-created_at')
        elif user.role == 'RIDER':
            return Delivery.objects.filter(rider=user).order_by('-created_at')
        return Delivery.objects.none()

    def perform_create(self, serializer):
        serializer.save(retailer=self.request.user, status='PENDING')
        
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsDispatcher])
    def assign(self, request, pk=None):
        delivery = self.get_object()
        if delivery.status != 'PENDING':
            return Response({'detail': 'Can only assign PENDING deliveries.'}, status=status.HTTP_400_BAD_REQUEST)
            
        rider_id = request.data.get('rider_id')
        try:
            rider = User.objects.get(id=rider_id, role='RIDER')
        except User.DoesNotExist:
            return Response({'detail': 'Invalid rider ID.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Update delivery
        old_status = delivery.status
        delivery.rider = rider
        delivery.status = 'ASSIGNED'
        delivery.save()
        
        # History
        DeliveryStatusHistory.objects.create(
            delivery=delivery,
            old_status=old_status,
            new_status='ASSIGNED',
            changed_by=request.user
        )
        
        return Response(DeliverySerializer(delivery).data)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsRider])
    def status(self, request, pk=None):
        delivery = self.get_object()
        new_status = request.data.get('status')
        old_status = delivery.status
        
        # Strict validation
        if old_status == 'ASSIGNED' and new_status == 'PICKED_UP':
            delivery.status = new_status
        elif old_status == 'PICKED_UP' and new_status == 'DELIVERED':
            delivery.status = new_status
            delivery.delivered_at = timezone.now()
        else:
            return Response({'detail': f'Invalid transition from {old_status} to {new_status}'}, status=status.HTTP_400_BAD_REQUEST)
            
        delivery.save()
        
        # History
        DeliveryStatusHistory.objects.create(
            delivery=delivery,
            old_status=old_status,
            new_status=new_status,
            changed_by=request.user
        )
        
        return Response(DeliverySerializer(delivery).data)

class RiderListView(views.APIView):
    permission_classes = [IsAuthenticated, IsDispatcher]
    
    def get(self, request):
        riders = User.objects.filter(role='RIDER')
        serializer = UserSerializer(riders, many=True)
        return Response(serializer.data)
