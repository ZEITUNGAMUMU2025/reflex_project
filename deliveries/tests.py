from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Delivery, DeliveryStatusHistory

User = get_user_model()

class DeliveryAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create users
        self.retailer = User.objects.create_user(username='retailer1', password='password123', role='RETAILER')
        self.dispatcher = User.objects.create_user(username='dispatcher1', password='password123', role='DISPATCHER')
        self.rider1 = User.objects.create_user(username='rider1', password='password123', role='RIDER')
        self.rider2 = User.objects.create_user(username='rider2', password='password123', role='RIDER')

    def test_retailer_can_create_delivery(self):
        self.client.force_authenticate(user=self.retailer)
        response = self.client.post('/api/deliveries/', {
            'customer_name': 'John Doe',
            'customer_phone': '123456789',
            'delivery_address': '123 Main St',
            'item_description': 'A package'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'PENDING')
        self.assertEqual(Delivery.objects.count(), 1)

    def test_dispatcher_can_assign_rider(self):
        delivery = Delivery.objects.create(
            retailer=self.retailer,
            customer_name='John',
            customer_phone='123',
            delivery_address='Address',
            item_description='Item',
            status='PENDING'
        )
        
        self.client.force_authenticate(user=self.dispatcher)
        response = self.client.post(f'/api/deliveries/{delivery.id}/assign/', {'rider_id': self.rider1.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        delivery.refresh_from_db()
        self.assertEqual(delivery.status, 'ASSIGNED')
        self.assertEqual(delivery.rider, self.rider1)

    def test_non_dispatcher_cannot_assign(self):
        delivery = Delivery.objects.create(
            retailer=self.retailer, customer_name='John', customer_phone='123',
            delivery_address='Address', item_description='Item', status='PENDING'
        )
        self.client.force_authenticate(user=self.retailer)
        response = self.client.post(f'/api/deliveries/{delivery.id}/assign/', {'rider_id': self.rider1.id})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_rider_can_update_status(self):
        delivery = Delivery.objects.create(
            retailer=self.retailer, rider=self.rider1, customer_name='John',
            customer_phone='123', delivery_address='Address', item_description='Item',
            status='ASSIGNED'
        )
        
        self.client.force_authenticate(user=self.rider1)
        
        # ASSIGNED -> PICKED_UP
        response = self.client.patch(f'/api/deliveries/{delivery.id}/status/', {'status': 'PICKED_UP'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        delivery.refresh_from_db()
        self.assertEqual(delivery.status, 'PICKED_UP')
        
        # PICKED_UP -> DELIVERED
        response2 = self.client.patch(f'/api/deliveries/{delivery.id}/status/', {'status': 'DELIVERED'})
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        delivery.refresh_from_db()
        self.assertEqual(delivery.status, 'DELIVERED')
        self.assertIsNotNone(delivery.delivered_at)

    def test_invalid_status_transition(self):
        delivery = Delivery.objects.create(
            retailer=self.retailer, rider=self.rider1, customer_name='John',
            customer_phone='123', delivery_address='Address', item_description='Item',
            status='PENDING'
        )
        self.client.force_authenticate(user=self.rider1)
        
        # PENDING -> DELIVERED is invalid
        response = self.client.patch(f'/api/deliveries/{delivery.id}/status/', {'status': 'DELIVERED'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
