<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Core\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeder tworzący przykładowego tenanta i użytkowników.
 */
class TenantSeeder extends Seeder
{
    /**
     * Uruchom seeder.
     */
    public function run(): void
    {
        // === SUPER ADMIN (bez tenanta) ===
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@octadecimal.studio'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        // is_super_admin ustawiamy bezpośrednio (chronione przed mass assignment)
        $superAdmin->is_super_admin = true;
        $superAdmin->save();
        $superAdmin->assignRole('super_admin');

        // === PRZYKŁADOWY TENANT ===
        $demoTenant = Tenant::firstOrCreate(
            ['slug' => 'demo-studio'],
            [
                'name' => 'Demo Studio',
                'domain' => null,
                'plan' => 'pro',
                'database_type' => 'shared',
                'settings' => [
                    'locale' => 'pl',
                    'timezone' => 'Europe/Warsaw',
                    'branding' => [
                        'primary_color' => '#3B82F6',
                        'logo' => null,
                    ],
                ],
                'is_active' => true,
            ]
        );

        // Tenant Admin dla demo tenanta
        $tenantAdmin = User::firstOrCreate(
            ['email' => 'admin@demo-studio.local'],
            [
                'name' => 'Demo Admin',
                'password' => Hash::make('password'),
                'tenant_id' => $demoTenant->id,
                'email_verified_at' => now(),
            ]
        );
        $tenantAdmin->assignRole('tenant_admin');

        // Editor dla demo tenanta
        $editor = User::firstOrCreate(
            ['email' => 'editor@demo-studio.local'],
            [
                'name' => 'Demo Editor',
                'password' => Hash::make('password'),
                'tenant_id' => $demoTenant->id,
                'email_verified_at' => now(),
            ]
        );
        $editor->assignRole('editor');

        // Viewer dla demo tenanta
        $viewer = User::firstOrCreate(
            ['email' => 'viewer@demo-studio.local'],
            [
                'name' => 'Demo Viewer',
                'password' => Hash::make('password'),
                'tenant_id' => $demoTenant->id,
                'email_verified_at' => now(),
            ]
        );
        $viewer->assignRole('viewer');

        // === DRUGI TENANT (dla testów izolacji) ===
        $secondTenant = Tenant::firstOrCreate(
            ['slug' => 'test-agency'],
            [
                'name' => 'Test Agency',
                'domain' => null,
                'plan' => 'starter',
                'database_type' => 'shared',
                'settings' => [
                    'locale' => 'pl',
                    'timezone' => 'Europe/Warsaw',
                ],
                'is_active' => true,
            ]
        );

        $secondAdmin = User::firstOrCreate(
            ['email' => 'admin@test-agency.local'],
            [
                'name' => 'Test Agency Admin',
                'password' => Hash::make('password'),
                'tenant_id' => $secondTenant->id,
                'email_verified_at' => now(),
            ]
        );
        $secondAdmin->assignRole('tenant_admin');
    }
}
