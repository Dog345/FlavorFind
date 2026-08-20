#!/bin/sh
set -e

echo "==> Clearing bootstrap cache..."
rm -f bootstrap/cache/packages.php bootstrap/cache/services.php

echo "==> Caching config & routes..."
php artisan config:cache
php artisan route:cache
php artisan event:cache

echo "==> Checking if seed data is needed..."
# Check if table_sessions table exists AND has rows
# If the table doesn't exist yet, SESSION_COUNT will be empty/error → we need to seed
SESSION_COUNT=$(php artisan tinker --no-interaction --execute="
try {
    echo \App\Models\TableSession::count();
} catch (\Exception \$e) {
    echo 'NEEDS_SEED';
}
" 2>/dev/null | grep -E '^[0-9]+$' | tail -1)

if [ -z "$SESSION_COUNT" ] || [ "$SESSION_COUNT" = "0" ]; then
    echo "==> No sessions found — wiping schema and re-seeding..."

    # Drop and recreate the public schema — more reliable than migrate:fresh on PostgreSQL
    php artisan tinker --no-interaction --execute="
\DB::statement('DROP SCHEMA public CASCADE');
\DB::statement('CREATE SCHEMA public');
\DB::statement('GRANT ALL ON SCHEMA public TO PUBLIC');
echo 'Schema wiped.';
" 2>/dev/null || true

    echo "==> Running fresh migrations..."
    php artisan migrate --force

    echo "==> Seeding..."
    php artisan db:seed --class=MambaHotelSeeder --force
    echo "==> Seed complete."
else
    echo "==> Database already seeded ($SESSION_COUNT session(s) found) — running normal migrations..."
    php artisan migrate --force
fi

echo "==> Starting services..."
exec supervisord -c /etc/supervisord.conf
