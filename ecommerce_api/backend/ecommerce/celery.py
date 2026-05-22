"""
Celery Configuration
Celery is a task queue — think of it like a "to-do list" that runs in the background.
When a user places an order, instead of making them wait for the email to send,
we add "send email" to this background queue and return the response immediately.
"""
import os
from celery import Celery

# Tell Celery which Django settings to use
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecommerce.settings')

app = Celery('ecommerce')

# Read Celery config from Django settings (keys starting with CELERY_)
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks.py files in all installed apps
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
