from django.urls import path
from .views import StockAdjustView, InventoryLogListView, LowStockProductsView

urlpatterns = [
    path('inventory/adjust/', StockAdjustView.as_view(), name='inventory-adjust'),
    path('inventory/logs/', InventoryLogListView.as_view(), name='inventory-logs'),
    path('inventory/low-stock/', LowStockProductsView.as_view(), name='low-stock'),
]
