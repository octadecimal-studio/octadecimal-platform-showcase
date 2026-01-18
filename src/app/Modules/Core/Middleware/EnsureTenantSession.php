<?php

declare(strict_types=1);

namespace App\Modules\Core\Middleware;

use App\Modules\Core\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware ustawiający kontekst tenanta w sesji i kontenerze aplikacji.
 *
 * Sprawdza i waliduje tenanta na podstawie:
 * 1. Zalogowanego użytkownika
 * 2. Parametru w URL (dla super_admin)
 * 3. Domeny (dla enterprise z własną domeną)
 */
final class EnsureTenantSession
{
    /**
     * Obsługuje przychodzące żądanie.
     *
     * @param Closure(Request): Response $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = $this->resolveTenant($request);

        if ($tenant === null) {
            // Jeśli użytkownik jest zalogowany i nie jest super_admin, zwróć 404
            $user = $request->user();
            if ($user !== null && ! $this->isSuperAdmin($user)) {
                abort(404);
            }
        }

        if ($tenant !== null) {
            // Sprawdź czy tenant jest aktywny
            if (! $tenant->is_active) {
                abort(404, 'Konto zostało dezaktywowane.');
            }

            // Ustaw tenant w kontenerze i sesji
            $this->setCurrentTenant($tenant);
        }

        return $next($request);
    }

    /**
     * Próbuje rozpoznać tenanta na podstawie różnych źródeł.
     */
    private function resolveTenant(Request $request): ?Tenant
    {
        // 1. Sprawdź czy użytkownik jest zalogowany i ma przypisanego tenanta
        $user = $request->user();
        if ($user !== null && isset($user->tenant_id)) {
            return Tenant::find($user->tenant_id);
        }

        // 2. Sprawdź parametr tenant w URL (dla super_admin)
        $tenantSlug = $request->route('tenant');
        if ($tenantSlug !== null && $this->isSuperAdmin($user)) {
            return Tenant::where('slug', $tenantSlug)->first();
        }

        // 3. Sprawdź domenę (dla enterprise)
        $host = $request->getHost();
        $tenant = Tenant::where('domain', $host)->first();
        if ($tenant !== null) {
            return $tenant;
        }

        // 4. Fallback: pobierz z sesji
        $tenantId = session('tenant_id');
        if ($tenantId !== null) {
            return Tenant::find($tenantId);
        }

        return null;
    }

    /**
     * Ustawia aktualnego tenanta w kontenerze i sesji.
     */
    private function setCurrentTenant(Tenant $tenant): void
    {
        // Ustaw w kontenerze aplikacji
        app()->instance('current_tenant', $tenant);

        // Ustaw w sesji
        session(['tenant_id' => $tenant->id]);
    }

    /**
     * Sprawdza czy użytkownik jest super adminem.
     *
     * @param mixed $user
     */
    private function isSuperAdmin($user): bool
    {
        if ($user === null) {
            return false;
        }

        // Sprawdź atrybut is_super_admin
        if (isset($user->is_super_admin) && $user->is_super_admin === true) {
            return true;
        }

        // Sprawdź rolę super_admin (Spatie Permission)
        if (method_exists($user, 'hasRole') && $user->hasRole('super_admin')) {
            return true;
        }

        return false;
    }
}
