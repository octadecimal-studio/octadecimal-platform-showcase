# Reguły kontrybucji

> Dokument definiuje standardy pracy i konwencje stosowane w projekcie.
> 
> Reguły architektury, bezpieczeństwa i AI znajdziesz w [.cursorrules](./.cursorrules)

---

## Git Workflow

### Strategia branching

```
main ──────────────────────────────► (produkcja, protected)
  │
  └── develop ─────────────────────► (integracja)
        │
        ├── feature/etap-XX-nazwa ─► PR ─► merge
        │
        ├── fix/opis-problemu ─────► PR ─► merge
        │
        └── hotfix/opis ───────────► PR ─► merge (pilne)
```

### Nazewnictwo branchy

```bash
feature/etap-01-docker-setup
feature/etap-02-content-module
fix/reservation-conflict-validation
refactor/extract-conflict-checker
hotfix/ssl-certificate-renewal
```

---

## Konwencja commitów

### Format (Conventional Commits)

```
<type>(<scope>): <opis po polsku>

[opcjonalnie: body]

[opcjonalnie: footer]
```

### Typy

| Typ | Opis |
|-----|------|
| `feat` | Nowa funkcjonalność |
| `fix` | Naprawa błędu |
| `refactor` | Refaktoryzacja |
| `docs` | Dokumentacja |
| `test` | Testy |
| `chore` | Konfiguracja |
| `style` | Formatowanie |

### Scope

`backend`, `frontend`, `api`, `db`, `docker`, `ui`, `content`, `deploy`, `generator`, `marketplace`

### Przykłady

```bash
feat(content): dodanie wersjonowania treści
feat(api): implementacja endpointu GraphQL dla mediów
fix(deploy): naprawa timeout przy generowaniu SSL
docs(readme): dodanie instrukcji instalacji Docker
test(e2e): testy wizualne dla galerii mediów
chore(docker): konfiguracja healthcheck dla MySQL
```

### Zasady

1. **Atomowość** - jeden commit = jedna logiczna zmiana
2. **Język polski** - opisy commitów w języku polskim
3. **Typ angielski** - typy (feat, fix, etc.) pozostają po angielsku
4. **Max 72 znaki** - w pierwszej linii
5. **Bez kropki** - na końcu opisu

---

## Quality Gates

### Przed commitem

```bash
# Backend
./vendor/bin/phpstan analyse --level=8
./vendor/bin/php-cs-fixer fix --dry-run
./vendor/bin/phpunit

# Frontend
npm run lint
npm run type-check
npm test

# E2E (opcjonalnie przed PR)
npx playwright test --config=playwright.pr.config.ts
```

### Wymagania

- PHPStan level 8 - zero errors
- ESLint - zero warnings
- Testy - 100% pass
- Brak `console.log` / `dd()` / `dump()` w kodzie
- Brak secrets w kodzie

---

## Struktura testów

```
tests/
├── Unit/              # Testy jednostkowe PHP
│   ├── Models/
│   ├── Services/
│   └── Helpers/
├── Feature/           # Testy funkcjonalne PHP
│   ├── Api/
│   ├── Filament/
│   └── GraphQL/
├── e2e/               # Testy Playwright
│   ├── admin/         # Panel admin
│   ├── generated/     # Wygenerowane strony
│   └── visual/        # Visual regression
└── fixtures/          # Dane testowe
```

### Wymagania testów

- **Unit tests:** min 80% coverage dla nowego kodu
- **Feature tests:** dla każdego endpointu API
- **E2E tests:** dla każdego krytycznego flow
- **Visual regression:** dla stron generowanych

---

## Docker

### Development

```bash
# Start wszystkich serwisów
./vendor/bin/sail up -d

# Artisan commands
./vendor/bin/sail artisan migrate
./vendor/bin/sail artisan db:seed
./vendor/bin/sail artisan queue:work

# Testy
./vendor/bin/sail test
./vendor/bin/sail phpstan

# Logi
./vendor/bin/sail logs -f app

# Stop
./vendor/bin/sail down
```

### Pliki Docker

```
docker/
├── docker-compose.yml          # Produkcja
├── docker-compose.dev.yml      # Development override
├── docker-compose.ci.yml       # CI/CD testing
├── php/
│   ├── Dockerfile
│   └── php.ini
├── nginx/
│   └── default.conf
└── mysql/
    └── my.cnf
```

