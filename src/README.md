# Octadecimal Studio - Backend

> Laravel 11 + Filament 3 + Multi-tenancy + RBAC

Panel administracyjny dla systemu CMS Octadecimal Studio.

## 🚀 Stack technologiczny

- **Backend:** Laravel 11, Filament 3, Breeze + Sanctum
- **Database:** MySQL 8.0, Redis
- **Media:** Intervention Image 3, Glide
- **API:** GraphQL (Lighthouse) + REST
- **RBAC:** Spatie Permission + Filament Shield
- **Queue:** Laravel Horizon
- **Testing:** PHPUnit/Pest, Playwright
- **Code Quality:** PHPStan level 8, PHP CS Fixer (PSR-12)

## 📦 Instalacja

### Wymagania

- PHP 8.3+
- Composer
- Docker + Docker Compose
- Node.js 20+ (dla frontend)

### Kroki instalacji

1. **Klonowanie repozytorium**
```bash
git clone https://github.com/octadecimal/octadecimal-studio.git
cd octadecimal-studio
```

2. **Konfiguracja środowiska**
```bash
# Skopiuj przykładowy plik .env
cp src/.env.example src/.env

# Wygeneruj klucz aplikacji
cd src
php artisan key:generate
```

3. **Uruchomienie Dockera (development)**
```bash
# Z katalogu głównego projektu
cd ..
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d

# Alternatywnie użyj wrapper script
./sail up -d
```

4. **Instalacja zależności**
```bash
# PHP
cd src
composer install

# Frontend
npm install
npm run dev
```

5. **Migracje i seedery**
```bash
php artisan migrate
php artisan db:seed
```

6. **Utworzenie pierwszego użytkownika admin**
```bash
# Super admin (dostęp do wszystkich tenantów)
php artisan admin:create --super --email=admin@example.com --name="Super Admin"

# Tenant admin (dla konkretnego tenanta)
php artisan admin:create --tenant=demo-studio --email=admin@demo.com --name="Demo Admin"
```

## 🔐 Dostęp do panelu

- **URL:** http://localhost:8080/admin
- **Domyślne konta (po seedzie):**
  - Super Admin: `admin@octadecimal.studio` / `password`
  - Demo Tenant Admin: `admin@demo-studio.local` / `password`

## 🧪 Testy

```bash
# Wszystkie testy
php artisan test

# Tylko testy jednostkowe
php artisan test --testsuite=Unit

# Tylko testy funkcjonalne
php artisan test --testsuite=Feature

# Pokrycie kodu
php artisan test --coverage
```

## 🛠️ Przydatne komendy

### Docker

```bash
# Uruchomienie
./sail up -d

# Zatrzymanie
./sail down

# Logi
./sail logs -f

# Shell w kontenerze
./sail shell
```

### Laravel

```bash
# Cache
php artisan optimize
php artisan cache:clear
php artisan config:clear
php artisan view:clear

# Queue
php artisan queue:work
php artisan horizon

# Linting
./vendor/bin/phpstan analyse
./vendor/bin/pint
```

### Użytkownicy

```bash
# Utworzenie super admina
php artisan admin:create --super

# Utworzenie tenant admina
php artisan admin:create --tenant=slug-tenanta

# Lista tenantów
php artisan tinker
>>> App\Modules\Core\Models\Tenant::all(['slug', 'name']);
```

## 📖 Architektura

### Multi-tenancy

Projekt używa architecture multi-tenancy opartej na kolumnie `tenant_id`:

- **Tenant:** Klient korzystający z systemu (np. agencja, freelancer)
- **Izolacja danych:** Global Scope automatycznie filtruje dane po `tenant_id`
- **Bezpieczeństwo:** Fail-closed - brak kontekstu tenanta = brak danych

```php
// Modele używające multi-tenancy
use App\Modules\Core\Traits\BelongsToTenant;

class Project extends Model {
    use BelongsToTenant;
}
```

### RBAC (Role-Based Access Control)

4 podstawowe role:

1. **super_admin** - pełny dostęp do systemu, zarządzanie wszystkimi tenantami
2. **tenant_admin** - zarządzanie danym tenantem (użytkownicy, projekty, treści)
3. **editor** - edycja treści i mediów
4. **viewer** - tylko odczyt

Uprawnienia grupowane po modułach:
- `projects.*` - zarządzanie projektami
- `content.*` - zarządzanie treściami
- `media.*` - zarządzanie mediami
- `users.*` - zarządzanie użytkownikami

## 📂 Struktura modułów

```
src/app/Modules/
├── Content/       # CMS - treści, media, szablony
├── Generator/     # AI Template Generator
├── Deploy/        # VPS/OVH deployment
├── Marketplace/   # Allegro integration
├── Studio/        # Portfolio, projekty
└── Core/          # Shared - tenants, users, audit
```

## 🔒 Bezpieczeństwo

### Najlepsze praktyki

- ✅ Mass assignment protection (`$guarded`, `$fillable`)
- ✅ Fail-closed design (brak kontekstu = brak dostępu)
- ✅ CSRF protection
- ✅ Secure session cookies (HTTPS w produkcji)
- ✅ Password hashing (bcrypt)
- ✅ SQL injection protection (Eloquent ORM)
- ✅ XSS protection (Blade templating)

### Headers bezpieczeństwa (produkcja)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## 📝 Konwencje

### Commity

Używamy [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(module): dodaj nową funkcję
fix(security): naprawa luki bezpieczeństwa
docs: aktualizacja dokumentacji
refactor: refaktoryzacja kodu
test: dodanie/poprawka testów
chore: zmiany w konfiguracji
```

### Kod

- **Język komentarzy:** Polski
- **Nazwy zmiennych/funkcji:** Angielski (PSR-12)
- **PHPStan:** Level 8 (wymagane)
- **PHP CS Fixer:** PSR-12 (wymagane)

## 🐛 Debugging

### Xdebug (development)

Xdebug jest dostępny w środowisku development:

```bash
# W docker-compose.dev.yml
XDEBUG_MODE=debug,develop
```

Konfiguracja IDE:
- Host: `host.docker.internal`
- Port: `9003`
- IDE key: `PHPSTORM`

### Logi

```bash
# Laravel logs
tail -f storage/logs/laravel.log

# Nginx logs
docker compose -f docker/docker-compose.dev.yml logs -f nginx

# MySQL logs
docker compose -f docker/docker-compose.dev.yml logs -f mysql
```

## 📞 Support

- **Dokumentacja:** `docs/`
- **Issues:** https://github.com/octadecimal/octadecimal-studio/issues
- **Email:** support@octadecimal.studio

## 📄 Licencja

Proprietary - © 2026 Octadecimal Studio
