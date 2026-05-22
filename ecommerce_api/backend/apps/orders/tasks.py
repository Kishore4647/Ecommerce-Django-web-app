"""
Celery Background Tasks

These functions run OUTSIDE the web request cycle.
When order is placed:
1. API returns response immediately (fast)
2. Celery worker picks up this task from Redis queue
3. Worker runs the task in the background (email sending, stock checks)

Why? Sending emails can take 1-3 seconds. We don't want users to wait.
"""
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_confirmation_email(self, order_id):
    """
    Send order confirmation email to customer.
    bind=True gives us access to `self` for retry logic.
    max_retries=3: if it fails, try again 3 times.
    default_retry_delay=60: wait 60 seconds between retries.
    """
    try:
        from apps.orders.models import Order
        order = Order.objects.select_related('user').prefetch_related('items').get(id=order_id)

        subject = f'Order Confirmed - #{order.order_number}'

        # Build item list for email body
        items_text = '\n'.join([
            f'  - {item.product_name} x{item.quantity} @ ₹{item.unit_price}'
            for item in order.items.all()
        ])

        message = f"""
Hello {order.user.get_full_name() or order.user.email},

Your order has been confirmed!

Order Number: #{order.order_number}
Status: {order.get_status_display()}

Items Ordered:
{items_text}

Subtotal: ₹{order.subtotal}
Tax (18% GST): ₹{order.tax}
Shipping: ₹{order.shipping_cost}
─────────────────────
Total: ₹{order.total_amount}

Shipping to:
{order.shipping_address}, {order.shipping_city}
{order.shipping_state} - {order.shipping_zip}

Thank you for shopping with us!

E-Commerce Store Team
        """

        send_mail(
            subject=subject,
            message=message.strip(),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            fail_silently=False,
        )
        logger.info(f'Order confirmation email sent for order #{order.order_number}')

    except Exception as exc:
        logger.error(f'Failed to send order email for order {order_id}: {exc}')
        # Retry the task if it fails
        raise self.retry(exc=exc)


@shared_task
def send_low_stock_alert(product_id, current_stock):
    """
    Alert admin when a product's stock falls below threshold.
    Called after every order is placed — checks if any item is low.
    """
    try:
        from apps.products.models import Product
        from django.contrib.auth import get_user_model
        User = get_user_model()

        product = Product.objects.get(id=product_id)
        admin_emails = list(
            User.objects.filter(is_staff=True).values_list('email', flat=True)
        )

        if not admin_emails:
            return

        send_mail(
            subject=f'⚠️ Low Stock Alert: {product.name}',
            message=f"""
Low stock alert!

Product: {product.name}
SKU: {product.sku}
Current Stock: {current_stock} units
Threshold: {settings.LOW_STOCK_THRESHOLD} units

Please restock this item soon.
            """.strip(),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=admin_emails,
            fail_silently=True,
        )
        logger.info(f'Low stock alert sent for {product.name} (stock: {current_stock})')

    except Exception as e:
        logger.error(f'Failed to send low stock alert for product {product_id}: {e}')


@shared_task
def send_order_status_update_email(order_id, new_status):
    """Send email when order status changes (e.g., 'Your order has shipped')."""
    try:
        from apps.orders.models import Order
        order = Order.objects.select_related('user').get(id=order_id)

        status_messages = {
            'confirmed': 'Your order has been confirmed and is being prepared.',
            'processing': 'Your order is being processed.',
            'shipped': 'Great news! Your order has been shipped.',
            'delivered': 'Your order has been delivered. Enjoy!',
            'cancelled': 'Your order has been cancelled.',
            'refunded': 'Your refund has been initiated.',
        }

        message_text = status_messages.get(new_status, f'Your order status is now: {new_status}')

        send_mail(
            subject=f'Order #{order.order_number} Update - {new_status.title()}',
            message=f"""
Hello {order.user.get_full_name() or order.user.email},

{message_text}

Order Number: #{order.order_number}
New Status: {new_status.title()}

Track your order on our website.

E-Commerce Store Team
            """.strip(),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            fail_silently=True,
        )

    except Exception as e:
        logger.error(f'Failed to send status update email for order {order_id}: {e}')
