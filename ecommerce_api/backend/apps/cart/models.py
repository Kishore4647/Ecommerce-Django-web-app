"""
Cart Models
Each user has ONE cart, which has MANY cart items.
Cart → CartItem → Product
"""
from django.db import models
from django.core.validators import MinValueValidator


class Cart(models.Model):
    """
    One cart per user. OneToOneField means: one User → one Cart.
    (ForeignKey would allow multiple carts per user.)
    """
    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='cart'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'carts'

    def __str__(self):
        return f"Cart of {self.user.email}"

    @property
    def total_price(self):
        """Sum up price × quantity for all items."""
        return sum(item.subtotal for item in self.items.all())

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)]
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cart_items'
        unique_together = ['cart', 'product']   # Can't add same product twice

    def __str__(self):
        return f"{self.quantity}x {self.product.name}"

    @property
    def subtotal(self):
        return self.product.price * self.quantity
