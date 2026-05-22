from django.urls import path
from .views import ProfileView, ChangePasswordView, AdminUserListView

urlpatterns = [
    path('users/profile/', ProfileView.as_view(), name='user-profile'),
    path('users/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('users/', AdminUserListView.as_view(), name='user-list'),
]
