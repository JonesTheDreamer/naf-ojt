# Admin NAF Pages Design

**Date:** 2026-04-27
**Scope:** Two new admin pages — NAF List and Implementation — plus supporting backend endpoint, hooks, and navigation.

---

## Overview

Admins currently have no view into NAFs or implementation tasks scoped to their location. This adds two pages to the admin area:

1. **NAF List** (`/admin/NAF`) — browse all NAFs at the admin's location, filtered by status
2. **Implementation** (`/admin/for-implementations`) — flat table of NAFs with implementation-ready resource requests; admin manages status transitions per request

Both pages follow the same visual pattern as the requestor/approver NAF pages but are read-only or action-limited to admin-specific operations.

---

## Approach

Separate admin pages sharing low-level primitives (`DataTable`, `TablePagination`, `NAFDetailHeader`, resource badge logic). No modifications to existing requestor components. Admin pages consume the same API endpoints where possible; one new backend endpoint is added.

---

## Backend

### New endpoint

```
GET /api/admin/nafs?locationId={id}&status={filter}&page={n}
```

- Controller: `AdminController` (already `[Authorize(Roles = "ADMIN")]`)
- `status` values: `all | open | in_progress | accomplished`
- `all` returns OPEN + IN_PROGRESS + ACCOMPLISHED combined
- Always excludes REJECTED, IMPLEMENTATION, NOT_ACCOMPLISHED
- Page size: 20 (fixed)
- Returns: `PagedResult<NAF>` (same shape as existing NAF queries)

**New service method:** `INAFService.GetNAFsByLocationAsync(int locationId, string status, int page)` implemented in `NAFService`.

### Existing endpoints reused

| Endpoint | Used by |
|---|---|
| `GET /nafs/{id}` | Both detail pages |
| `GET /implementations/for-implementations` | Implementation table |
| `PATCH /implementations/{id}/in-progress` | Implementation detail actions |
| `PATCH /implementations/{id}/delayed` | Implementation detail actions |
| `PATCH /implementations/{id}/accomplished` | Implementation detail actions |

The `for-implementations` endpoint does **not** scope by location — it returns all NAFs globally. A `locationId` query param must be added to the endpoint, service interface, and repository query (`WHERE n.LocationId = locationId`).

---

## Frontend

### New files

| File | Purpose |
|---|---|
| `features/admin/pages/AdminNAFListPage.tsx` | NAF list page |
| `features/admin/pages/AdminNAFDetailPage.tsx` | Read-only NAF detail |
| `features/admin/pages/AdminImplementationDetailPage.tsx` | Implementation detail with actions |
| `features/admin/hooks/useAdminNAFs.ts` | React Query hook for admin NAF list |
| `features/admin/components/adminNafColumns.tsx` | Column defs for NAF list table |
| `features/admin/components/AdminResourceRequestList.tsx` | Read-only resource request accordion |
| `features/admin/components/implementationColumns.tsx` | Column defs for implementation table |
| `features/admin/components/ImplementationResourceRequestList.tsx` | List of implementation requests with actions |
| `features/admin/components/ImplementationResourceRequestItem.tsx` | Single implementation request accordion item |

### Modified files

| File | Change |
|---|---|
| `features/admin/pages/ForImplementationsPage.tsx` | Replace accordion views with flat table |
| `features/admin/hooks/useForImplementations.ts` | Add `setToInProgress`, `setToDelayed`, `setToAccomplished` mutations; verify location scoping |
| `features/admin/api.ts` | Add `getAdminNAFs(locationId, status, page)` |
| `shared/components/layout/AdminLayout.tsx` | Add NAFs and Implementations nav items |
| `app/router.tsx` | Fix ADMIN_NAF route; add three new routes |
| `app/routesEnum.ts` | Add `ADMIN_NAF_DETAIL`, `ADMIN_IMPLEMENTATION_DETAIL` |

### Deleted files

