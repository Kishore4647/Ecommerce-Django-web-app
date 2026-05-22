from django.contrib import admin
from .models import InventoryLog


@admin.register(InventoryLog)
class InventoryLogAdmin(admin.ModelAdmin):
    list_display = ['product', 'adjustment_type', 'quantity_change', 'stock_after', 'created_by', 'created_at']
    list_filter = ['adjustment_type']
    search_fields = ['product__name', 'reference']
    readonly_fields = ['stock_before', 'stock_after', 'created_at']
