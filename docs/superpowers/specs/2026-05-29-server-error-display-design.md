# Server Error Display — Design Spec

**Date:** 2026-05-29
**Status:** Approved

---

## Problem

The backend's `ExceptionHandlingMiddleware` already returns meaningful error messages in the shape `{ error: "..." }` for all 400/404/403/500 responses. Every mutation on the frontend ignores this and shows a hardcoded generic string (e.g. `toast.error("Failed to change resource")`). Users see no actionable information when something goes wrong.

The only exception is `useAddResource.ts`, which already extracts and displays the server message correctly.

---

## Goal

Display the server's actual error message in the Sonner toast for every mutation, without requiring each developer to remember error-extraction boilerplate when writing new mutations.

---

## Approach: Axios Interceptor + MutationCache Global Handler

Two coordinated changes:

1. **Axios interceptor** normalizes all HTTP errors into a typed `ApiError` before they reach React Query.
2. **`MutationCache` global `onError`** fires a toast for every rejected mutation centrally.

Individual mutations no longer need `onError` for basic error display.

---

## Architecture

### 1. `ApiError` class

**File:** `NAFClient/src/shared/lib/apiError.ts`

```ts
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
```

- `message` — extracted from `response.data.error`, then `response.data.message`, then `response.statusText`, then `"Something went wrong."`
- `status` — HTTP status code; available for conditional handling (e.g. suppress 401 toasts on auth checks)

---

### 2. Axios response interceptor

**File:** `NAFClient/src/shared/api/client.ts`

Added to the existing axios instance:

```ts
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const data = error.response?.data as Record<string, string> | undefined;
    const message =
      data?.error ??
      data?.message ??
      error.response?.statusText ??
      "Something went wrong.";
    const status = error.response?.status ?? 0;
    return Promise.reject(new ApiError(message, status));
  },
);
```

After this, every failed API call rejects with an `ApiError`. No raw `AxiosError` reaches a hook or component.

**Auth context note:** `AuthContext.tsx` silently catches auth check failures — this stays untouched since it intentionally suppresses errors.

---

### 3. `MutationCache` global `onError`

**File:** `NAFClient/src/app/queryClient.ts`

```ts
import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib/apiError";

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong.";
      toast.error(message);
    },
  }),
});
```

This fires automatically for every mutation that rejects. No per-mutation `onError` is needed for error display.

---

### 4. Cleanup of existing mutations

Remove all `onError: () => toast.error("Failed to X")` callbacks from:

- `NAFClient/src/features/naf/hooks/useResourceRequest.ts` (~8 callbacks)
- `NAFClient/src/features/naf/hooks/useNAF.ts`
- `NAFClient/src/features/admin/hooks/useAdminUsers.ts`
- Any other hooks following the same pattern

`useAddResource.ts` is left unchanged — it collects errors internally and never rejects the mutation, so the global handler never fires for it.

---

## Data Flow

```
Mutation fires
  → API call via axios
    → Server returns 4xx/5xx with { error: "..." }
      → Axios interceptor catches AxiosError
        → Creates ApiError(message, status)
          → Promise.reject(apiError)
            → React Query receives rejection
              → MutationCache.onError fires
                → toast.error(apiError.message)
```

---

## Error Message Fallback Chain

| Source | Example |
|--------|---------|
| `response.data.error` | `"Duplicate resource request for NAF #1234"` |
| `response.data.message` | `"Validation failed"` |
| `response.statusText` | `"Bad Request"` |
| Hardcoded fallback | `"Something went wrong."` |

---

## What Does Not Change

- `useAddResource.ts` — custom partial-success logic, never rejects
- `AuthContext.tsx` — intentional silent error suppression
- `onSuccess` callbacks — untouched
- Backend — no changes needed; it already returns `{ error: "..." }`

---

## Files Changed

| File | Change |
|------|--------|
| `src/shared/lib/apiError.ts` | New file |
| `src/shared/api/client.ts` | Add response interceptor |
| `src/app/queryClient.ts` | Add `MutationCache` with global `onError` |
| `src/features/naf/hooks/useResourceRequest.ts` | Remove `onError` callbacks |
| `src/features/naf/hooks/useNAF.ts` | Remove `onError` callbacks |
| `src/features/admin/hooks/useAdminUsers.ts` | Remove `onError` callbacks |
| Other hook files | Remove `onError` callbacks as applicable |
