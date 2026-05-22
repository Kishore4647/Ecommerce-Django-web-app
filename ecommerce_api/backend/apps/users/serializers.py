"""
Serializers convert Django model instances → JSON (and JSON → model instances).
Think of them like Django Forms but for APIs.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serialize user data for read operations (GET requests)."""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'phone', 'address', 'role', 'created_at']
        read_only_fields = ['id', 'role', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles new user registration.
    password2 is a write-only field just for confirmation — we never store it.
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label='Confirm Password')

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2',
                  'first_name', 'last_name', 'phone']

    def validate(self, attrs):
        """Called automatically when .is_valid() runs — check passwords match."""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        """
        .create() is called by .save() when creating a new object.
        We remove password2 (not a model field) and use create_user()
        so the password gets properly hashed.
        """
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Allows users to update their own profile."""
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'address']


class ChangePasswordSerializer(serializers.Serializer):
    """Handles password change — not tied to a model directly."""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({'new_password': 'Passwords do not match.'})
        return attrs


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extends the default JWT login serializer to include user info in the response,
    so the frontend gets the token AND user details in one request.
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        # Add extra user info to the token response
        data['user'] = UserSerializer(self.user).data
        return data
