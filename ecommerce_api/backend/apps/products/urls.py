from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet

# Router automatically creates these URLs from a ViewSet:
# /api/products/          GET (list), POST (create)
# /api/products/<slug>/   GET (retrieve), PUT (update), DELETE (destroy)
router = DefaultRouter()
router.register('products', ProductViewSet, basename='product')
router.register('categories', CategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),
]
