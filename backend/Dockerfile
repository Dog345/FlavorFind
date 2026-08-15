FROM php:8.4-cli-alpine

# Install system dependencies + all PHP extensions Laravel needs
RUN apk add --no-cache \
        postgresql-dev \
        libzip-dev \
        zip \
        unzip \
        curl \
        oniguruma-dev \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pgsql \
        bcmath \
        mbstring \
        pcntl \
        zip

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy composer files first for layer caching
COPY composer.json composer.lock ./

# Install dependencies
RUN composer install \
        --no-dev \
        --optimize-autoloader \
        --no-interaction \
        --no-scripts \
        --ignore-platform-reqs

# Copy full application
COPY . .

# Run post-install scripts now that full app is present
RUN composer dump-autoload --optimize --no-dev

# Ensure writable directories exist
RUN mkdir -p storage/framework/cache/data \
             storage/framework/sessions \
             storage/framework/views \
             storage/logs \
             storage/api-docs \
             bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 10000

CMD php artisan route:cache && \
    php artisan l5-swagger:generate && \
    php artisan serve --host=0.0.0.0 --port=${PORT:-10000}
