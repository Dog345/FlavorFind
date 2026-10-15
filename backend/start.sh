#!/bin/sh
set -e

# Write .env from environment variables so Laravel can read them
cat > /var/www/.env <<EOF
APP_NAME=${APP_NAME:-FlavorFind}
APP_ENV=${APP_ENV:-production}
APP_KEY=${APP_KEY}
APP_DEBUG=${APP_DEBUG:-false}
APP_URL=${APP_URL:-http://localhost}

LOG_CHANNEL=${LOG_CHANNEL:-stderr}
LOG_LEVEL=${LOG_LEVEL:-error}

DB_CONNECTION=${DB_CONNECTION:-pgsql}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT:-5432}
DB_DATABASE=${DB_DATABASE:-postgres}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_PASSWORD=${DB_PASSWORD}
DB_SSLMODE=${DB_SSLMODE:-require}

CACHE_STORE=${CACHE_STORE:-database}
SESSION_DRIVER=${SESSION_DRIVER:-database}
QUEUE_CONNECTION=${QUEUE_CONNECTION:-database}

BROADCAST_CONNECTION=${BROADCAST_CONNECTION:-log}
MAIL_MAILER=${MAIL_MAILER:-log}
FILESYSTEM_DISK=${FILESYSTEM_DISK:-local}
EOF

echo "==> Running migrations..."
php artisan migrate --force || echo "⚠️  Migrations failed, continuing..."

echo "==> Caching routes..."
php artisan route:cache

echo "==> Starting server on port ${PORT:-10000}..."
exec php artisan serve --host=0.0.0.0 --port=${PORT:-10000}
