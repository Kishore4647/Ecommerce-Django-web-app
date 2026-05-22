"""
Custom User Model
We extend Django's built-in AbstractUser so we keep all the default
fields (username, password, email) but can add our own fields (phone, address, role).
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    AbstractUser already gives us: id, username, email, password,
    first_name, last_name, is_active, is_staff, date_joined.
    We just add extra fields below.
    """
    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('admin', 'Admin'),
    ]

    email = models.EmailField(unique=True)           # Make email unique (default isn't)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Login with email instead of username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return self.email

    @property
    def is_admin_user(self):
        return self.role == 'admin' or self.is_staff
