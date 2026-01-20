# Slack MCP Server - Development Control Hub

## 🎯 Cel projektu

Custom MCP Server umożliwiający kontrolę development workflow przez Slack:
- Tworzenie PR przez Slack
- Mergowanie PR przez Slack
- Sprawdzanie statusu CI/CD
- Zlecanie zadań Cursor AI
- Natural language commands

## 🏗️ Architektura

```
┌─────────────┐
│   Slack     │ Slash commands + Interactive messages
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ MCP Server  │ Node.js/TypeScript + Slack SDK + MCP SDK
│  (Docker)   │
└──────┬──────┘
       │
       ├──→ GitHub API (create PR, merge, check CI)
       ├──→ Git Operations (local clone, push)
       └──→ Cursor AI Context (respond to Slack)
```

## 📋 Tech Stack

- **Runtime:** Node.js 20+ / Bun
- **Language:** TypeScript
- **MCP SDK:** `@modelcontextprotocol/sdk`
- **Slack SDK:** `@slack/bolt`
- **GitHub API:** Octokit
- **Deployment:** Docker (local dev)

## 🚀 Features (MVP)

### Phase 1: Basic Commands (Dzisiaj)
- [x] Setup projektu + dependencies
- [ ] `/cursor status` - pokaż aktywne PR i CI/CD
- [ ] `/cursor merge <pr_number>` - merge PR
- [ ] `/cursor check-ci <pr_number>` - sprawdź CI/CD status
- [ ] MCP Server registration w Cursor

### Phase 2: Natural Language (Jutro)
- [ ] Natural language parsing
- [ ] Context-aware responses
- [ ] Multi-step workflows

### Phase 3: AI Integration (Przyszłość)
- [ ] AI agent który prowadzi rozmowę
- [ ] Proaktywne sugestie
- [ ] Team collaboration

## 📁 Struktura

```
tools/slack-mcp-server/
├── src/
│   ├── index.ts           # MCP Server entry point
│   ├── slack/
│   │   ├── bot.ts         # Slack Bot setup
│   │   ├── commands.ts    # Slash commands
│   │   └── events.ts      # Event handlers
│   ├── github/
│   │   ├── api.ts         # GitHub API wrapper
│   │   └── operations.ts  # Git operations
│   ├── mcp/
│   │   ├── server.ts      # MCP Server implementation
│   │   └── tools.ts       # MCP Tools definitions
│   └── types.ts           # TypeScript types
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Security

- Slack Bot Token → Environment variable
- GitHub Token → Environment variable
- MCP Server → Local only (127.0.0.1)
- No secrets in code!

## 📊 Success Metrics

- ✅ Merge PR z Slack < 10s
- ✅ Check CI status realtime
- ✅ Natural language commands work
- ✅ Zero downtime w głównym workflow

## 🎓 Learning Goals

1. **MCP Protocol** - jak działa komunikacja AI ↔ Tools
2. **Slack SDK** - interactive messages, slash commands
3. **Event-driven architecture** - webhooks, real-time updates
4. **Docker orchestration** - MCP Gateway + Custom Server

## 📚 Resources

- [MCP SDK Docs](https://github.com/anthropics/model-context-protocol)
- [Slack Bolt Framework](https://slack.dev/bolt-js/)
- [Octokit GitHub API](https://github.com/octokit/octokit.js)

---

**Start:** 2026-01-20 01:52
**ETA Phase 1:** 60 min
