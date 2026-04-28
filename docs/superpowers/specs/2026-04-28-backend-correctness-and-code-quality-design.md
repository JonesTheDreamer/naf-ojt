# NAF System — Backend Correctness & Code Quality Design

**Date:** 2026-04-28
**Scope:** Production-readiness hardening before launch
**Excluded:** Authentication (being replaced separately)

---

## Context

The NAF (Network Access Form) system is a full-stack application managing employee network access requests, approvals, and tracking. It is pre-launch and has not yet been deployed to production. A codebase audit identified two priority areas:

- **A — Backend correctness:** authorization gaps, inconsistent error handling, missing input validation
- **C — Code quality:** dead code, console statements, duplicated logic, magic values

---

## Approach

Fix correctness issues first (Phase 1), then code quality (Phase 2). Each phase is reviewed as a separate diff to keep risk contained and make correctness fixes easier to verify in isolation.

---

## Phase 1: Backend Correctness

### 1. Authorization

#### Re-enable `[Authorize]` on `RequestsController`

`[Authorize]` is currently commented out on `RequestsController`, leaving all resource request mutations (create, delete, cancel, approve) fully unauthenticated. Uncomment the attribute.

#### Department-scoped NAF access

**Access rules** — a user may access a NAF if any of the following are true:

| Rule | Condition |
|---|---|
| Own NAF | `NAF.RequestorId == currentUserId` |
| Same department | `NAF.DepartmentId == currentUserDepartmentId` |
| Assigned approver | User is an approver on any step in that NAF |
| Admin + same location | User has `ADMIN` role AND NAF requestor's location matches admin's location |

**Implementation — `ICurrentUserService` extensions**

Add three new members to `ICurrentUserService` and implement in `CurrentUserService`:

- `string Role` — read from `ClaimTypes.Role` JWT claim (no DB call)
- `Task<string> GetDepartmentIdAsync()` — fetch via `EmployeeRepository.GetByIdAsync(EmployeeId)`, cache 4 hours (matches existing employee cache TTL)
- `Task<int> GetLocationIdAsync()` — fetch via `UserLocationRepository.GetUserActiveLocation(userId)`, cache 4 hours

**Implementation — `NAFService.AuthorizeNAFAccessAsync(Guid nafId)`**

A private async method that:
1. Loads the NAF (or uses the already-loaded instance)
2. Evaluates rules 1–3 against `ICurrentUserService`
3. For rule 4: only queries `EmployeeRepository.GetByIdAsync(naf.RequestorId)` when the current user is `ADMIN` (avoids unnecessary lookup for non-admins)
4. Throws `UnauthorizedAccessException` if no rule passes

Called by `NAFsController.Get(Guid id)` — the sole endpoint that returns a single NAF by ID.

---

### 2. Error Handling

#### Global exception middleware

Register a single `ExceptionHandlingMiddleware` in `Program.cs` at the start of the request pipeline (before all other middleware, including `UseCors`) that catches unhandled exceptions and maps them to HTTP responses:

| Exception Type | HTTP Status | Response Body |
|---|---|---|
| `KeyNotFoundException` | 404 Not Found | `{ "error": message }` |
| `ArgumentException` | 400 Bad Request | `{ "error": message }` |
| `ApplicationException` | 400 Bad Request | `{ "error": message }` |
| `DomainException` | 400 Bad Request | `{ "error": message }` |
| `UnauthorizedAccessException` | 403 Forbidden | `{ "error": "Access denied." }` |
| All others | 500 Internal Server Error | `{ "error": "An unexpected error occurred." }` (message hidden) |

With this in place, all try-catch-rethrow blocks in controllers are removed. Services continue throwing typed exceptions; the middleware handles translation.

#### DTO input validation

Add data annotations to key inbound DTOs. ASP.NET Core model binding returns 400 automatically before controllers run:

- `LoginRequestDTO` — `[Required]` on `EmployeeId`
- `CreateResourceRequestDTO` — `[Required]` on `purpose`, `[Range(1, int.MaxValue)]` on `resourceId`
- `EditPurposeDTO` — `[Required]`, `[MinLength(1)]` on `purpose`

#### Remove `NotImplementedException`

