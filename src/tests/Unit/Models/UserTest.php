<?php

declare(strict_types=1);

namespace Tests\Unit\Models;

use App\Models\User;
use App\Modules\Core\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Testy jednostkowe dla modelu User.
 */
class UserTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test: Użytkownik należy do tenanta.
     */
    public function test_user_belongs_to_tenant(): void
    {
        $tenant = Tenant::create([
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
        ]);

        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'tenant_id' => $tenant->id,
        ]);

        $this->assertEquals($tenant->id, $user->tenant_id);
        $this->assertNotNull($user->tenant);
        $this->assertEquals($tenant->name, $user->tenant->name);
    }

    /**
     * Test: Super admin nie ma przypisanego tenanta.
     */
    public function test_super_admin_has_no_tenant(): void
    {
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@example.com',
            'password' => 'password',
            'is_super_admin' => true,
            'tenant_id' => null,
        ]);

        $this->assertTrue($superAdmin->is_super_admin);
        $this->assertNull($superAdmin->tenant_id);
        $this->assertNull($superAdmin->tenant);
    }

    /**
     * Test: Sprawdzenie metody isSuperAdmin.
     */
    public function test_is_super_admin_method(): void
    {
        $tenant = Tenant::create([
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
        ]);

        $regularUser = User::create([
            'name' => 'Regular User',
            'email' => 'user@example.com',
            'password' => 'password',
            'tenant_id' => $tenant->id,
        ]);

        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@example.com',
            'password' => 'password',
            'is_super_admin' => true,
        ]);

        $this->assertFalse($regularUser->isSuperAdmin());
        $this->assertTrue($superAdmin->isSuperAdmin());
    }

    /**
     * Test: Użytkownik używa UUID.
     */
    public function test_user_uses_uuid(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
        ]);

        // UUID powinno być 36-znakowym stringiem
        $this->assertIsString($user->id);
        $this->assertEquals(36, strlen($user->id));
    }
}
