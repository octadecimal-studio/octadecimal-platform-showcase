<?php

declare(strict_types=1);

namespace App\Filament\Resources\Modules\Generator\Models;

use App\Filament\Resources\Modules\Generator\Models\TemplateResource\Pages;
use App\Modules\Generator\Models\Template;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

/**
 * Filament Resource dla zarządzania gotowymi szablonami Next.js.
 */
final class TemplateResource extends Resource
{
    protected static ?string $model = Template::class;

    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';

    protected static ?string $navigationLabel = 'Szablony Next.js';

    protected static ?string $modelLabel = 'Szablon';

    protected static ?string $pluralModelLabel = 'Szablony';

    protected static ?string $navigationGroup = 'Generator';

    /**
     * Formularz edycji/tworzenia szablonu.
     */
    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Podstawowe informacje')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->label('Nazwa')
                            ->required()
                            ->maxLength(255)
                            ->columnSpanFull(),

                        Forms\Components\TextInput::make('slug')
                            ->label('Slug')
                            ->required()
                            ->maxLength(255)
                            ->unique(ignoreRecord: true)
                            ->helperText('Unikalny identyfikator szablonu'),

                        Forms\Components\TextInput::make('directory_path')
                            ->label('Ścieżka do katalogu')
                            ->required()
                            ->maxLength(255)
                            ->helperText('Ścieżka względem templates/ (np. octadecimal.studio)')
                            ->columnSpanFull(),

                        Forms\Components\Select::make('category')
                            ->label('Kategoria')
                            ->options([
                                'portfolio' => 'Portfolio',
                                'landing' => 'Landing Page',
                                'corporate' => 'Corporate',
                                'blog' => 'Blog',
                                'ecommerce' => 'E-commerce',
                                'other' => 'Inne',
                            ])
                            ->native(false),

                        Forms\Components\Textarea::make('description')
                            ->label('Opis')
                            ->rows(3)
                            ->columnSpanFull(),

                        Forms\Components\TagsInput::make('tech_stack')
                            ->label('Stack technologiczny')
                            ->separator(',')
                            ->helperText('np. Next.js, TypeScript, Tailwind CSS')
                            ->columnSpanFull(),

                        Forms\Components\TagsInput::make('tags')
                            ->label('Tagi')
                            ->separator(',')
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('Preview i metadane')
                    ->schema([
                        Forms\Components\TextInput::make('thumbnail_url')
                            ->label('URL miniaturki')
                            ->url()
                            ->maxLength(255)
                            ->columnSpanFull(),

                        Forms\Components\TextInput::make('preview_url')
                            ->label('URL preview (iframe)')
                            ->url()
                            ->maxLength(255)
                            ->columnSpanFull(),

                        Forms\Components\KeyValue::make('metadata')
                            ->label('Metadane (JSON)')
                            ->keyLabel('Klucz')
                            ->valueLabel('Wartość')
                            ->columnSpanFull()
                            ->helperText('Komponenty, style, zależności'),
                    ]),

                Forms\Components\Section::make('Status')
                    ->schema([
                        Forms\Components\Toggle::make('is_active')
                            ->label('Aktywny')
                            ->default(true),

                        Forms\Components\Toggle::make('is_premium')
                            ->label('Premium')
                            ->default(false),
                    ])
                    ->columns(2),
            ]);
    }

    /**
     * Tabela listy szablonów.
     */
    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('thumbnail_url')
                    ->label('Preview')
                    ->height(60)
                    ->width(60)
                    ->defaultImageUrl('/images/placeholder-template.png'),

                Tables\Columns\TextColumn::make('name')
                    ->label('Nazwa')
                    ->searchable()
                    ->sortable()
                    ->weight('bold')
                    ->limit(30),

                Tables\Columns\TextColumn::make('category')
                    ->label('Kategoria')
                    ->badge()
                    ->searchable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('tech_stack')
                    ->label('Stack')
                    ->badge()
                    ->separator(',')
                    ->limit(3)
                    ->toggleable(),

                Tables\Columns\TextColumn::make('directory_path')
                    ->label('Ścieżka')
                    ->searchable()
                    ->limit(30)
                    ->toggleable(),

                Tables\Columns\IconColumn::make('is_active')
                    ->label('Aktywny')
                    ->boolean()
                    ->toggleable(),

                Tables\Columns\IconColumn::make('is_premium')
                    ->label('Premium')
                    ->boolean()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('usage_count')
                    ->label('Użycia')
                    ->sortable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Utworzono')
                    ->dateTime('d.m.Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('category')
                    ->label('Kategoria')
                    ->options([
                        'portfolio' => 'Portfolio',
                        'landing' => 'Landing Page',
                        'corporate' => 'Corporate',
                        'blog' => 'Blog',
                        'ecommerce' => 'E-commerce',
                        'other' => 'Inne',
                    ])
                    ->native(false),

                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Aktywny')
                    ->placeholder('Wszystkie')
                    ->trueLabel('Tak')
                    ->falseLabel('Nie'),

                Tables\Filters\TernaryFilter::make('is_premium')
                    ->label('Premium')
                    ->placeholder('Wszystkie')
                    ->trueLabel('Tak')
                    ->falseLabel('Nie'),

                Tables\Filters\TrashedFilter::make(),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('preview')
                    ->label('Preview')
                    ->icon('heroicon-o-eye')
                    ->color('info')
                    ->url(fn (Template $record): string => $record->preview_url ?? '#')
                    ->openUrlInNewTab()
                    ->visible(fn (Template $record): bool => ! empty($record->preview_url)),
                Tables\Actions\DeleteAction::make(),
                Tables\Actions\RestoreAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\RestoreBulkAction::make(),
                    Tables\Actions\ForceDeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }

    /**
     * Relacje.
     */
    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    /**
     * Strony Resource.
     */
    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTemplates::route('/'),
            'create' => Pages\CreateTemplate::route('/create'),
            'view' => Pages\ViewTemplate::route('/{record}'),
            'edit' => Pages\EditTemplate::route('/{record}/edit'),
        ];
    }

    /**
     * Query builder z domyślnymi filtrami.
     *
     * @return Builder<Template>
     */
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->withoutGlobalScopes([
                SoftDeletingScope::class,
            ]);
    }
}
