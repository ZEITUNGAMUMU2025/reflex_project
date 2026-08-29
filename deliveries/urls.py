from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeliveryViewSet, RiderListView

router = DefaultRouter()
router.register(r'deliveries', DeliveryViewSet, basename='delivery')

urlpatterns = [
    path('', include(router.urls)),
    path('riders/', RiderListView.as_view(), name='rider-list'),
]