---

## Dokumentacja kodu

### PHP (PHPDoc)

```php
/**
 * Serwis zarządzający treściami.
 */
final readonly class ContentService
{
    /**
     * Publikuje treść.
     *
     * @param SiteContent $content Treść do publikacji
     * @return bool Czy publikacja się powiodła
     * @throws ContentNotReadyException Gdy treść nie jest gotowa
     */
    public function publish(SiteContent $content): bool
    {
        // ...
    }
}
```

### TypeScript (JSDoc)

```tsx
/**
 * Komponent wyświetlający galerię mediów.
 */
interface MediaGalleryProps {
  /** Lista mediów do wyświetlenia */
  media: Media[];
  /** Callback po kliknięciu */
  onSelect?: (media: Media) => void;
}

export function MediaGallery({ media, onSelect }: MediaGalleryProps) {
  // ...
}
```

---

## Nazewnictwo

### PHP

| Element | Konwencja | Przykład |
|---------|-----------|----------|
| Klasa | PascalCase | `ContentService` |
| Interface | PascalCase + Interface | `ContentRepositoryInterface` |
| Trait | PascalCase + prefix | `BelongsToTenant`, `HasVersions` |
| Metoda | camelCase | `getPublishedContent()` |
| Zmienna | camelCase | `$templateId` |
| Stała | UPPER_SNAKE_CASE | `MAX_UPLOAD_SIZE` |

### TypeScript

| Element | Konwencja | Przykład |
|---------|-----------|----------|
| Komponent | PascalCase + .tsx | `HeroSection.tsx` |
| Hook | use + camelCase | `useMediaGallery` |
| Interface/Type | PascalCase | `SiteContent` |
| Funkcja | camelCase | `fetchContent()` |
| Zmienna | camelCase | `projectSlug` |
| Stała | UPPER_SNAKE_CASE | `API_BASE_URL` |

---

## Pull Request

### Szablon

```markdown
## [Etap X] Nazwa etapu

### Podsumowanie
- Opis głównych zmian

### Zmiany
- `src/app/Modules/Content/...` - opis zmiany
- `tests/Feature/...` - opis zmiany

### Decyzje techniczne
- Uzasadnienie wyborów architektonicznych

### Testowanie
- [ ] Testy jednostkowe przechodzą
- [ ] Testy funkcjonalne przechodzą
- [ ] Testy E2E przechodzą (jeśli dotyczy)
- [ ] Testy manualne wykonane

### Checklist
- [ ] PHPStan level 8 - zero błędów
- [ ] ESLint - zero ostrzeżeń
- [ ] Dokumentacja zaktualizowana
- [ ] Brak console.log/dd() w kodzie
- [ ] Brak secrets w kodzie
- [ ] Definition of Done z planu fazy spełnione
```

### Przykładowe tytuły PR

```
[Etap 1] Setup i Infrastruktura Docker
[Etap 2] Content Module - modele i migracje
[Etap 3] AI Template Generator - integracja Claude
[Fix] Naprawa walidacji konfliktów rezerwacji
```

### Wymagania PR

- Min 1 approval przed merge
- Wszystkie checks PASS
- Branch aktualny z develop
- Merge przez "Squash and merge" (preferowane)

---

## Workflow etapu

### Rozpoczęcie pracy

1. Sprawdź aktualny etap w `docs/fazy/FAZA-1-MVP.md`
2. Utwórz branch: `git checkout -b feature/etap-XX-nazwa`
3. Przeczytaj Definition of Done dla etapu

### Podczas pracy

1. Commituj małe, atomowe zmiany
2. Pisz testy równolegle z kodem
3. Uruchamiaj quality gates regularnie

### Zakończenie

1. Upewnij się, że wszystkie testy PASS
2. Zaktualizuj TODO w planie fazy
3. Utwórz PR z szablonem
4. Poczekaj na code review

---

## Kontakt

- **Repozytorium:** [Octadecimal-Studio/octadecimal.studio](https://github.com/Octadecimal-Studio/octadecimal.studio)
- **Dokumentacja:** `/docs/`
- **Architektura:** `docs/ARCHITECTURE.md`
- **Reguły AI:** `.cursorrules`