`NAFService.GetNAFByLocationAsync` throws `NotImplementedException`. Remove it from both `INAFService` and `NAFService`. If no controller calls it, remove any dead wiring.

---

### 3. Pagination Validation

Add `[Range(1, int.MaxValue)]` to all `page` parameters across `NAFsController` and `AdminController`. Invalid values return 400 before hitting the service.

**Page size constant**

Extract the hardcoded `6` into `PaginationConstants.PageSize = 6` on the backend. Reference this constant in `NAFRepository` (currently appears twice). The frontend already uses `6` in `ViewAllNAF.tsx` — document it as a named constant `PAGE_SIZE = 6` in a shared `queryConstants.ts` file.

---

## Phase 2: Code Quality

No behavior changes in this phase. Each fix is purely cleanup.

### Backend

| Issue | Location | Fix |
|---|---|---|
| Commented-out routes | `NAFsController.cs`, `EmployeesController.cs` | Delete |
| Commented case blocks | `ResourceRequestService.cs` | Delete |
| Unused `INAFRepository` dependency | `EmployeeService` constructor | Remove parameter and backing field |
| Hard-coded resource name strings | `NAFService._withHardwareAutoAddNames` | Move to `appsettings.json` as `HardwareAutoAddResourceIds` (array of `int` IDs, not names) |
| Duplicated NAF query logic | `NAFRepository` — two nearly identical methods | Extract shared include/pagination logic into a private `BuildNAFQuery(IQueryable<NAF> query, int page)` helper; both methods call it with a predicate |

### Frontend

**Console statements (13 occurrences)**

All `console.log` and `console.error` calls removed from:
- `ViewNAFDetail.tsx` (lines 72, 79)
- `ResourceRequestList.tsx` (lines 51, 63, 71, 89, 101, 109, 134, 185, 187)
- `AdminNAFDetailPage.tsx` (line 42)
- `AuthContext.tsx` (line 30)

The `handleRemind` and `handleDeactivate` stubs in `ResourceRequestList.tsx` that only contain `console.log("TODO ...")` have their bodies replaced with `toast.error("This feature is not yet available.")` — the UI controls that call them are kept since both are real planned features.

**`as unknown as Progress` type casting (5+ files)**

Root cause: API returns `progress` as `number` at runtime but TypeScript interfaces type it as the `Progress` enum. Fix at the API boundary — a `toProgress(n: number): Progress` transform utility applied inside React Query fetch functions. All downstream `as unknown as Progress` / `as unknown as ProgressStatus` casts are removed.

**Duplicated progress label/color logic**

`nafProgressLabel()` and `nafProgressColor()` exist in both `ViewNAFDetail.tsx` and `AdminNAFDetailPage.tsx` with slightly different implementations (admin version missing the "For Screening" case). Both replaced by the existing `PROGRESS_CONFIG` from `progressBadge.tsx`.

**Magic stale times**

`1000 * 60 * 5` and `1000 * 60 * 10` repeated across hooks and components. Extracted to:

```ts
// src/shared/constants/queryConstants.ts
export const STALE_TIME = {
  MEDIUM: 1000 * 60 * 5,   // 5 min
  LONG:   1000 * 60 * 10,  // 10 min
} as const;

export const PAGE_SIZE = 6;
```

**Magic numbers in `AdditionalInfoBlock`**

`if (info.type === 0) / (1) / (2)` restructured into a `switch (info.type)` statement. The discriminant literal types already present on the union (`InternetRequestInfo.type: 0`, `SharedFolderInfo.type: 1`, `GroupEmailInfo.type: 2`) provide TypeScript narrowing automatically — no new enum needed.

**Query invalidation duplication**

`useResourceRequest.ts` repeats the same 3 `queryClient.invalidateQueries` calls across 5 mutations. Extracted to a single `invalidateNAFQueries(nafId: string)` helper function within the file.

**Commented-out import**

`// import { queryClient }` in `useNAF.ts` removed.

---

## Out of Scope

- Authentication (being replaced by proper auth setup)
- UX/feature gaps (separate initiative)
- Rate limiting, CSRF, JWT audience validation (tied to auth replacement)
- Bulk operations, notifications, search/filter (feature work)
