"""
This makes sure Celery app is always imported when Django starts,
so that @shared_task decorators in other files work properly.
"""
from .celery import app as celery_app

__all__ = ('celery_app',)
