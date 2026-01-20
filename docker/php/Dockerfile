# Octadecimal Studio - PHP-FPM Dockerfile
# PHP 8.3 z rozszerzeniami wymaganymi przez Laravel 11 i Filament 3

FROM php:8.3-fpm

# Argumenty budowania
ARG USER_ID=1000
ARG GROUP_ID=1000

# Ustawienia środowiska
ENV COMPOSER_ALLOW_SUPERUSER=1

# Instalacja zależności systemowych
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libicu-dev \
    libwebp-dev \
    zip \
    unzip \
    supervisor \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Instalacja rozszerzeń PHP
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
        intl \
        opcache

# Instalacja Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Instalacja Xdebug (opcjonalnie dla development)
RUN pecl install xdebug && docker-php-ext-enable xdebug

# Instalacja Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Utworzenie użytkownika aplikacji (mapowanie na hosta)
RUN groupadd -g ${GROUP_ID} octadecimal \
    && useradd -u ${USER_ID} -g octadecimal -m octadecimal \
    && chown -R octadecimal:octadecimal /var/www

# Katalog roboczy
WORKDIR /var/www/html

# Uruchomienie jako użytkownik aplikacji (dla produkcji)
# USER octadecimal

# Domyślna komenda
CMD ["php-fpm"]
