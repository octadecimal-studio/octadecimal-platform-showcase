<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Główny seeder bazy danych.
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Seeduje bazę danych aplikacji.
     */
    public function run(): void
    {
        // Najpierw role i uprawnienia
        $this->call(RolesAndPermissionsSeeder::class);

        // Następnie tenanty i użytkownicy
        $this->call(TenantSeeder::class);
    }
}
