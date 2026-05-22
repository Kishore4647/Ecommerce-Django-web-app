from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusHistory
import uuid


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_sku',
                  'quantity', 'unit_price', 'subtotal']


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.CharField(source='changed_by.email', read_only=True)

    class Meta:
        model = OrderStatusHistory
        fields = ['old_status', 'new_status', 'changed_by_email', 'note', 'changed_at']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user_email', 'status',
            'shipping_address', 'shipping_city', 'shipping_state',
            'shipping_zip', 'shipping_country',
            'payment_method', 'payment_status',
            'subtotal', 'shipping_cost', 'tax', 'total_amount',
            'notes', 'items', 'status_history', 'created_at'
        ]
        read_only_fields = ['id', 'order_number', 'subtotal', 'shipping_cost', 'tax',
                            'total_amount', 'created_at']


class CreateOrderSerializer(serializers.Serializer):
    """
    Used when placing an order from cart.
    We don't inherit ModelSerializer here because we're doing
    custom logic (pulling from cart, calculating totals, etc.)
    """
    shipping_address = serializers.CharField()
    shipping_city = serializers.CharField()
    shipping_state = serializers.CharField()
    shipping_zip = serializers.CharField()
    shipping_country = serializers.CharField(default='India')
    payment_method = serializers.ChoiceField(choices=['card', 'cod', 'wallet'], default='cod')
    notes = serializers.CharField(required=False, allow_blank=True)


class UpdateOrderStatusSerializer(serializers.Serializer):
    """Admin use: change order status."""
    status = serializers.ChoiceField(choices=[s[0] for s in Order.STATUS_CHOICES])
    note = serializers.CharField(required=False, allow_blank=True)
