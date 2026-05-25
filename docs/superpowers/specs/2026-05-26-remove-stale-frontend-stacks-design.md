# Remove Stale Frontend Stacks — Design

## Goal

Remove all frontend code that references deleted backend stacks (user-location assignment, department CRUD) and wire the admin location filter to the correct endpoint. Department pages become read-only, served by new cache-backed endpoints. The user detail location section is removed entirely.

## Architecture

Three independent surface areas:

1. **Location filter** — swap the broken `/user-locations` calls to the existing `/admin/locations` endpoint already in place from the restructure
2. **Department pages** — add two read-only backend endpoints powered by the employee cache, then gut all write UI from the department frontend
3. **User detail page** — delete the location assignment section

No new entities, no migrations, no new cache keys.

## Tech Stack

ASP.NET Core 8, EF Core (SQL Server), IMemoryCache — backend. React 19 + TypeScript, React Query, ShadCN — frontend.

---

## Section 1: Admin Location Filter

### Backend
No changes needed. `GET /admin/locations` already exists (`LocationController`) and returns `Location[]` with `id`, `name`, `isActive`, `allowWeekendDateNeeded`.

### Frontend

**`NAFClient/src/features/admin/api.ts`**
- Remove: `getLocations`, `assignLocation`, `removeLocation` (all called `/user-locations`)
- Already has: `getAdminLocations()` → `/admin/locations` — this becomes the single source

**`NAFClient/src/features/admin/hooks/useAdminLocations.ts`**
- Remove: `assignLocationMutation`, `removeLocationMutation`
- Keep: locations query, but switch `queryFn` from `adminApi.getLocations` to `adminApi.getAdminLocations`
- Return type changes from `LocationDTO[]` to `Location[]` (has `allowWeekendDateNeeded`)

**`NAFClient/src/features/admin/hooks/useAdminAllUsers.ts`**
- Switch `queryFn` from `adminApi.getLocations` to `adminApi.getAdminLocations`

**`NAFClient/src/features/admin/pages/AdminHomePage.tsx`** and **`AdminNAFListPage.tsx`**
- No structural change — they call `useAdminLocations()` which now returns the right data
- Check that the location objects' shape is consumed correctly (`location.id`, `location.name`)

---

## Section 2: Department Pages → Read-Only

### Backend

**`NAFServer/src/Domain/Interface/Repository/IEmployeeRepository.cs`**
Add one method:
```csharp
Task<List<DepartmentView>> GetAllDepartmentsAsync();
```

**`NAFServer/src/Infrastructure/Persistence/Repositories/EmployeeRepository.cs`**
Implement:
```csharp
public async Task<List<DepartmentView>> GetAllDepartmentsAsync()
{
    return await GetAllDeptsAsync();
}
```
`GetAllDeptsAsync()` is already private — this just exposes it publicly.

**New: `NAFServer/src/API/Controllers/DepartmentsController.cs`**
Route: `api/admin/departments`, `[Authorize(Roles = "ADMIN")]`

- `GET /` — returns all departments via `_employeeRepository.GetAllDepartmentsAsync()`
- `GET /{departmentId}/employees` — returns employees via `_employeeRepository.GetByDepartmentAsync(departmentId)`

DTOs used: existing `DepartmentView` entity fields (`Id`, `DepartmentDesc`, `DepartmentHead`) mapped to a response DTO, and existing `EmployeeDTO` for employees.

### Frontend

**`NAFClient/src/features/admin/departments/api.ts`**
- Remove: `create`, `changeHead`, `setInactive`, `addEmployee`, `removeEmployee`
- Keep: `getAll` → `GET /admin/departments`, `getById` → `GET /admin/departments/{id}`, `getEmployees` → `GET /admin/departments/{id}/employees`
- Update endpoint base from whatever it was to `/admin/departments`

**`NAFClient/src/features/admin/departments/hooks/useDepartments.ts`**
- Remove: `useDepartmentMutations` export entirely
- Keep: `useDepartments()`, `useDepartmentDetail(id)`

**`NAFClient/src/features/admin/departments/hooks/useDepartmentEmployees.ts`**
- Remove: `useDepartmentEmployeeMutations` export entirely
- Keep: `useDepartmentEmployees(departmentId)`

**`NAFClient/src/features/admin/departments/pages/DepartmentListPage.tsx`**
- Remove: `AddDepartmentDialog` import, usage, and the "Add" button
- Keep: the department table/list as-is

**`NAFClient/src/features/admin/departments/pages/DepartmentDetailPage.tsx`**
- Remove: `ChangeDepartmentHeadDialog` import and usage
- Remove: set-inactive button and its handler
- Remove: add-employee control and its handler
- Keep: department info display, `DepartmentEmployeeTable` (read-only)

**`NAFClient/src/features/admin/departments/components/DepartmentEmployeeTable.tsx`**
- Remove: remove-employee button column, confirmation dialog, `removeMutation` usage

**Delete entirely:**
- `NAFClient/src/features/admin/departments/components/AddDepartmentDialog.tsx`
- `NAFClient/src/features/admin/departments/components/ChangeDepartmentHeadDialog.tsx`
- `NAFClient/src/features/admin/departments/components/AddDepartmentEmployeeDialog.tsx`

---

## Section 3: User Detail Page — Remove Location Section

**`NAFClient/src/features/admin/pages/UserDetailPage.tsx`**
- Remove: `useAdminLocations` import
- Remove: `assignLocationMutation`, `removeLocationMutation` destructuring
- Remove: `handleChangeLocation` function
- Remove: the entire location section from JSX (current location display, edit mode selector, Assign/Change button)
- Keep: role management section, user info display, everything else

---

## Out of Scope

- `DepartmentView` backend entity is unchanged
- Admin navigation sidebar link to `/admin/departments` stays (page still exists, just read-only)
- Route definitions in `router.tsx` and `routesEnum.ts` are unchanged
- No changes to `ResourceAllowanceManager` location weekend toggle (uses `getAdminLocations` already)
