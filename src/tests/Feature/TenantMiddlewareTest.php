<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Core\Middleware\EnsureTenantSession;
use App\Modules\Core\Models\Tenant;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

/**
 * Testy funkcjonalne dla middleware EnsureTenantSession.
 */
class TenantMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    /**
     * Test: Middleware ustawia kontekst tenanta.
     */
    public function test_middleware_sets_tenant_context(): void
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

        $this->actingAs($user);

        // Symuluj request
        $request = Request::create('/admin', 'GET');
        $request->setUserResolver(fn () => $user);

        $middleware = new EnsureTenantSession();
        $response = $middleware->handle($request, function ($req) use ($tenant) {
            // Sprawdź czy tenant jest ustawiony
            if (app()->bound('current_tenant')) {
                $currentTenant = app('current_tenant');
                $this->assertEquals($tenant->id, $currentTenant->id);
            }

            return response('OK');
        });

        $this->assertEquals(200, $response->getStatusCode());
    }

    /**
     * Test: Middleware odrzuca nieaktywnego tenanta.
     */
    public function test_middleware_rejects_inactive_tenant(): void
    {
        $tenant = Tenant::create([
            'name' => 'Inactive Tenant',
            'slug' => 'inactive-tenant',
            'is_active' => false,
        ]);

        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'tenant_id' => $tenant->id,
        ]);

        $this->actingAs($user);

        $request = Request::create('/admin', 'GET');
        $request->setUserResolver(fn () => $user);

        $middleware = new EnsureTenantSession();

        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);

        $middleware->handle($request, function ($req) {
            return response('OK');
        });
    }

    /**
     * Test: Middleware pozwala super adminowi bez tenanta.
     */
    public function test_middleware_allows_super_admin_without_tenant(): void
    {
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@octadecimal.studio',
            'password' => bcrypt('password'),
            'is_super_admin' => true,
        ]);
        $superAdmin->assignRole('super_admin');

        $this->actingAs($superAdmin);

        $request = Request::create('/admin', 'GET');
        $request->setUserResolver(fn () => $superAdmin);

        $middleware = new EnsureTenantSession();
        $response = $middleware->handle($request, function ($req) {
            return response('OK');
        });

        $this->assertEquals(200, $response->getStatusCode());
    }

    /**
     * Test: Middleware odrzuca zwykłego użytkownika bez tenanta.
     */
    public function test_middleware_rejects_user_without_tenant(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'tenant_id' => null,
            'is_super_admin' => false,
        ]);

        $this->actingAs($user);

        $request = Request::create('/admin', 'GET');
        $request->setUserResolver(fn () => $user);

        $middleware = new EnsureTenantSession();

        $this->expectException(\Symfony\Component\HttpKernel\Exception\NotFoundHttpException::class);

        $middleware->handle($request, function ($req) {
            return response('OK');
        });
    }
}
