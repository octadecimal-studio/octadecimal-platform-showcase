<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\User;
use App\Modules\Core\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Factory dla modelu User.
 *
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * Aktualne hasło używane przez factory.
     */
    protected static ?string $password = null;

    /**
     * Definiuje domyślny stan modelu.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'tenant_id' => null,
        ];
    }

    /**
     * Wskazuje, że email użytkownika powinien być niezweryfikowany.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Wskazuje, że użytkownik jest super adminem.
     * is_super_admin jest ustawiany po utworzeniu (chroniony przed mass assignment).
     */
    public function superAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'tenant_id' => null,
        ])->afterCreating(function (User $user): void {
            $user->is_super_admin = true;
            $user->save();
        });
    }

    /**
     * Przypisuje użytkownika do tenanta.
     */
    public function forTenant(Tenant $tenant): static
    {
        return $this->state(fn (array $attributes) => [
            'tenant_id' => $tenant->id,
        ]);
    }
}
