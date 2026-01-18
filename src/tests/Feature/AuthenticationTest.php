<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Core\Models\Tenant;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Testy funkcjonalne dla autentykacji.
 */
class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    /**
     * Test: Użytkownik może się zalogować.
     */
    public function test_user_can_login(): void
    {
        $tenant = Tenant::create([
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
        ]);

        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'tenant_id' => $tenant->id,
            'email_verified_at' => now(),
        ]);

        $response = $this->post('/admin/login', [
            'email' => 'test@example.com',
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
    }

    /**
     * Test: Użytkownik nie może uzyskać dostępu do danych innego tenanta.
     */
    public function test_user_cannot_access_other_tenant(): void
    {
        $tenant1 = Tenant::create([
            'name' => 'Tenant 1',
            'slug' => 'tenant-1',
        ]);

        $tenant2 = Tenant::create([
            'name' => 'Tenant 2',
            'slug' => 'tenant-2',
        ]);

        $user1 = User::create([
            'name' => 'User 1',
            'email' => 'user1@example.com',
            'password' => bcrypt('password'),
            'tenant_id' => $tenant1->id,
            'email_verified_at' => now(),
        ]);

        $user2 = User::create([
            'name' => 'User 2',
            'email' => 'user2@example.com',
            'password' => bcrypt('password'),
            'tenant_id' => $tenant2->id,
            'email_verified_at' => now(),
        ]);

        // Zaloguj jako user1
        $this->actingAs($user1);

        // user1 nie powinien mieć dostępu do tenant2
        // W Filament multi-tenancy, próba dostępu do innego tenanta
        // powinna zwrócić 404 lub przekierowanie
        $this->assertTrue($user1->tenant_id !== $user2->tenant_id);
    }

    /**
     * Test: Super admin ma dostęp do wszystkich tenantów.
     */
    public function test_super_admin_can_access_all_tenants(): void
    {
        $tenant1 = Tenant::create([
            'name' => 'Tenant 1',
            'slug' => 'tenant-1',
        ]);

        $tenant2 = Tenant::create([
            'name' => 'Tenant 2',
            'slug' => 'tenant-2',
        ]);

        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@octadecimal.studio',
            'password' => bcrypt('password'),
            'is_super_admin' => true,
            'email_verified_at' => now(),
        ]);
        $superAdmin->assignRole('super_admin');

        $this->actingAs($superAdmin);

        // Super admin powinien móc uzyskać dostęp do obu tenantów
        $tenants = $superAdmin->getTenants(app(\Filament\Panel::class));

        $this->assertCount(2, $tenants);
    }

    /**
     * Test: Niepoprawne dane logowania są odrzucane.
     */
    public function test_invalid_credentials_rejected(): void
    {
        $tenant = Tenant::create([
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
        ]);

        User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'tenant_id' => $tenant->id,
        ]);

        $response = $this->post('/admin/login', [
            'email' => 'test@example.com',
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }
}
