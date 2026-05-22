from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import serializers
from django.db import transaction
from django.conf import settings
from .models import InventoryLog
from apps.products.models import Product


class InventoryLogSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)

    class Meta:
        model = InventoryLog
        fields = [
            'id', 'product', 'product_name', 'adjustment_type',
            'quantity_change', 'stock_before', 'stock_after',
            'reference', 'notes', 'created_by_email', 'created_at'
        ]


class AdjustStockSerializer(serializers.Serializer):
    """Validate incoming stock adjustment requests."""
    product_id = serializers.IntegerField()
    quantity_change = serializers.IntegerField()  # Can be negative
    adjustment_type = serializers.ChoiceField(
        choices=['restock', 'sale', 'return', 'damage', 'correction']
    )
    reference = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class StockAdjustView(APIView):
    """
    POST /api/inventory/adjust/
    Admin-only: manually adjust stock for a product.
    Automatically sends low-stock alert if threshold is crossed.
    """
    permission_classes = [permissions.IsAdminUser]

    @transaction.atomic
    def post(self, request):
        serializer = AdjustStockSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            product = Product.objects.get(id=data['product_id'])
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        stock_before = product.stock_quantity
        new_stock = stock_before + data['quantity_change']

        if new_stock < 0:
            return Response(
                {'error': f'Cannot reduce stock below 0. Current stock: {stock_before}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update stock
        product.stock_quantity = new_stock
        product.save()

        # Log the change
        log = InventoryLog.objects.create(
            product=product,
            adjustment_type=data['adjustment_type'],
            quantity_change=data['quantity_change'],
            stock_before=stock_before,
            stock_after=new_stock,
            reference=data.get('reference', ''),
            notes=data.get('notes', ''),
            created_by=request.user,
        )

        # Send low stock alert if needed
        threshold = getattr(settings, 'LOW_STOCK_THRESHOLD', 10)
        if new_stock <= threshold and stock_before > threshold:
            from apps.orders.tasks import send_low_stock_alert
            send_low_stock_alert.delay(product.id, new_stock)

        return Response(InventoryLogSerializer(log).data, status=status.HTTP_201_CREATED)


class InventoryLogListView(generics.ListAPIView):
    """GET /api/inventory/logs/?product_id=5 — view stock history."""
    serializer_class = InventoryLogSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = InventoryLog.objects.select_related('product', 'created_by')
        product_id = self.request.query_params.get('product_id')
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs


class LowStockProductsView(APIView):
    """GET /api/inventory/low-stock/ — products below threshold."""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        threshold = getattr(settings, 'LOW_STOCK_THRESHOLD', 10)
        products = Product.objects.filter(
            stock_quantity__lte=threshold,
            is_active=True
        ).values('id', 'name', 'sku', 'stock_quantity')

        return Response({
            'threshold': threshold,
            'count': products.count(),
            'products': list(products)
        })
