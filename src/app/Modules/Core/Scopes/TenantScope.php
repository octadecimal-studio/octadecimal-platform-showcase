<?php

declare(strict_types=1);

namespace App\Modules\Core\Scopes;

use App\Modules\Core\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

/**
 * Global Scope filtrujący wszystkie zapytania po tenant_id.
 *
 * Ten scope jest automatycznie stosowany do wszystkich modeli
 * używających traitu BelongsToTenant. Zapewnia izolację danych
 * między tenantami.
 */
final class TenantScope implements Scope
{
    /**
     * Stosuje scope do zapytania Eloquent.
     *
     * @param Builder<Model> $builder
     */
    public function apply(Builder $builder, Model $model): void
    {
        $tenant = $this->getCurrentTenant();

        if ($tenant !== null) {
            $builder->where($model->getTable() . '.tenant_id', $tenant->id);
        }
    }

    /**
     * Pobiera aktualnego tenanta z kontekstu.
     */
    private function getCurrentTenant(): ?Tenant
    {
        // Sprawdzamy czy jest ustawiony tenant w kontekście aplikacji
        if (app()->bound('current_tenant')) {
            return app('current_tenant');
        }

        // Fallback: próbujemy pobrać z sesji
        $tenantId = session('tenant_id');
        if ($tenantId !== null) {
            return Tenant::find($tenantId);
        }

        // Fallback: próbujemy pobrać od zalogowanego użytkownika
        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        if ($user !== null && isset($user->tenant_id)) {
            return $user->tenant;
        }

        return null;
    }
}
