"""
Inventory Models
Tracks stock adjustments over time — useful for audit trail.
Every stock change (restock, damage, sale) is recorded here.
"""
from django.db import models


class InventoryLog(models.Model):
    """
    Every time stock changes, we record WHY it changed.
    This gives us a full history: "Who added 50 units on what date?"
    """
    ADJUSTMENT_TYPE_CHOICES = [
        ('restock', 'Restock'),
        ('sale', 'Sale'),
        ('return', 'Customer Return'),
        ('damage', 'Damaged/Lost'),
        ('correction', 'Manual Correction'),
    ]

    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='inventory_logs'
    )
    adjustment_type = models.CharField(max_length=20, choices=ADJUSTMENT_TYPE_CHOICES)
    quantity_change = models.IntegerField()   # Positive = added, Negative = removed
    stock_before = models.IntegerField()
    stock_after = models.IntegerField()
    reference = models.CharField(max_length=200, blank=True)  # e.g. order number
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='inventory_adjustments'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'inventory_logs'
        ordering = ['-created_at']

    def __str__(self):
        sign = '+' if self.quantity_change > 0 else ''
        return f'{self.product.name}: {sign}{self.quantity_change} ({self.adjustment_type})'
