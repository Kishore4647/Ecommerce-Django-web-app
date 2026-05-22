"""
Django Tests
Run with: python manage.py test

Django's test client simulates HTTP requests without needing a real server.
Each test class is isolated — database is wiped between test classes.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from apps.users.models import User
from apps.products.models import Category, Product


class AuthTests(APITestCase):
    """Test user registration and login."""

    def test_register_success(self):
        """POST /api/auth/register/ with valid data → 201 Created."""
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
        }
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='test@example.com').exists())

    def test_register_password_mismatch(self):
        """Registration with mismatched passwords → 400 Bad Request."""
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'StrongPass123!',
            'password2': 'WrongPass123!',
        }
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        """POST /api/auth/login/ with correct credentials → 200 + tokens."""
        user = User.objects.create_user(
            username='logintest',
            email='login@example.com',
            password='TestPass123!'
        )
        response = self.client.post('/api/auth/login/', {
            'email': 'login@example.com',
            'password': 'TestPass123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)

    def test_protected_route_without_token(self):
        """GET /api/users/profile/ without token → 401 Unauthorized."""
        response = self.client.get('/api/users/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProductTests(APITestCase):
    """Test product catalog endpoints."""

    def setUp(self):
        """setUp runs before EACH test method — sets up shared data."""
        self.category = Category.objects.create(name='Electronics', slug='electronics')
        self.product = Product.objects.create(
            name='Test Laptop',
            slug='test-laptop',
            sku='LAP-001',
            price='49999.00',
            stock_quantity=10,
            category=self.category,
        )

    def test_product_list_is_public(self):
        """Anyone can view products without logging in."""
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_product_detail(self):
        """GET /api/products/<slug>/ returns product details."""
        response = self.client.get(f'/api/products/{self.product.slug}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Laptop')
        self.assertEqual(response.data['sku'], 'LAP-001')

    def test_product_search(self):
        """?search= parameter filters products by name."""
        response = self.client.get('/api/products/?search=Laptop')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertTrue(any(p['name'] == 'Test Laptop' for p in results))

    def test_create_product_requires_admin(self):
        """Regular users cannot create products."""
        user = User.objects.create_user(username='u', email='u@test.com', password='pass')
        self.client.force_authenticate(user=user)
        response = self.client.post('/api/products/', {'name': 'Hack'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class CartTests(APITestCase):
    """Test cart operations."""

    def setUp(self):
        self.user = User.objects.create_user(username='cartuser', email='cart@test.com', password='TestPass123!')
        self.client.force_authenticate(user=self.user)  # Bypass token for tests

        self.category = Category.objects.create(name='Tech', slug='tech')
        self.product = Product.objects.create(
            name='Phone', slug='phone', sku='PH-001',
            price='15000.00', stock_quantity=5, category=self.category
        )

    def test_get_empty_cart(self):
        response = self.client.get('/api/cart/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 0)

    def test_add_to_cart(self):
        response = self.client.post('/api/cart/items/', {
            'product_id': self.product.id,
            'quantity': 2
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['items']), 1)
        self.assertEqual(response.data['items'][0]['quantity'], 2)

    def test_cart_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/cart/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
