# Create NAF Dialog (Admin) + HR Role Design

## Goal

Add a "Create NAF" dialog to the Admin NAF list page, and introduce a new HR frontend role with a Create NAF page and a read-only NAF history list.

## Architecture

Two independent additions:

1. **Admin NAF list page** — one-line change: add a "Create NAF" button that opens the existing `CreateNAFDialog` as a modal.
2. **HR feature module** — new backend endpoint + new frontend module (`features/hr/`) with its own layout, two pages, one hook, and types/api files.

## Backend

**New controller:** `HRController` at `NAFServer/src/API/Controllers/HRController.cs`
- Decorated with `[Authorize(Roles = "HR")]`
- Single endpoint: `GET /api/hr/nafs?page=` (page defaults to 1)

**New DTO:** `HRNafDTO` at `NAFServer/src/Application/DTOs/HR/HRNafDTO.cs`
- Fields: `string NafId`, `string EmployeeName`, `string Department`, `DateTime DateCreated`

**Query logic (in controller or thin HRService):**
- Fetch all NAFs ordered by `CreatedAt` descending, paginated at 50/page using `PagedResult<T>`
- For each NAF, resolve employee name and department via `EmployeeRepository.GetEmployeeDetailsAsync(naf.RequestorId)` (cached 4 hours — no performance concern)
- Return `PagedResult<HRNafDTO>`

**No new repository methods needed** — `GetEmployeeDetailsAsync` already exists and is cached.

## Frontend

### New files

```
NAFClient/src/features/hr/
  types.ts                        — HRNafDTO interface
  api.ts                          — getHRNafs(page: number) axios call
  hooks/useHRNafs.ts              — React Query hook with page param
  components/HRLayout.tsx         — sidebar layout, nav: Create NAF + NAF History
  pages/HRCreateNAFPage.tsx       — inline Create NAF form (same fields as CreateNAFDialog)
  pages/HRNAFHistoryPage.tsx      — DataTable + TablePagination, 50/page
```

### Modified files

- `NAFClient/src/app/routesEnum.ts` — add `HR = "/hr"`, `HR_CREATE = "/hr/create"`
- `NAFClient/src/app/router.tsx` — add lazy routes for both HR pages, wrapped in `ProtectedRoute requiredRole="HR"`
- `NAFClient/src/app/ProtectedRoute.tsx` — add `HR: "/hr"` to `ROLE_HOME` map
- `NAFClient/src/features/admin/pages/AdminNAFListPage.tsx` — add "Create NAF" button + `CreateNAFDialog` modal

### HR pages

**HRCreateNAFPage** — full-page form with the same three fields as `CreateNAFDialog` (employee search, hardware select, date needed). On successful submit, navigates to `/hr`. Uses the existing `createNAFAsync` mutation from `useNAF`.

**HRNAFHistoryPage** — DataTable with columns: Employee Name, Department, Date Created (formatted). `TablePagination` at bottom. Default page 1, 50 entries per page.

### HRLayout

Sidebar nav items:
1. Create NAF — `/hr/create`
2. NAF History — `/hr`

Mirrors `AdminLayout` pattern.

## Data Flow

```
HRNAFHistoryPage
  → useHRNafs(page)
  → getHRNafs(page) [axios GET /api/hr/nafs?page=N]
  → HRController.GetNafs
  → NAFRepository (paginated) + EmployeeRepository (cached lookup per NAF)
  → PagedResult<HRNafDTO>
```

## What Is Not Built

- HR cannot view NAF details — no detail route for HR
- HR cannot approve, reject, or act on any resource request
- No server-side employee name search on the history list (display only)
