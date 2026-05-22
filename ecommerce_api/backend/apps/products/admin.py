from django.contrib import admin
from .models import Category, Product, ProductImage, ProductReview


class ProductImageInline(admin.TabularInline):
    """Show images inside the Product admin page."""
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'price', 'stock_quantity', 'is_active', 'featured']
    list_filter = ['is_active', 'featured', 'category']
    search_fields = ['name', 'sku']
    prepopulated_fields = {'slug': ('name',)}  # Auto-fill slug from name
    inlines = [ProductImageInline]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'is_active']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(ProductReview)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'created_at']
    list_filter = ['rating']
