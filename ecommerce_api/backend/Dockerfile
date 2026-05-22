# Use official Python image
FROM python:3.12-slim

# Set environment variables
# PYTHONDONTWRITEBYTECODE: Don't create .pyc files (saves space)
# PYTHONUNBUFFERED: Print logs immediately (important for Docker)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Set work directory inside container
WORKDIR /app

# Install system dependencies
# libpq-dev: needed for psycopg2 (PostgreSQL driver)
# libmariadb-dev: needed for mysqlclient
# gcc: C compiler needed for some Python packages
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    default-libmysqlclient-dev \
    pkg-config \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the project
COPY . .

# Collect static files (CSS, JS for admin panel)
RUN python manage.py collectstatic --noinput

# Run with Gunicorn (production WSGI server)
# Gunicorn is like Django's runserver but designed for production
# --workers 2: 2 processes handle requests simultaneously
CMD gunicorn ecommerce.wsgi:application \
    --bind 0.0.0.0:$PORT \
    --workers 2 \
    --timeout 120 \
    --log-level info
