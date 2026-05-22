from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from apps.products.models import Product


def get_or_create_cart(user):
    """Get user's cart, or create one if they don't have one yet."""
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class CartView(APIView):
    """
    GET  /api/cart/       → view cart contents
    DELETE /api/cart/     → clear entire cart
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart = get_or_create_cart(request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def delete(self, request):
        cart = get_or_create_cart(request.user)
        cart.items.all().delete()
        return Response({'message': 'Cart cleared.'}, status=status.HTTP_200_OK)


class CartItemView(APIView):
    """
    POST /api/cart/items/          → add item
    PUT  /api/cart/items/<id>/     → update quantity
    DELETE /api/cart/items/<id>/   → remove item
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Add product to cart (or increase quantity if already there)."""
        cart = get_or_create_cart(request.user)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        if product.stock_quantity < quantity:
            return Response(
                {'error': f'Only {product.stock_quantity} units available.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # get_or_create returns (object, created_boolean)
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, product=product,
            defaults={'quantity': quantity}
        )

        if not created:
            # Product already in cart — increase quantity
            cart_item.quantity += quantity
            cart_item.save()

        serializer = CartSerializer(cart)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request, item_id):
        """Update cart item quantity."""
        try:
            cart_item = CartItem.objects.get(id=item_id, cart__user=request.user)
        except CartItem.DoesNotExist:
            return Response({'error': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)

        quantity = int(request.data.get('quantity', 1))
        if quantity < 1:
            cart_item.delete()
            return Response({'message': 'Item removed from cart.'})

        if cart_item.product.stock_quantity < quantity:
            return Response(
                {'error': f'Only {cart_item.product.stock_quantity} units available.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart_item.quantity = quantity
        cart_item.save()
        serializer = CartSerializer(cart_item.cart)
        return Response(serializer.data)

    def delete(self, request, item_id):
        """Remove a single item from cart."""
        try:
            cart_item = CartItem.objects.get(id=item_id, cart__user=request.user)
            cart_item.delete()
            return Response({'message': 'Item removed.'})
        except CartItem.DoesNotExist:
            return Response({'error': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)
