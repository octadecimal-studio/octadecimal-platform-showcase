<?php

declare(strict_types=1);

namespace App\Modules\Generator\Models;

use App\Modules\Core\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Model gotowych szablonów Next.js.
 *
 * Reprezentuje gotowe szablony z katalogu templates/ dostępne do użycia w projektach.
 *
 * @property string $id UUID
 * @property string $tenant_id UUID tenanta
 * @property string $name Nazwa szablonu
 * @property string $slug Slug (unikalny)
 * @property string $directory_path Ścieżka do katalogu szablonu (względem templates/)
 * @property string|null $category Kategoria (portfolio, landing, corporate, blog)
 * @property array<string> $tech_stack Stack technologiczny (Next.js, TypeScript, Tailwind)
 * @property string|null $description Opis szablonu
 * @property array<string, mixed>|null $metadata Metadane (komponenty, style, zależności)
 * @property string|null $thumbnail_url URL miniaturki
 * @property string|null $preview_url URL preview (iframe)
 * @property array<string>|null $tags Tagi
 * @property bool $is_active Czy aktywny
 * @property bool $is_premium Czy premium
 * @property int $usage_count Licznik użyć
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 */
final class Template extends Model
{
    use BelongsToTenant;

    /** @use HasFactory<\Database\Factories\TemplateFactory> */
    use HasFactory;

    use HasUuids;
    use SoftDeletes;

    /**
     * Nazwa factory dla modelu.
     */
    protected static function newFactory(): \Database\Factories\TemplateFactory
    {
        return \Database\Factories\TemplateFactory::new();
    }

    /**
     * Nazwa tabeli.
     */
    protected $table = 'templates';

    /**
     * Atrybuty które można masowo przypisywać.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'directory_path',
        'category',
        'tech_stack',
        'description',
        'metadata',
        'thumbnail_url',
        'preview_url',
        'tags',
        'is_active',
        'is_premium',
    ];

    /**
     * Rzutowanie atrybutów.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tech_stack' => 'array',
            'metadata' => 'array',
            'tags' => 'array',
            'is_active' => 'boolean',
            'is_premium' => 'boolean',
            'usage_count' => 'integer',
        ];
    }

    /**
     * Scope: Tylko aktywne szablony.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<static>  $query
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public function scopeActive(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Filtruj po kategorii.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<static>  $query
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public function scopeOfCategory(\Illuminate\Database\Eloquent\Builder $query, string $category): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('category', $category);
    }

    /**
     * Zwiększ licznik użyć.
     */
    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }

    /**
     * Pobierz pełną ścieżkę do katalogu szablonu.
     */
    public function getFullPath(): string
    {
        return base_path('templates/'.$this->directory_path);
    }
}
