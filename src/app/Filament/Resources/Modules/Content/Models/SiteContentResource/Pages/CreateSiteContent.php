<?php

declare(strict_types=1);

namespace App\Filament\Resources\Modules\Content\Models\SiteContentResource\Pages;

use App\Filament\Resources\Modules\Content\Models\SiteContentResource;
use Filament\Resources\Pages\CreateRecord;

class CreateSiteContent extends CreateRecord
{
    protected static string $resource = SiteContentResource::class;
}
