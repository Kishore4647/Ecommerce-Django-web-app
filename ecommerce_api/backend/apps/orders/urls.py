from django.urls import path
from .views import (
    CheckoutView, OrderListView, OrderDetailView,
    UpdateOrderStatusView, CancelOrderView
)

urlpatterns = [
    path('orders/checkout/', CheckoutView.as_view(), name='checkout'),
    path('orders/', OrderListView.as_view(), name='order-list'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:pk>/status/', UpdateOrderStatusView.as_view(), name='order-update-status'),
    path('orders/<int:pk>/cancel/', CancelOrderView.as_view(), name='order-cancel'),
]
