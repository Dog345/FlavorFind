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
TENANT_COUNT=$(php artisan tinker --no-interaction --execute="echo \App\Models\Tenant::count();" 2>/dev/null | tail -1 | tr -d '[:space:]')

if [ "$TENANT_COUNT" = "0" ] || [ -z "$TENANT_COUNT" ]; then
    echo "==> No tenants found — running MambaHotelSeeder..."
    php artisan db:seed --class=MambaHotelSeeder --force
    echo "==> Seed complete."
else
    echo "==> Database already seeded ($TENANT_COUNT tenant(s) found) — skipping."
fi

echo "==> Starting services..."
exec supervisord -c /etc/supervisord.conf
