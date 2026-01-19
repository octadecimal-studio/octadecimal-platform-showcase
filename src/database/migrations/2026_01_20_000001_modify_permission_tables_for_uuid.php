<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Modyfikuje tabele Spatie Permission aby wspierać UUID jako model_id.
 */
return new class extends Migration
{
    /**
     * Wykonaj migrację.
     */
    public function up(): void
    {
        // Zmień model_id w model_has_permissions na UUID
        Schema::table('model_has_permissions', function (Blueprint $table) {
            // Drop foreign key constraints if they exist
            $table->dropPrimary(['permission_id', 'model_id', 'model_type']);
            
            // Change column type
            $table->uuid('model_id')->change();
            
            // Recreate primary key
            $table->primary(['permission_id', 'model_id', 'model_type']);
        });

        // Zmień model_id w model_has_roles na UUID
        Schema::table('model_has_roles', function (Blueprint $table) {
            // Drop foreign key constraints if they exist
            $table->dropPrimary(['role_id', 'model_id', 'model_type']);
            
            // Change column type
            $table->uuid('model_id')->change();
            
            // Recreate primary key
            $table->primary(['role_id', 'model_id', 'model_type']);
        });
    }

    /**
     * Cofnij migrację.
     */
    public function down(): void
    {
        Schema::table('model_has_permissions', function (Blueprint $table) {
            $table->dropPrimary(['permission_id', 'model_id', 'model_type']);
            $table->unsignedBigInteger('model_id')->change();
            $table->primary(['permission_id', 'model_id', 'model_type']);
        });

        Schema::table('model_has_roles', function (Blueprint $table) {
            $table->dropPrimary(['role_id', 'model_id', 'model_type']);
            $table->unsignedBigInteger('model_id')->change();
            $table->primary(['role_id', 'model_id', 'model_type']);
        });
    }
};
