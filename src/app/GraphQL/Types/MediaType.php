<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use App\Modules\Content\Models\Media;
use GraphQL\Type\Definition\Type;
use Nuwave\Lighthouse\Schema\TypeRegistry;

/**
 * GraphQL Type resolver dla Media.
 *
 * Dodaje custom resolvers dla `url` i `variantUrl`.
 */
class MediaType
{
    public function __construct(
        private TypeRegistry $typeRegistry
    ) {}

    /**
     * Resolver dla pola `url` w Media.
     */
    public function url(Media $media): string
    {
        return $media->getUrl();
    }

    /**
     * Resolver dla pola `variantUrl` w Media.
     *
     * @param  array<string, mixed>  $args
     */
    public function variantUrl(Media $media, array $args): ?string
    {
        $variant = $args['variant'] ?? 'thumbnail';

        return $media->getVariantUrl($variant);
    }
}
