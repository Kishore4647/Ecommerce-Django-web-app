from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductReview


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'parent', 'product_count']

    def get_product_count(self, obj):
        """Count active products in this category."""
        return obj.products.filter(is_active=True).count()


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'order']


class ProductReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = ProductReview
        fields = ['id', 'user_name', 'user_email', 'rating', 'title', 'comment', 'created_at']
        read_only_fields = ['id', 'user_name', 'user_email', 'created_at']


class ProductListSerializer(serializers.ModelSerializer):
    """Compact serializer for listing products (less data = faster API)."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    main_image = serializers.ReadOnlyField()   # calls the @property on the model

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'price', 'stock_quantity',
                  'in_stock', 'main_image', 'category_name', 'featured']


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full serializer for a single product (more data)."""
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False
    )
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'sku',
            'stock_quantity', 'in_stock', 'is_active', 'featured',
            'weight', 'category', 'category_id', 'images',
            'reviews', 'avg_rating', 'review_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'in_stock', 'created_at', 'updated_at']

    def get_avg_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews.exists():
            return None
        total = sum(r.rating for r in reviews)
        return round(total / reviews.count(), 1)

    def get_review_count(self, obj):
        return obj.reviews.count()