| File | Reason |
|---|---|
| `features/admin/components/ImplementationViewToggle.tsx` | Toggle view replaced by flat table |
| `features/admin/components/ImplementationNAFAccordion.tsx` | Replaced by flat table |
| `features/admin/components/ImplementationResourceAccordion.tsx` | Replaced by flat table |
| `features/admin/components/ImplementationResourceRequestRow.tsx` | Replaced by new item component |

---

## Page Designs

### NAF List Page (`/admin/NAF`)

- **Layout:** `AdminLayout`
- **Header:** "Network Access Requests"
- **Filter:** Status tabs — `All | Open | In Progress | Accomplished`. Switching tabs resets to page 1.
- **Table columns:** Employee (name + position + location) | Reference | Requests (pill badges, max 1 visible + overflow) | Status badge
- **Pagination:** Server-driven, page size 20
- **Row click:** Navigate to `/admin/NAF/:nafId`
- **Hook:** `useAdminNAFs(locationId, status, page)` → `{ nafQuery: UseQueryResult<PagedResult<NAF>> }`
- **API call:** `adminApi.getAdminNAFs(locationId, status, page)`

### Admin NAF Detail Page (`/admin/NAF/:nafId`)

- **Layout:** `AdminLayout`
- **Back button:** Returns to `/admin/NAF`
- **Header:** `NAFDetailHeader` component (employee info, reference, submitted date) — read-only, no deactivate button
- **Body:** `AdminResourceRequestList` — all resource requests as read-only accordion items
  - Collapsed: resource name + progress badge
  - Expanded: approval steps (approver name, status, date), additional info (URL / shared folder / group email)
  - No mutations — zero approve/reject/add/cancel actions
- **Data:** `nafApi.getNAF(id)` (existing)

### Implementation Page (`/admin/for-implementations`)

- **Layout:** `AdminLayout`
- **Header:** "For Implementation"
- **Table columns:**

  | Column | Detail |
  |---|---|
  | Employee | Full name + department |
  | Requests | Pill badges — first 1 visible, `+N more` for overflow. Only counts IMPLEMENTATION-progress requests |
  | Date Needed | Closest `dateNeeded` across IMPLEMENTATION requests, formatted as date |

- **Sort:** Ascending by Date Needed (most urgent first) — client-side
- **Row click:** Navigate to `/admin/for-implementations/:nafId`
- **Data:** `adminApi.getForImplementations()` (existing, returns `NAF[]`)

### Implementation Detail Page (`/admin/for-implementations/:nafId`)

- **Layout:** `AdminLayout`
- **Back button:** Returns to `/admin/for-implementations`
- **Header:** `NAFDetailHeader` — read-only
- **Body:** `ImplementationResourceRequestList` — shows **only** requests where `progress === Progress.IMPLEMENTATION`
- **Each `ImplementationResourceRequestItem`:**
  - Collapsed: resource name + implementation status badge
  - Expanded: additional info, date needed, action buttons
  - **Actions by status:**

    | Status | Available actions |
    |---|---|
    | `OPEN` | Accept (→ `setToInProgress`) |
    | `IN_PROGRESS` | Mark Accomplished, Mark Delayed |
    | `DELAYED` | Back to In Progress, Mark Accomplished; shows delay reason as read-only |
    | `ACCOMPLISHED` | No actions; shows accomplished date |

  - "Mark Delayed" opens `DelayedReasonModal` to collect reason string before calling `setToDelayed`
- **Mutations in `useForImplementations`:** `setToInProgressMutation`, `setToDelayedMutation`, `setToAccomplishedMutation` — all invalidate `["for-implementations"]` on success

---

## Routing

```
/admin/NAF                       AdminNAFListPage         (fix: was ForImplementationsPage)
/admin/NAF/:nafId                AdminNAFDetailPage        (new)
/admin/for-implementations       ForImplementationsPage    (content replaced)
/admin/for-implementations/:nafId AdminImplementationDetailPage (new)
```

All routes: `ProtectedRoute` with `requiredRole="ADMIN"`.

### Navigation (AdminLayout sidebar)

```
Home              /admin
NAFs              /admin/NAF          (FileText icon)
Implementations   /admin/for-implementations  (Wrench icon)
Roles             /admin/roles
Locations         /admin/locations
```
