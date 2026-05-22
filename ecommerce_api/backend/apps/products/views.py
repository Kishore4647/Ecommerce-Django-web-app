"""
ViewSets bundle list + detail actions into one class.
ModelViewSet gives us: list, retrieve, create, update, partial_update, destroy.
We can restrict which actions are available using http_method_names or mixins.
"""
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters import rest_framework as filters
from .models import Category, Product, ProductReview
from .serializers import (
    CategorySerializer, ProductListSerializer,
    ProductDetailSerializer, ProductReviewSerializer
)


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission: anyone can READ (GET), only admins can WRITE (POST/PUT/DELETE).
    This keeps the product catalog public but protected from tampering.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:  # GET, HEAD, OPTIONS
            return True
        return request.user.is_authenticated and request.user.is_staff


class ProductFilter(filters.FilterSet):
    """
    Allows URL filtering: /api/products/?min_price=10&max_price=100&category=5
    django-filter builds the queryset WHERE clause from these fields automatically.
    """
    min_price = filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = filters.NumberFilter(field_name='price', lookup_expr='lte')
    in_stock = filters.BooleanFilter(method='filter_in_stock')
    category = filters.NumberFilter(field_name='category__id')

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock_quantity__gt=0)
        return queryset.filter(stock_quantity=0)

    class Meta:
        model = Product
        fields = ['category', 'featured', 'is_active']


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'   # /api/categories/electronics/ instead of /api/categories/1/


class ProductViewSet(viewsets.ModelViewSet):
    """
    /api/products/          → list all products
    /api/products/<slug>/   → single product detail
    /api/products/<slug>/reviews/ → custom action (see below)
    """
    queryset = Product.objects.filter(is_active=True).select_related('category').prefetch_related('images', 'reviews')
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'sku']
    ordering_fields = ['price', 'created_at', 'stock_quantity']

    def get_serializer_class(self):
        """Use compact serializer for lists, full serializer for detail view."""
        if self.action == 'list':
            return ProductListSerializer
        return ProductDetailSerializer

    @action(detail=True, methods=['get', 'post'], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def reviews(self, request, slug=None):
        """
        Custom action: GET /api/products/<slug>/reviews/ → list reviews
                       POST /api/products/<slug>/reviews/ → add review
        @action decorator turns this method into a new URL endpoint.
        """
        product = self.get_object()

        if request.method == 'GET':
            reviews = product.reviews.all()
            serializer = ProductReviewSerializer(reviews, many=True)
            return Response(serializer.data)

        serializer = ProductReviewSerializer(data=request.data)
        if serializer.is_valid():
            # Check user hasn't already reviewed this product
            if ProductReview.objects.filter(product=product, user=request.user).exists():
                return Response(
                    {'error': 'You have already reviewed this product.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            serializer.save(product=product, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """GET /api/products/featured/ → return featured products."""
        featured = Product.objects.filter(is_active=True, featured=True)
        serializer = ProductListSerializer(featured, many=True)
        return Response(serializer.data)
