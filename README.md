# 🛒 E-Commerce Order & Inventory Management API

A full-stack e-commerce platform built with **Django REST Framework** + **React**, featuring JWT authentication, real-time inventory tracking, Celery-powered background tasks, and one-click deployment to Render.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Django 5.0, Django REST Framework 3.15 |
| **Auth** | JWT via `djangorestframework-simplejwt` |
| **Database** | MySQL (local / Render) · PostgreSQL (Render free tier) |
| **Task Queue** | Celery 5.4 + Redis |
| **Frontend** | React 18, React Router 6, Tailwind CSS |
| **HTTP Client** | Axios |
| **Deployment** | Docker Compose (local) · Render (production) |
| **CI/CD** | GitHub Actions |

---

## ✨ Features

- **Product Catalog** — categories (with nested subcategories), products, multiple images, 1–5 star reviews
- **Shopping Cart** — add/update/remove items, persistent per user
- **Order Management** — full order lifecycle: `pending → confirmed → processing → shipped → delivered → cancelled / refunded`
- **Inventory Tracking** — every stock change (restock, sale, return, damage, correction) is logged with a full audit trail
- **Background Emails** (via Celery)
  - Order confirmation email on checkout
  - Order status update emails on every status change
  - Low-stock alerts to admin staff
- **Role-based Access** — customers vs. admin staff with a dedicated Admin dashboard in the UI
- **GST-aware Pricing** — 18% tax calculated automatically; free shipping on orders over ₹500
- **CI/CD Pipeline** — GitHub Actions tests backend + frontend on every push, auto-deploys to Render on merge to `main`

---

## 📁 Project Structure

```
ecommerce_api/
├── backend/
│   ├── ecommerce/          # Django project settings, URLs, Celery config
│   └── apps/
│       ├── users/          # Custom user model, JWT auth, profiles
│       ├── products/       # Category, Product, ProductImage, ProductReview
│       ├── cart/           # Cart & CartItem
│       ├── orders/         # Order, OrderItem, OrderStatusHistory + Celery tasks
│       └── inventory/      # InventoryLog (audit trail for all stock changes)
├── frontend/
│   └── src/
│       ├── api/            # Axios client + service functions
│       ├── context/        # AuthContext, CartContext
│       ├── components/     # Navbar, ProtectedRoute, ProductCard
│       └── pages/          # Home, Products, ProductDetail, Cart, Checkout,
│                           #   Orders, OrderDetail, Profile, Login, Register, Admin
├── .github/workflows/ci.yml
├── docker-compose.yml
├── render.yaml
└── .env.example
```

---

## ⚡ Quick Start (Docker)

The fastest way to run everything locally — Django, React, MySQL, Redis, and Celery — with a single command.

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
git clone https://github.com/your-username/ecommerce-api.git
cd ecommerce-api

# Copy and configure environment variables
cp .env.example .env

# Start all services
docker-compose up
```

| Service | URL |
|---|---|
| React Frontend | http://localhost:3000 |
| Django API | http://localhost:8000 |
| Django Admin | http://localhost:8000/admin |

---

## 🛠️ Local Development (without Docker)

### Backend

```bash
cd backend

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp ../.env.example ../.env      # Edit DATABASE_URL, REDIS_URL, etc.

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Start the Celery worker (separate terminal):

```bash
celery -A ecommerce worker --loglevel=info
```

### Frontend

```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000 npm start
```

---

## 🔌 API Reference

All endpoints are prefixed with `/api/`.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register/` | Create account |
| `POST` | `/api/auth/login/` | Obtain JWT token pair |
| `POST` | `/api/auth/refresh/` | Refresh access token |
| `POST` | `/api/auth/logout/` | Blacklist refresh token |

### Products

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products/` | List products (filterable) |
| `GET` | `/api/products/<id>/` | Product detail |
| `POST/PUT/DELETE` | `/api/products/<id>/` | Admin: manage products |
| `GET` | `/api/categories/` | List categories |

### Cart

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cart/` | View cart |
| `POST` | `/api/cart/items/` | Add item |
| `PUT/DELETE` | `/api/cart/items/<id>/` | Update / remove item |

### Orders

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/orders/` | Place order (from cart) |
| `GET` | `/api/orders/` | List user's orders |
| `GET` | `/api/orders/<id>/` | Order detail |
| `PATCH` | `/api/orders/<id>/` | Admin: update status |

### Inventory

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/inventory/` | Inventory log (admin) |
| `POST` | `/api/inventory/adjust/` | Manually adjust stock |
| `GET` | `/api/inventory/low-stock/` | Products below threshold |

---

## 🌍 Environment Variables

Copy `.env.example` to `.env` and fill in your values.

```env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=mysql://user:pass@localhost:3306/ecommerce_db
REDIS_URL=redis://localhost:6379/0

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourstore.com

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Inventory
LOW_STOCK_THRESHOLD=10
```

> ⚠️ Never commit `.env` to version control. It is listed in `.gitignore`.

---

## ☁️ Deployment (Render)

This project ships with a `render.yaml` that provisions all services automatically.

1. Push the repo to GitHub.
2. Go to [render.com](https://render.com) → **New > Blueprint** → connect your repo.
3. Render reads `render.yaml` and creates:
   - `ecommerce-api` — Django web service (Gunicorn)
   - `ecommerce-celery` — Celery worker
   - `ecommerce-redis` — Redis instance
   - `ecommerce-db` — PostgreSQL database
4. Set the secrets that are marked `sync: false` in the Render dashboard (email credentials, CORS origin).

The GitHub Actions workflow (`ci.yml`) automatically triggers a Render deploy on every push to `main` via a deploy hook. Store the hook URL as the `RENDER_DEPLOY_HOOK_URL` secret in your GitHub repo settings.

---

## 🧪 Testing

```bash
cd backend
python manage.py test --verbosity=2
```

The CI pipeline runs tests automatically on every push to `main` or `develop`, and on all pull requests targeting `main`.

---

## 📋 Order Status Flow

```
pending → confirmed → processing → shipped → delivered
                                           ↘ cancelled → refunded
```

Every status transition is recorded in `OrderStatusHistory` for a full audit trail, and triggers a customer notification email via Celery.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request — CI will run automatically

---

## 📄 License

This project is licensed under the MIT License.
