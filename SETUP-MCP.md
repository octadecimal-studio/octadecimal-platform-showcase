# Konfiguracja GitHub MCP Server

## Krok 1: Utwórz Personal Access Token

1. Przejdź do: https://github.com/settings/tokens?type=beta
2. Kliknij "Generate new token"
3. Nadaj nazwę: `octadecimal-mcp`
4. Ustaw expiration: 90 dni lub więcej
5. Wybierz permissions:
   - `repo` (Full control)
   - `admin:org` (dla fork management)
   - `workflow` (dla GitHub Actions)
6. Skopiuj token

## Krok 2: Dodaj do ~/.cursor/mcp.json

```json
{
  "mcpServers": {
    "MCP_DOCKER": {
      "command": "docker",
      "args": ["mcp", "gateway", "run"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<WKLEJ_TUTAJ_TOKEN>"
      }
    }
  }
}
```

## Krok 3: Zrestartuj Cursor

Po zapisaniu pliku zrestartuj Cursor, aby MCP Server się załadował.

## Weryfikacja

Po restarcie powinieneś mieć dostęp do narzędzi:
- `github_create_issue`
- `github_create_pull_request`
- `github_push_files`
- `github_create_repository`
- I inne...

## Fallback: gh CLI

Jeśli MCP nie działa, użyj gh CLI:

```bash
# Zaloguj się
gh auth login

# Sprawdź status
gh auth status

# Operacje na repo
gh repo view Octadecimal-Studio/octadecimal.studio
```
