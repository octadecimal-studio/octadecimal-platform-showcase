<?php

declare(strict_types=1);

namespace App\Modules\Core\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Model reprezentujący tenanta (klienta) w systemie multi-tenancy.
 *
 * @property string $id UUID tenanta
 * @property string $name Nazwa tenanta
 * @property string $slug Unikalny identyfikator URL
 * @property string|null $domain Opcjonalna własna domena
 * @property string $plan Plan subskrypcji (starter, pro, enterprise)
 * @property string $database_type Typ bazy danych (shared, dedicated)
 * @property string|null $database_name Nazwa dedykowanej bazy (dla enterprise)
 * @property array<string, mixed> $settings Ustawienia tenanta w formacie JSON
 * @property bool $is_active Czy tenant jest aktywny
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, User> $users
 */
final class Tenant extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    /**
     * Nazwa tabeli w bazie danych.
     */
    protected $table = 'tenants';

    /**
     * Atrybuty, które można masowo przypisywać.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'domain',
        'plan',
        'database_type',
        'database_name',
        'settings',
        'is_active',
    ];

    /**
     * Atrybuty, które są ukryte podczas serializacji.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'database_name',
    ];

    /**
     * Domyślne wartości atrybutów.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'plan' => 'starter',
        'database_type' => 'shared',
        'is_active' => true,
        'settings' => '{}',
    ];

    /**
     * Rzutowanie atrybutów na typy PHP.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'is_active' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Dostępne plany subskrypcji.
     */
    public const PLANS = [
        'starter' => 'Starter',
        'pro' => 'Pro',
        'enterprise' => 'Enterprise',
    ];

    /**
     * Typy baz danych.
     */
    public const DATABASE_TYPES = [
        'shared' => 'Współdzielona',
        'dedicated' => 'Dedykowana',
    ];

    /**
     * Relacja: Tenant ma wielu użytkowników.
     *
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Sprawdza czy tenant ma plan enterprise.
     */
    public function isEnterprise(): bool
    {
        return $this->plan === 'enterprise';
    }

    /**
     * Sprawdza czy tenant używa dedykowanej bazy danych.
     */
    public function hasDedicatedDatabase(): bool
    {
        return $this->database_type === 'dedicated' && $this->database_name !== null;
    }

    /**
     * Pobiera ustawienie z JSON.
     *
     * @param mixed $default
     * @return mixed
     */
    public function getSetting(string $key, $default = null)
    {
        return data_get($this->settings, $key, $default);
    }

    /**
     * Ustawia wartość ustawienia w JSON.
     *
     * @param mixed $value
     */
    public function setSetting(string $key, $value): self
    {
        $settings = $this->settings ?? [];
        data_set($settings, $key, $value);
        $this->settings = $settings;

        return $this;
    }
}
