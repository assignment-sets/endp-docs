# Compact DSL Specification & Parsing Reference

The `--format compact` output format is designed for AI coding agents to minimize token consumption while preserving 100% of the types, validations, and schema relationships.

---

## 1. Syntax Rules

### Header Line
```text
<METHOD> <PATH> [<TAG>] [auth: <SCHEME_NAME> (<SCHEME_TYPE> <DETAILS>)]
```
- **Method & Path:** e.g. `POST /api/v1/auth/login`
- **Tag:** Controller or grouping name, e.g. `[auth-controller]`
- **Auth (if required):** e.g. `[auth: bearerAuth (http bearer JWT)]`

---

### Request Body (`REQ`)
```text
REQ (<CONTENT_TYPE>): <SCHEMA_NAME>

<SCHEMA_NAME> {
  <FIELD_NAME>: <TYPE>[!] [enum(...)] [(eg: <EXAMPLE>)]
}
```
- `!` indicates a **required** property.
- `array<Type>` denotes list/array fields.
- `enum("A" | "B")` denotes allowed enum values.

**Example:**
```text
REQ (application/json): BookTicketRequest

BookTicketRequest {
  journeyId: int64!
  seatIds: array<integer>!
  sourceStationId: int64!
  destinationStationId: int64!
  idempotencyKey: string!
}
```

---

### Success Responses (`RESP`)
```text
RESP <STATUS_CODE> (<STATUS_TEXT>) [<CONTENT_TYPE>]: <SCHEMA_NAME>

<SCHEMA_NAME> {
  <FIELD_NAME>: <TYPE>
}
```
- Nested DTO schemas referenced inside arrays or objects are expanded as standalone blocks.

**Example:**
```text
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
```

---

### Error Responses (`ERRORS`)
Multiple HTTP error status codes sharing the same error payload schema are consolidated into a single block to eliminate repetition:

```text
ERRORS [<CODE_1> <TEXT_1>, <CODE_2> <TEXT_2>, ...]: <ERROR_SCHEMA_NAME>

<ERROR_SCHEMA_NAME> {
  <FIELD_NAME>: <TYPE> [(eg: <EXAMPLE>)]
}
```

**Example:**
```text
ERRORS [400 Bad Request, 403 Forbidden, 404 Not Found, 409 Conflict]: ApiErrorResponse

ApiErrorResponse {
  timestamp: string (eg: "2026-08-07T14:24:41")
  status: int32 (eg: 404)
  error: string (eg: "Not Found")
  message: string (eg: "Train with ID 123 not found")
}
```

---

## 2. Type Mapping Table (DSL to TypeScript)

| DSL Type | TypeScript Equivalent | Validation Hint |
| :--- | :--- | :--- |
| `string` | `string` | Text input |
| `string (date-time)` / `date-time` | `string` / `Date` | ISO 8601 date string |
| `int32` / `int64` / `integer` | `number` | Integer number |
| `number` / `float` / `double` | `number` | Floating point number |
| `boolean` | `boolean` | Checkbox / toggle switch |
| `array<T>` | `T[]` | List / table |
| `enum("A" \| "B")` | `'A' \| 'B'` | Select dropdown / radio group |
| `fieldName!` | `fieldName: T` | Required in form validation |
| `fieldName` (no `!`) | `fieldName?: T` | Optional in form validation |
