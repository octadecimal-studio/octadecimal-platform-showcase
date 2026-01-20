<?php

declare(strict_types=1);

namespace App\Providers\Filament;

use App\Modules\Core\Middleware\EnsureTenantSession;
use App\Modules\Core\Models\Tenant;
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Widgets;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

/**
 * Provider konfigurujący panel administracyjny Filament.
 */
class AdminPanelProvider extends PanelProvider
{
    /**
     * Konfiguracja panelu Filament.
     */
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->login()
            ->passwordReset()
            ->emailVerification()

            // Multi-tenancy
            ->tenant(Tenant::class, slugAttribute: 'slug')
            ->tenantRoutePrefix('tenant')

            // Branding - kolory Octadecimal
            ->colors([
                'primary' => Color::Blue,
                'gray' => Color::Slate,
                'danger' => Color::Rose,
                'warning' => Color::Amber,
                'success' => Color::Emerald,
                'info' => Color::Sky,
            ])
            ->brandName('Octadecimal Studio')
            ->favicon(asset('favicon.ico'))

            // Dark mode domyślnie
            ->darkMode(true)

            // Odkrywanie zasobów Filament
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\\Filament\\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\\Filament\\Pages')
            ->pages([
                Pages\Dashboard::class,
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\\Filament\\Widgets')
            ->widgets([
                Widgets\AccountWidget::class,
            ])

            // Middleware
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ])
            ->tenantMiddleware([
                EnsureTenantSession::class,
            ], isPersistent: true)

            // Konfiguracja SPA
            ->spa()

            // Maksymalna szerokość kontentu
            ->maxContentWidth('full')

            // Top navigation zamiast sidebar (opcjonalnie)
            // ->topNavigation()

            // Rejestracja i profil
            ->profile();
    }
}
