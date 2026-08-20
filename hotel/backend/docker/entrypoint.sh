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

echo "==> Checking if seed data is needed..."
# Count rows in table_sessions — if 0, the seed hasn't completed successfully yet
SESSION_COUNT=$(php artisan tinker --no-interaction --execute="echo \App\Models\TableSession::count();" 2>/dev/null | tail -1 | tr -d '[:space:]')

if [ "$SESSION_COUNT" = "0" ] || [ -z "$SESSION_COUNT" ]; then
    echo "==> No sessions found — wiping tables and re-seeding..."
    php artisan migrate:fresh --force
    php artisan db:seed --class=MambaHotelSeeder --force
    echo "==> Seed complete."
else
    echo "==> Database already seeded ($SESSION_COUNT session(s) found) — skipping."
fi

echo "==> Starting services..."
exec supervisord -c /etc/supervisord.conf
