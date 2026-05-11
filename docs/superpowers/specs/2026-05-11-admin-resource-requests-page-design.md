# Admin Resource Requests Page — Design Spec

**Date:** 2026-05-11
**Status:** Approved

## Overview

Replace the "Implementations" tab in the admin sidebar with a "Resource Requests" tab. The new page shows a flat, paginated list of all resource requests across all NAFs (scoped to the admin's location), filterable by `Progress` status. Clicking a row navigates to the existing admin NAF detail page for that employee's NAF.

---

## Backend

### New DTO

**`AdminResourceRequestDTO`** (C#, in `Application/DTOs/Admin/`)

| Field | Type | Notes |
|---|---|---|
| `Id` | `Guid` | Resource request ID |
| `NafId` | `Guid` | Parent NAF ID |
| `NafReference` | `string` | NAF reference number |
| `EmployeeName` | `string` | Full name from `NAF.Employee` |
| `ResourceName` | `string` | From `ResourceRequest.Resource.Name` |
| `Progress` | `Progress` (enum) | Resource request progress |
| `DateNeeded` | `DateTime?` | Optional |
| `CreatedAt` | `DateTime` | |

### New Endpoint

```
GET /api/admin/resource-requests?locationId={int}&progress={string}&page={int}
```

- **Controller:** `AdminController.cs`
- **Authorization:** `[Authorize(Roles = "ADMIN")]` (already on controller)
- **Query params:**
  - `locationId` (required) — filters to NAFs in that location
  - `progress` — `"all"` or one of the `Progress` enum value names (`"OPEN"`, `"IN_PROGRESS"`, `"FOR_SCREENING"`, `"IMPLEMENTATION"`, `"ACCOMPLISHED"`, `"REJECTED"`, `"NOT_ACCOMPLISHED"`, `"CANCELLED"`). Defaults to `"all"`.
  - `page` — 1-based, default 1
- **Page size:** 10
- **Returns:** `PagedResult<AdminResourceRequestDTO>`
- **Service method:** Added to `INAFService` / `NAFService` as `GetResourceRequestsByLocationPagedAsync(int locationId, string progress, int page)`

---

## Frontend

### Removed

- `ForImplementationsPage.tsx` (page) — deleted
- `AdminImplementationDetailPage.tsx` (page) — deleted
- `useForImplementations.ts` (hook) — deleted
- `implementationColumns.tsx` (component) — deleted
- Routes: `ADMIN_FOR_IMPLEMENTATIONS`, `ADMIN_IMPLEMENTATION_DETAIL` removed from `routesEnum.ts` and `router.tsx`

### Route & Sidebar

**`routesEnum.ts`** — add:
```ts
ADMIN_RESOURCE_REQUESTS = "/admin/resource-requests"
```

**`AdminLayout.tsx`** — replace nav item:
```ts
// Before
{ label: "Implementations", icon: <Wrench />, href: "/admin/for-implementations" }
// After
{ label: "Resource Requests", icon: <ClipboardList />, href: "/admin/resource-requests" }
```

**`router.tsx`** — add route, remove for-implementations routes:
```tsx
<Route
  path={RoutesEnum.ADMIN_RESOURCE_REQUESTS}
  element={
    <ProtectedRoute requiredRole="ADMIN">
      <AdminResourceRequestsPage />
    </ProtectedRoute>
  }
/>
```

### New Type

**`AdminResourceRequestDTO`** added to `features/admin/types.ts`:
```ts
export interface AdminResourceRequestDTO {
  id: string;
  nafId: string;
  nafReference: string;
  employeeName: string;
  resourceName: string;
  progress: Progress;
  dateNeeded?: string;
  createdAt: string;
}
```

### New API Method

Added to `features/admin/api.ts`:
```ts
getAdminResourceRequests: (locationId: number, progress: string, page: number) =>
  api
    .get<PagedResult<AdminResourceRequestDTO>>("/admin/resource-requests", {
      params: { locationId, progress, page },
    })
    .then((r) => r.data),
```

### New Hook

**`useAdminResourceRequests.ts`** in `features/admin/hooks/`:
```ts
export function useAdminResourceRequests(
  locationId: number | null,
  progress: string,
  page: number
) {
  const query = useQuery({
    queryKey: ["admin", "resource-requests", locationId, progress, page],
    queryFn: () => adminApi.getAdminResourceRequests(locationId!, progress, page),
    enabled: locationId != null,
  });
  return { query };
}
```

### New Page

**`AdminResourceRequestsPage.tsx`** in `features/admin/pages/`:

- **Progress tab bar** — 9 tabs: All | Open | In Progress | For Screening | Implementation | Accomplished | Rejected | Not Accomplished | Cancelled. Active tab styled with `bg-amber-500 text-white` (same as `AdminNAFListPage`). Switching tab resets `page` to 1.
- **Table columns:**

| Column | Source |
|---|---|
| Employee | `employeeName` |
| Resource | `resourceName` |
| Progress | `progress` — rendered as a `ProgressBadge` |
| Date Needed | `dateNeeded` formatted, `—` if null |
| NAF Reference | `nafReference` |

- **Row click** — `navigate(/admin/NAF/${row.nafId})`
- **Pagination** — `TablePagination` component (already used in `AdminNAFListPage`), driven by `PagedResult` metadata

---

## Data Flow

```
AdminResourceRequestsPage
  → useAdminResourceRequests(locationId, progress, page)
    → adminApi.getAdminResourceRequests(...)
      → GET /api/admin/resource-requests
        → NAFService.GetResourceRequestsByLocationPagedAsync(...)
          → EF Core: ResourceRequests
              JOIN NAF (filter by locationId via NAF.DepartmentId → location)
              JOIN Resource (for ResourceName)
              WHERE progress == filter (if not "all")
              ORDER BY createdAt DESC
              OFFSET/FETCH for pagination
          → For each result, EmployeeName resolved via
            EmployeeRepository.GetEmployeeDetailsAsync(naf.RequestorId)
            (4-hour cached, same pattern used throughout the codebase)
```

---

## What Is Not Changing

- `AdminNAFDetailPage` — unchanged; this is where row clicks land
- `AdminResourceRequestList` component inside the detail page — unchanged
- All implementation mutation logic (accept, set in progress, delayed, accomplished) — unchanged, they live inside the detail page
