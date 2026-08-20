---
name: openapi-contract-fetcher
description: Fetches standalone REST API endpoint contracts and resolved request/response/error schemas directly from a backend's OpenAPI or Swagger documentation. Use whenever the user indicates their backend has an API/Swagger URL (or hosted documentation) and wants to implement frontend components, API clients, form validations, or error handling against those backend endpoints.
---

# `openapi-contract-fetcher` Skill

Use this skill to extract clean, self-contained REST API endpoint contracts (with all referenced request bodies, response models, DTOs, enums, and error schemas recursively resolved) directly from a backend's OpenAPI/Swagger specification into your context window.

---

## ⚡ CLI Invocation

You can use either the global binary `endp` or `npx endp-docs`:

```bash
# If installed globally:
endp <command> [options]

# Or via npx:
npx endp-docs <command> [options]
```

> 💡 **Self-Discovery:** If you need to inspect available flags or options at any point, run `endp --help` or `endp <command> --help`.

---

## 🛠️ Execution Modes

Choose the appropriate approach based on the user's prompt:

### Mode 1: Targeted Task (Specific Endpoint Given)
When the user asks to implement a specific endpoint (e.g. *"Implement the login page using the `/api/v1/auth/login` endpoint"*):
- Immediately fetch the contract using `--format compact` (`-f compact`):
  ```bash
  # If .endpointdocsrc.json is initialized:
  endp get POST /api/v1/auth/login -f compact

  # Or pass the spec URL directly:
  endp get POST /api/v1/auth/login -f compact --spec <URL>
  ```

---

### Mode 2: Exploratory Task (Broad Feature or Module Given)
When the user asks to implement a broad feature (e.g. *"Build the booking management UI from our backend spec"*):
1. **Find relevant routes with `search`:**
   ```bash
   endp search booking --spec <URL>
   ```
2. **Or list all routes in a specific controller with `list`:**
   ```bash
   endp list --tag booking-controller --spec <URL>
   ```
3. **Fetch the target contracts with `get`:**
   ```bash
   endp get POST /api/v1/bookings -f compact --spec <URL>
   endp get GET /api/v1/bookings/{id} -f compact --spec <URL>
   ```

---

### Mode 3: Initializing Project Config (Optional)
If working across multiple turns on the same frontend project, save the spec URL once into `.endpointdocsrc.json`:
```bash
endp init --spec http://localhost:8080/v3/api-docs
```
Subsequent commands will automatically use this URL without requiring `--spec`.

---

## 📝 Reading the Compact DSL Output

The CLI outputs clean, token-dense DSL blocks that contain all required context for code generation:

### Example Compact Contract:
```text
POST /api/v1/bookings [booking-controller] [auth: bearerAuth (http bearer JWT)]

REQ (application/json): BookTicketRequest

BookTicketRequest {
  journeyId: int64!
  seatIds: array<integer>!
  sourceStationId: int64!
  destinationStationId: int64!
  idempotencyKey: string!
}

RESP 200 (OK) [*/*]: BookingOrderResponse

BookingOrderResponse {
  orderId: int64
  idempotencyKey: string
  totalAmount: number
  status: string
  checkoutUrl: string
  createdAt: date-time
  tickets: array<TicketResponse>
}

TicketResponse {
  ticketId: int64
  journeyId: int64
  trainName: string
  seatNumber: string
  sourceStation: string
  destinationStation: string
  status: enum("PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED")
  fare: number
}

ERRORS [400 Bad Request, 403 Forbidden, 404 Not Found, 409 Conflict]: ApiErrorResponse

ApiErrorResponse {
  timestamp: string (eg: "2026-08-07T14:24:41")
  status: int32 (eg: 404)
  error: string (eg: "Not Found")
  message: string (eg: "Train with ID 123 not found")
}
```

### Parsing Key Tokens:
- **`!` (Exclamation Mark):** Field is **REQUIRED**. Must be required in TypeScript types (`field: type`) and enforced in form validation.
- **No `!`:** Field is **OPTIONAL** (`field?: type`).
- **`enum("A" | "B")`:** Allowed enum values. Generate string union types `'A' | 'B'` and select dropdown options.
- **`array<Type>`:** List of items. Referenced schemas (e.g. `TicketResponse`) are expanded below as standalone structs.
- **`ERRORS [400, 403, 404, ...]: ErrorDTO`:** Consolidates all error status codes sharing the same error payload schema.
- **`[auth: ...]`:** Indicates security requirements (e.g. Bearer JWT tokens in request headers).

---

## 🎯 Code Generation Directives

When generating frontend code from the fetched contract:

1. **TypeScript Interfaces:**
   - Map primitive types: `int32` / `int64` / `integer` / `number` $\rightarrow$ `number`, `string` / `date-time` $\rightarrow$ `string`, `boolean` $\rightarrow$ `boolean`.
   - Preserve required (`!`) vs optional status.
   - Use union literals for `enum(...)`.
2. **API Client Functions:**
   - Include authorization headers if `[auth: ...]` is present.
   - Return typed promises matching the `RESP 200` schema.
3. **Forms & Validation:**
   - Add required validation rules for all fields with `!`.
   - Render `<select>` / radio components for `enum(...)` fields.
4. **Error Handling:**
   - Handle declared error status codes (`400`, `401`, `403`, `404`, `409`, etc.).
   - Extract the error message field from the declared error schema (e.g. `error.response?.data?.message`).

---

## 📚 References

- [Compact DSL Syntax & Type Mapping Table](references/compact-dsl.md)
- [Client & Form Generation Patterns](references/workflow-examples.md)
