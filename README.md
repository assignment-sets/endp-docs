# `endp-docs` (or `endp`) 🚀

> **Standalone CLI to query OpenAPI specs and extract self-contained endpoint contracts with resolved schemas. Token-optimized for AI coding agents using Markdown and compact DSL formats so agents can skip JSON boilerplate and directly read clean API contracts while generating frontend clients.**

[![npm version](https://img.shields.io/npm/v/endp-docs.svg)](https://www.npmjs.com/package/endp-docs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 💡 Why `endp-docs`?

When pair-programming with **AI coding agents** (Cursor, Claude Code, Antigravity, Aider) to build frontend UIs against an existing backend, giving the agent proper endpoint context is painful:

1. **The Context Dumping Problem:** You either dump large portions of the backend repository (controllers, services, request/response DTOs, error handlers) into the AI agent's context window—wasting thousands of tokens, increasing costs, and polluting context.
2. **The Manual Swagger UI Copy-Paste:** Or you open Swagger UI in the browser, hunt down the endpoint, and manually copy-paste the request payload, response shapes, and error status codes one by one.

### The Solution
`endp-docs` allows the AI agent (or developer) to run a single command in the terminal. It fetches the raw OpenAPI specification directly from the server or URL, finds the endpoint, **recursively resolves all transitive `$ref` schemas (DTOs, nested objects, enums, error models)**, and prints a **100% self-contained contract**.

---

## ⚡ Installation & Execution

You can use the full name **`endp-docs`** or the ultra-short alias **`endp`**.

### Option 1: Global Install (Recommended — No `npx` prefix needed!)
Install globally once to use `endp` instantly anywhere across all your terminal sessions:

```bash
# Using npm
npm install -g endp-docs

# Using pnpm
pnpm add -g endp-docs

# Using bun
bun add -g endp-docs
```

Now you can simply run:
```bash
endp get POST /api/v1/auth/login --format compact
```

---

### Option 2: On-Demand Execution (via `npx` / `pnpm dlx`)
If you prefer not to install globally:

```bash
npx endp-docs get POST /api/v1/auth/login --format compact
# or with pnpm
pnpm dlx endp-docs get POST /api/v1/auth/login --format compact
```

---

## 🎯 Output Formats

`endp-docs` supports three tailored output modes:

| Format Flag | Target Audience | Characteristics |
| :--- | :--- | :--- |
| **`--format compact`** *(Recommended for AI)* | AI Coding Agents | Custom token-dense DSL. **Saves >60% tokens** compared to JSON while retaining 100% of types, required fields, examples, and error schemas. |
| **`--format markdown`** | Humans & IDE Previews | Rich Markdown tables with inline DTO property breakdowns, grouped error status codes, and collapsible raw schemas. |
| **`--format json`** | Machine / Programmatic | Pure, raw resolved JSON object containing operation definitions and filtered component schemas. |

---

## 🚀 Quick Start Workflow

```bash
# 1. Initialize project config once in your project root (.endpointdocsrc.json)
endp init --spec http://localhost:8080/v3/api-docs

# 2. Extract self-contained endpoint contract for your AI agent (Compact DSL mode)
endp get POST /api/v1/auth/login --format compact

# 3. View endpoint documentation in Markdown format
endp get POST /api/v1/auth/login --format markdown

# 4. Search endpoints across paths, summaries, and tags
endp search user

# 5. List all available endpoints in the spec
endp list --tag user-controller
```

---

## 📝 Example Output (`--format compact`)

Running `endp get POST /api/v1/auth/login --format compact`:

```text
POST /api/v1/auth/login [auth-controller] [auth: bearerAuth (http bearer JWT)]

REQ (application/json): LoginRequest

LoginRequest {
  email: string!
  password: string!
}

RESP 200 (OK) [*/*]: AuthResponse

AuthResponse {
  token: string
  email: string
  role: string
}

ERRORS [400 Bad Request, 403 Forbidden, 404 Not Found, 409 Conflict]: ApiErrorResponse

ApiErrorResponse {
  timestamp: string (eg: "2026-08-07T14:24:41")
  status: int32 (eg: 404)
  error: string (eg: "Not Found")
  message: string (eg: "Train with ID 123 not found")
}
```

> 📌 **Notice:** Notice how status codes `400`, `403`, `404`, and `409` sharing `ApiErrorResponse` are consolidated without duplicating the schema, while required fields (`!`) and security schemes (`bearerAuth`) are clearly marked with zero syntax fluff.

---

## 🛠️ CLI Reference

### `endp init`
Saves the OpenAPI spec URL to `.endpointdocsrc.json` in the current working directory.
```bash
endp init --spec <URL>
```

### `endp get <METHOD> <PATH>`
Fetches clean endpoint definition and recursively resolves referenced DTO schemas.
```bash
endp get GET /api/v1/users --format compact
endp get POST /api/v1/bookings --format markdown
endp get GET /api/v1/users --spec http://localhost:8080/v3/api-docs
```

### `endp list`
Lists all available endpoints in the spec with optional tag filtering.
```bash
endp list [--tag <TAG>] [--format text|json]
```

### `endp search <QUERY>`
Searches endpoints across paths, summaries, operation IDs, and tags.
```bash
endp search <QUERY> [--format text|json]
```

---

## 📄 License

[MIT LICENSE](LICENSE) © [hellogrb](https://github.com/assignment-sets)
