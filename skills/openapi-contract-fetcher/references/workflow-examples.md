# Agent Workflow Patterns & Code Generation Guide

This guide provides concrete patterns for AI agents using `endp-docs` contracts to autonomously generate frontend integrations.

---

## Pattern 1: Generating TypeScript Interfaces & API Client Functions

When an endpoint contract is fetched:
```text
POST /api/v1/auth/login [auth-controller]
REQ (application/json): LoginRequest
LoginRequest { email: string!, password: string! }
RESP 200 (OK) [*/*]: AuthResponse
AuthResponse { token: string, email: string, role: string }
ERRORS [400 Bad Request, 401 Unauthorized]: ApiErrorResponse
ApiErrorResponse { status: int32, message: string }
```

### Generated TypeScript & Client Wrapper:
```typescript
// types/auth.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  role: string;
}

export interface ApiErrorResponse {
  status: number;
  message: string;
}

// services/authService.ts
import apiClient from './apiClient';
import { LoginRequest, AuthResponse } from '../types/auth';

export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', data);
  return response.data;
}
```

---

## Pattern 2: Generating UI Forms with Validation

When generating a form from `BookTicketRequest`:
```text
BookTicketRequest {
  journeyId: int64!
  seatIds: array<integer>!
  sourceStationId: int64!
  destinationStationId: int64!
  idempotencyKey: string!
}
```

### Agent Rules for Forms:
1. **Required Fields (`!`):** Add non-empty / required validators (e.g. Zod `.min(1)` or required form HTML attributes).
2. **Numeric Fields (`int64`, `integer`):** Coerce input string values to numbers before submission.
3. **Array Fields (`array<T>`):** Render multi-select chips or dynamic form lists.
4. **Enum Fields (`enum("A" | "B")`):** Populate `<select>` dropdowns or radio groups with exact enum literals.

---

## Pattern 3: Comprehensive Error Handling

When the contract lists:
```text
ERRORS [400 Bad Request, 403 Forbidden, 404 Not Found, 409 Conflict]: ApiErrorResponse
```

### Agent Rules for Error UI:
1. Map status `400` to inline form validation errors if field-level errors exist.
2. Map status `401` / `403` to auth redirect or permission toast.
3. Map status `404` to "Resource Not Found" banner.
4. Map status `409` to "Conflict / Already exists" alert.
5. Extract `error.response?.data?.message` from `ApiErrorResponse` to render human-readable toast notifications.
