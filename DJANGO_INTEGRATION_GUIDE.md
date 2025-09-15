# Django + React Integration Guide

## Overview
This guide explains how to integrate your React application with Django framework for production deployment.

## Architecture Options

### Option 1: Django as API Backend + React Frontend (Recommended)
- Django serves as REST API backend
- React runs as separate frontend application
- Better separation of concerns and scalability

### Option 2: Django Serving React Build Files
- Django serves the built React files as static content
- Simpler deployment but less flexible

## Step-by-Step Integration Guide

### Phase 1: Prepare React Application for Production

#### 1. Build Configuration
```bash
# In your React project root
npm run build
```

#### 2. Configure Base URL for Production
Create/update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: '/static/', // Django static files path
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-dialog'],
        }
      }
    }
  }
})
```

### Phase 2: Django Setup

#### 1. Django Project Structure
```
myproject/
├── myproject/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── frontend/
│   └── (your React build files)
├── static/
├── media/
└── manage.py
```

#### 2. Django Settings Configuration
Add to `settings.py`:
```python
import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'frontend/dist'),
    os.path.join(BASE_DIR, 'frontend/dist/assets'),
]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'frontend/dist')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# CORS settings (if using separate domains)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React dev server
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True
```

#### 3. Django URLs Configuration
Create `urls.py`:
```python
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),  # Your API endpoints
    
    # Serve React app for all other routes
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### Phase 3: API Integration

#### 1. Create Django API App
```bash
python manage.py startapp api
```

#### 2. Install Required Packages
```bash
pip install django djangorestframework django-cors-headers
```

#### 3. Update Settings for API
Add to `INSTALLED_APPS` in `settings.py`:
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

### Phase 4: Deployment Steps

#### 1. Build React for Production
```bash
cd frontend
npm run build
```

#### 2. Copy Build Files to Django
```bash
# Copy built files to Django project
cp -r dist/* ../myproject/frontend/dist/
```

#### 3. Collect Static Files
```bash
python manage.py collectstatic --noinput
```

#### 4. Database Migration
```bash
python manage.py makemigrations
python manage.py migrate
```

### Phase 5: Production Deployment

#### 1. Environment Variables
Create `.env` file:
```env
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=your-database-url
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
```

#### 2. Production Settings
Create `settings_prod.py`:
```python
from .settings import *
import os

DEBUG = False
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT'),
    }
}

# Security settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

#### 3. Server Configuration (Nginx + Gunicorn)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /static/ {
        alias /path/to/your/project/staticfiles/;
    }

    location /media/ {
        alias /path/to/your/project/media/;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 4. Start Production Server
```bash
gunicorn myproject.wsgi:application --bind 127.0.0.1:8000
```

### Phase 6: CI/CD Automation (Optional)

#### 1. Build Script
Create `build.sh`:
```bash
#!/bin/bash
cd frontend
npm install
npm run build
cd ..
python manage.py collectstatic --noinput
python manage.py migrate
```

#### 2. GitHub Actions (if using GitHub)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Build React
        run: |
          cd frontend
          npm install
          npm run build
      - name: Deploy to server
        # Add your deployment commands here
```

## Troubleshooting

### Common Issues:
1. **Static files not loading**: Check `STATIC_URL` and `STATICFILES_DIRS`
2. **CORS errors**: Configure `CORS_ALLOWED_ORIGINS`
3. **Routing issues**: Ensure Django catches all routes with `re_path(r'^.*$')`
4. **API calls failing**: Check Django REST framework configuration

### Development vs Production:
- Development: Run React dev server separately (`npm run dev`)
- Production: Build React and serve through Django

This integration provides a robust, scalable solution for deploying your React application with Django backend.