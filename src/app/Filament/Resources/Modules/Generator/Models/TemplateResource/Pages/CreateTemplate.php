<?php

namespace App\Filament\Resources\Modules\Generator\Models\TemplateResource\Pages;

use App\Filament\Resources\Modules\Generator\Models\TemplateResource;
use Filament\Actions;
use Filament\Resources\Pages\CreateRecord;

class CreateTemplate extends CreateRecord
{
    protected static string $resource = TemplateResource::class;
}
