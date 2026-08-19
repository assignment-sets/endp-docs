# `endp-docs` 🚀

> Standalone OpenAPI JSON endpoint contract fetcher and schema parser for AI coding agents (Antigravity, Claude Code, Cursor, Aider) and developers.

`endp-docs` fetches raw OpenAPI (v2 / v3) JSON specifications directly from a configured URL, extracts target endpoint definitions, recursively resolves all referenced DTO & component schemas, and outputs clean, self-contained contracts.

---

## Features

- **🤖 Token-Optimized AI Mode (`--format compact`):** Custom compact DSL representation saving **>60% of context tokens** with zero data loss.
- **📄 Markdown Mode (`--format markdown`):** Human-readable Markdown tables, grouped status codes, and collapsible raw JSON schemas.
- **⚡ Raw JSON Mode (`--format json`):** Pure resolved JSON object for programmatic parsing.
- **🔄 Zero Persistence:** Fetches spec fresh on every invocation. No stale local caches.
- **🎯 Smart Diagnostics:** Suggests similar endpoint paths on `stderr` when a lookup fails.

---

## Quick Start

```bash
# 1. Initialize project spec URL config (.endpointdocsrc.json)
npx endp-docs init --spec http://localhost:8080/v3/api-docs

# 2. Get endpoint contract in Compact DSL format (for AI agents)
npx endp-docs get POST /api/v1/auth/login --format compact

# 3. View endpoint in Markdown format (for human review)
npx endp-docs get POST /api/v1/auth/login --format markdown

# 4. List all endpoints in spec
npx endp-docs list --tag user-controller

# 5. Search endpoints by keyword
npx endp-docs search booking
```

---

## Commands & Options

### `endp-docs init`

Initializes `.endpointdocsrc.json` in the current working directory.

```bash
npx endp-docs init --spec <URL>
```

### `endp-docs get <METHOD> <PATH>`

Fetches clean endpoint definition and recursively resolves referenced DTO schemas.

```bash
npx endp-docs get GET /api/v1/users --format compact
npx endp-docs get POST /api/v1/auth/login --format markdown
npx endp-docs get GET /api/v1/users --format json --spec http://localhost:8080/v3/api-docs
```

### `endp-docs list`

Lists all available endpoints from the spec with optional tag filtering.

```bash
npx endp-docs list [--tag <TAG>] [--format text|json]
```

### `endp-docs search <QUERY>`

Searches endpoints across paths, summaries, operation IDs, and tags.

```bash
npx endp-docs search <QUERY> [--format text|json]
```

---

## License

[MIT LICENSE](LICENSE)
