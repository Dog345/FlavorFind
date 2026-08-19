#!/bin/sh
set -e

echo "==> Clearing bootstrap cache..."
rm -f bootstrap/cache/packages.php bootstrap/cache/services.php

echo "==> Caching config & routes..."
php artisan config:cache
php artisan route:cache
php artisan event:cache

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Starting services..."
exec supervisord -c /etc/supervisord.conf
