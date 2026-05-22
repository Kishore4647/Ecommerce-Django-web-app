"""
Order Views — the most complex part of the API.

Checkout flow:
1. User has items in Cart
2. POST /api/orders/checkout/ → creates Order from Cart items
3. Cart is cleared
4. Background task sends confirmation email
"""
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.conf import settings
import uuid

from .models import Order, OrderItem, OrderStatusHistory
from .serializers import OrderSerializer, CreateOrderSerializer, UpdateOrderStatusSerializer
from apps.cart.models import Cart


def generate_order_number():
    """Generate a unique order number like ORD-2024-ABCD1234."""
    from django.utils import timezone
    year = timezone.now().year
    unique = str(uuid.uuid4()).upper()[:8]
    return f"ORD-{year}-{unique}"


class CheckoutView(APIView):
    """
    POST /api/orders/checkout/
    Convert cart items → a real order.

    Uses @transaction.atomic — if ANY step fails, ALL database changes
    are rolled back. This prevents half-created orders.
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # 1. Get the user's cart
        try:
            cart = Cart.objects.prefetch_related('items__product').get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'Cart not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not cart.items.exists():
            return Response({'error': 'Your cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Validate stock for all items BEFORE creating the order
        for cart_item in cart.items.all():
            product = cart_item.product
            if not product.is_active:
                return Response(
                    {'error': f'"{product.name}" is no longer available.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if product.stock_quantity < cart_item.quantity:
                return Response(
                    {'error': f'Only {product.stock_quantity} units of "{product.name}" available.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 3. Create the Order
        order = Order.objects.create(
            user=request.user,
            order_number=generate_order_number(),
            shipping_address=data['shipping_address'],
            shipping_city=data['shipping_city'],
            shipping_state=data['shipping_state'],
            shipping_zip=data['shipping_zip'],
            shipping_country=data.get('shipping_country', 'India'),
            payment_method=data['payment_method'],
            notes=data.get('notes', ''),
        )

        # 4. Create OrderItems (snapshot of each cart item) and reduce stock
        items_for_stock_check = []
        for cart_item in cart.items.all():
            product = cart_item.product
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,     # Snapshot!
                product_sku=product.sku,        # Snapshot!
                quantity=cart_item.quantity,
                unit_price=product.price,       # Snapshot!
            )
            # Reduce stock
            product.stock_quantity -= cart_item.quantity
            product.save()
            items_for_stock_check.append((product.id, product.stock_quantity))

        # 5. Calculate totals
        order.calculate_totals()

        # 6. Record initial status history
        OrderStatusHistory.objects.create(
            order=order,
            new_status='pending',
            changed_by=request.user,
            note='Order placed by customer.'
        )

        # 7. Clear cart
        cart.items.all().delete()

        # 8. Queue background tasks (non-blocking — returns immediately)
        from .tasks import send_order_confirmation_email, send_low_stock_alert
        send_order_confirmation_email.delay(order.id)

        # Check if any items are now low on stock
        threshold = getattr(settings, 'LOW_STOCK_THRESHOLD', 10)
        for product_id, current_stock in items_for_stock_check:
            if current_stock <= threshold:
                send_low_stock_alert.delay(product_id, current_stock)

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED
        )


class OrderListView(generics.ListAPIView):
    """GET /api/orders/ — list user's own orders (admins see all)."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            qs = Order.objects.all()
        else:
            qs = Order.objects.filter(user=self.request.user)

        # Filter by status if provided: /api/orders/?status=pending
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs.prefetch_related('items', 'status_history')


class OrderDetailView(generics.RetrieveAPIView):
    """GET /api/orders/<id>/ — single order detail."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)


class UpdateOrderStatusView(APIView):
    """
    PUT /api/orders/<id>/status/
    Admin-only: update order status and notify customer.
    """
    permission_classes = [permissions.IsAdminUser]

    def put(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateOrderStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        old_status = order.status
        new_status = serializer.validated_data['status']
        order.status = new_status
        order.save()

        # Record status change
        OrderStatusHistory.objects.create(
            order=order,
            old_status=old_status,
            new_status=new_status,
            changed_by=request.user,
            note=serializer.validated_data.get('note', '')
        )

        # Notify customer in background
        from .tasks import send_order_status_update_email
        send_order_status_update_email.delay(order.id, new_status)

        return Response(OrderSerializer(order).data)


class CancelOrderView(APIView):
    """PUT /api/orders/<id>/cancel/ — Customer cancels their own order."""
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def put(self, request, pk):
        try:
            order = Order.objects.prefetch_related('items__product').get(
                pk=pk, user=request.user
            )
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.status not in ['pending', 'confirmed']:
            return Response(
                {'error': f'Cannot cancel an order with status "{order.status}".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Restore stock
        for item in order.items.all():
            if item.product:
                item.product.stock_quantity += item.quantity
                item.product.save()

        order.status = 'cancelled'
        order.save()

        OrderStatusHistory.objects.create(
            order=order,
            old_status='pending',
            new_status='cancelled',
            changed_by=request.user,
            note='Cancelled by customer.'
        )

        return Response({'message': 'Order cancelled successfully.', 'order': OrderSerializer(order).data})
