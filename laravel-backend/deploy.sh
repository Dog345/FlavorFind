#!/bin/bash
# FlavorFind Backend — Deployment Script
# Run this on your server (DigitalOcean / Railway / Render) after uploading files.

set -e

echo "🚀 FlavorFind Backend Deployment"

# 1. Install dependencies
composer install --no-dev --optimize-autoloader

# 2. Set permissions
chmod -R 775 storage bootstrap/cache

# 3. Generate app key (only on first deploy)
if grep -q "APP_KEY=$" .env; then
  php artisan key:generate
fi

# 4. Create SQLite DB file if it doesn't exist
touch database/database.sqlite

# 5. Run migrations
php artisan migrate --force

# 6. Clear and cache config/routes for production
php artisan config:cache
php artisan route:cache

echo "✅ Deployment complete."
echo "   Start server: php artisan serve --port=8000"
echo "   Or use: php-fpm + nginx"
