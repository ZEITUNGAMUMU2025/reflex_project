from django.db import models
from django.conf import settings

class Delivery(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('ASSIGNED', 'Assigned'),
        ('PICKED_UP', 'Picked Up'),
        ('DELIVERED', 'Delivered'),
    )
    
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=20)
    delivery_address = models.TextField()
    item_description = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    retailer = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='retailer_deliveries', on_delete=models.CASCADE)
    rider = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='rider_deliveries', on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Delivery #{self.id} for {self.customer_name}"

class DeliveryStatusHistory(models.Model):
    delivery = models.ForeignKey(Delivery, related_name='status_history', on_delete=models.CASCADE)
    old_status = models.CharField(max_length=20, null=True, blank=True)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Delivery #{self.delivery.id} status changed to {self.new_status}"
