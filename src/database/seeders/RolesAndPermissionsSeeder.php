<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Seeder tworzący podstawowe role i uprawnienia systemu.
 */
class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Uruchom seeder.
     */
    public function run(): void
    {
        // Wyczyść cache uprawnień
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // === UPRAWNIENIA ===

        // Projekty
        $projectPermissions = [
            'projects.view',
            'projects.create',
            'projects.edit',
            'projects.delete',
            'projects.deploy',
        ];

        // Treści
        $contentPermissions = [
            'content.view',
            'content.create',
            'content.edit',
            'content.delete',
            'content.publish',
        ];

        // Media
        $mediaPermissions = [
            'media.view',
            'media.upload',
            'media.edit',
            'media.delete',
        ];

        // Użytkownicy (tylko dla adminów)
        $userPermissions = [
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
        ];

        // Ustawienia
        $settingsPermissions = [
            'settings.view',
            'settings.edit',
        ];

        // Szablony
        $templatePermissions = [
            'templates.view',
            'templates.create',
            'templates.edit',
            'templates.delete',
            'templates.generate', // AI generation
        ];

        // Integracje
        $integrationPermissions = [
            'integrations.allegro',
            'integrations.dns',
            'integrations.ssl',
        ];

        // Wszystkie uprawnienia
        $allPermissions = array_merge(
            $projectPermissions,
            $contentPermissions,
            $mediaPermissions,
            $userPermissions,
            $settingsPermissions,
            $templatePermissions,
            $integrationPermissions
        );

        // Utwórz wszystkie uprawnienia
        foreach ($allPermissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        // === ROLE ===

        // Super Admin - pełny dostęp do wszystkiego (Octadecimal)
        $superAdmin = Role::findOrCreate('super_admin', 'web');
        $superAdmin->givePermissionTo($allPermissions);

        // Tenant Admin - pełny dostęp w ramach swojego tenanta
        $tenantAdmin = Role::findOrCreate('tenant_admin', 'web');
        $tenantAdmin->givePermissionTo([
            ...$projectPermissions,
            ...$contentPermissions,
            ...$mediaPermissions,
            ...$userPermissions,
            ...$settingsPermissions,
            ...$templatePermissions,
            ...$integrationPermissions,
        ]);

        // Editor - może edytować treści i media
        $editor = Role::findOrCreate('editor', 'web');
        $editor->givePermissionTo([
            'projects.view',
            'projects.edit',
            ...$contentPermissions,
            ...$mediaPermissions,
            'templates.view',
        ]);

        // Viewer - tylko odczyt
        $viewer = Role::findOrCreate('viewer', 'web');
        $viewer->givePermissionTo([
            'projects.view',
            'content.view',
            'media.view',
            'templates.view',
        ]);
    }
}
