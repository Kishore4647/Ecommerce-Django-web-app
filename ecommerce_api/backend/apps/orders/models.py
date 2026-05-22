"""
Order Models
Order → OrderItem (snapshot of product at time of purchase)

IMPORTANT: We copy price into OrderItem at checkout time.
If the product price changes later, old orders still show the correct price paid.
"""
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('card', 'Credit/Debit Card'),
        ('cod', 'Cash on Delivery'),
        ('wallet', 'Digital Wallet'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='orders')
    order_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Shipping address snapshot (copied at order time)
    shipping_address = models.TextField()
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100)
    shipping_zip = models.CharField(max_length=20)
    shipping_country = models.CharField(max_length=100, default='India')

    # Payment
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cod')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_id = models.CharField(max_length=200, blank=True)  # From payment gateway

    # Pricing
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.order_number}"

    def calculate_totals(self):
        """Recalculate order totals from its items."""
        self.subtotal = sum(item.subtotal for item in self.items.all())
        self.tax = self.subtotal * Decimal('0.18')  # 18% GST
        self.shipping_cost = Decimal('0') if self.subtotal > 500 else Decimal('50')
        self.total_amount = self.subtotal + self.tax + self.shipping_cost
        self.save()


class OrderItem(models.Model):
    """
    A snapshot of a product at the time of ordering.
    We store product_name and unit_price here so the order history
    remains accurate even if the product is renamed or repriced later.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.SET_NULL,  # Keep order item even if product is deleted
        null=True
    )
    product_name = models.CharField(max_length=500)   # Snapshot
    product_sku = models.CharField(max_length=100)    # Snapshot
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)  # Price at time of order

    class Meta:
        db_table = 'order_items'

    def __str__(self):
        return f"{self.quantity}x {self.product_name}"

    @property
    def subtotal(self):
        return self.unit_price * self.quantity


class OrderStatusHistory(models.Model):
    """Track every status change for audit trail / customer visibility."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    note = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'order_status_history'
        ordering = ['-changed_at']
