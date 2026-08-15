FROM php:8.3-cli-alpine

# Install system dependencies + PHP extensions needed by Laravel + PostgreSQL
RUN apk add --no-cache \
    postgresql-dev \
    curl \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql pcntl

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy composer files first (layer cache — only re-runs if dependencies change)
COPY composer.json composer.lock ./

# Install PHP dependencies (no dev packages, optimised autoloader)
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copy the rest of the application
COPY . .

# Generate optimised class map (scripts skipped above, run manually now)
RUN composer dump-autoload --optimize --no-dev

# Storage and cache directories must be writable
RUN mkdir -p storage/framework/cache \
             storage/framework/sessions \
             storage/framework/views \
             storage/logs \
             bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Expose the port Render provides via $PORT (default 10000)
EXPOSE 10000

# Start command — Render injects $PORT at runtime
CMD php artisan config:cache && \
    php artisan route:cache && \
    php artisan serve --host=0.0.0.0 --port=${PORT:-10000}
