# Remove Stale Frontend Stacks — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all frontend and backend code that references the deleted user-location and department-CRUD stacks, wire the admin location filter to the correct `/admin/locations` endpoint, and make department pages read-only backed by new cache-only endpoints.

**Architecture:** Three independent changes in dependency order — (1) new read-only backend department endpoints, (2) frontend types/API/hooks slimmed to match, (3) location filter and user detail page fixed. No migrations, no new entities.

**Tech Stack:** ASP.NET Core 8, IMemoryCache, React 19 + TypeScript, React Query, ShadCN

---

## File Map

### Created
- `NAFServer/src/Application/DTOs/Department/DepartmentViewDTO.cs`
- `NAFServer/src/API/Controllers/DepartmentsController.cs`

### Modified
- `NAFServer/src/Domain/Interface/Repository/IEmployeeRepository.cs`
- `NAFServer/src/Infrastructure/Persistence/Repositories/EmployeeRepository.cs`
- `NAFClient/src/features/admin/departments/types.ts`
- `NAFClient/src/features/admin/departments/api.ts`
- `NAFClient/src/features/admin/departments/hooks/useDepartments.ts`
- `NAFClient/src/features/admin/departments/hooks/useDepartmentEmployees.ts`
- `NAFClient/src/features/admin/departments/pages/DepartmentListPage.tsx`
- `NAFClient/src/features/admin/departments/pages/DepartmentDetailPage.tsx`
- `NAFClient/src/features/admin/departments/components/DepartmentEmployeeTable.tsx`
- `NAFClient/src/features/admin/api.ts`
- `NAFClient/src/features/admin/hooks/useAdminLocations.ts`
- `NAFClient/src/features/admin/hooks/useAdminAllUsers.ts`
- `NAFClient/src/features/admin/pages/UserDetailPage.tsx`

### Deleted
- `NAFClient/src/features/admin/departments/components/AddDepartmentDialog.tsx`
- `NAFClient/src/features/admin/departments/components/ChangeDepartmentHeadDialog.tsx`
- `NAFClient/src/features/admin/departments/components/AddDepartmentEmployeeDialog.tsx`

---

## Task 1: Backend — Expose GetAllDepartmentsAsync + new DepartmentsController

**Files:**
- Modify: `NAFServer/src/Domain/Interface/Repository/IEmployeeRepository.cs`
- Modify: `NAFServer/src/Infrastructure/Persistence/Repositories/EmployeeRepository.cs`
- Create: `NAFServer/src/Application/DTOs/Department/DepartmentViewDTO.cs`
- Create: `NAFServer/src/API/Controllers/DepartmentsController.cs`

- [ ] **Step 1: Add GetAllDepartmentsAsync to the interface**

Replace the entire content of `NAFServer/src/Domain/Interface/Repository/IEmployeeRepository.cs`:

```csharp
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IEmployeeRepository
    {
        Task<Employee?> GetByIdAsync(string employeeId);
        Task<Employee?> GetByFullNameAsync(string fullName);
        Task<List<Employee>> GetSubordinatesAsync(string employeeId);
        Task<List<Employee>> SearchAsync(string match);
        Task<List<Employee>> GetByDepartmentAsync(string departmentId);
        Task<DepartmentView?> GetDepartmentByIdAsync(string departmentId);
        Task<List<DepartmentView>> GetAllDepartmentsAsync();
    }
}
```

- [ ] **Step 2: Implement GetAllDepartmentsAsync in EmployeeRepository**

Add this method at the end of the class, before the closing brace, in `NAFServer/src/Infrastructure/Persistence/Repositories/EmployeeRepository.cs`:

```csharp
public async Task<List<DepartmentView>> GetAllDepartmentsAsync()
{
    return await GetAllDeptsAsync();
}
```

- [ ] **Step 3: Create DepartmentViewDTO**

Create `NAFServer/src/Application/DTOs/Department/DepartmentViewDTO.cs`:

```csharp
namespace NAFServer.src.Application.DTOs.Department
{
    public record DepartmentViewDTO(
        string Id,
        string? DepartmentDesc,
        string? DepartmentHead
    );
}
```

- [ ] **Step 4: Create DepartmentsController**

Create `NAFServer/src/API/Controllers/DepartmentsController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.Department;
using NAFServer.src.Application.DTOs.Employee;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Mapper;

namespace NAFServer.src.API.Controllers
{
    [Route("api/admin/departments")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class DepartmentsController : ControllerBase
    {
        private readonly IEmployeeRepository _employeeRepository;

        public DepartmentsController(IEmployeeRepository employeeRepository)
        {
            _employeeRepository = employeeRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var departments = await _employeeRepository.GetAllDepartmentsAsync();
            var result = departments.Select(d => new DepartmentViewDTO(d.Id, d.DepartmentDesc, d.DepartmentHead));
            return Ok(result);
        }

        [HttpGet("{departmentId}/employees")]
        public async Task<IActionResult> GetEmployees(string departmentId)
        {
            var employees = await _employeeRepository.GetByDepartmentAsync(departmentId);
            return Ok(employees.Select(NAFMapper.ToEmployeeDTO));
        }
    }
}
```

- [ ] **Step 5: Verify NAFMapper.ToEmployeeDTO exists**

Open `NAFServer/src/Mapper/NAFMapper.cs` and confirm a `ToEmployeeDTO(Employee e)` static method exists that maps `Employee` → `EmployeeDTO`. If it does not exist as a static method, add it:

```csharp
public static EmployeeDTO ToEmployeeDTO(Employee e) => new(
    e.Id,
    e.FirstName,
    e.MiddleName,
    e.LastName,
    e.FullName,
    e.Status,
    e.Company,
    e.Position,
    e.Location,
    e.SupervisorId,
    e.DepartmentId,
    e.DepartmentDesc,
    e.DepartmentHead
);
```

- [ ] **Step 6: Build the backend**

```powershell
cd NAFServer
dotnet build --no-restore
```

Expected: `Build succeeded.` with 0 errors. Fix any errors before proceeding.

- [ ] **Step 7: Commit**

```powershell
git add NAFServer/src/Domain/Interface/Repository/IEmployeeRepository.cs
git add NAFServer/src/Infrastructure/Persistence/Repositories/EmployeeRepository.cs
git add NAFServer/src/Application/DTOs/Department/DepartmentViewDTO.cs
git add NAFServer/src/API/Controllers/DepartmentsController.cs
git commit -m "feat: add read-only department endpoints backed by employee cache"
```

---

## Task 2: Frontend — Update department types and API

**Files:**
- Modify: `NAFClient/src/features/admin/departments/types.ts`
- Modify: `NAFClient/src/features/admin/departments/api.ts`

- [ ] **Step 1: Replace types.ts**

Replace the entire content of `NAFClient/src/features/admin/departments/types.ts`:

```typescript
import type { Employee } from "@/shared/types/api/employee";

export interface DepartmentViewDTO {
  id: string;
  departmentDesc: string | null;
  departmentHead: string | null;
}

export type DepartmentEmployeeDTO = Pick<
  Employee,
  "id" | "firstName" | "lastName" | "middleName" | "position" | "departmentId"
>;
```

- [ ] **Step 2: Replace api.ts**

Replace the entire content of `NAFClient/src/features/admin/departments/api.ts`:

```typescript
import { api } from "@/shared/api/client";
import type { DepartmentViewDTO, DepartmentEmployeeDTO } from "./types";

export const departmentsApi = {
  getAll: () =>
    api.get<DepartmentViewDTO[]>("/admin/departments").then((r) => r.data),

  getById: (id: string) =>
    api.get<DepartmentViewDTO>(`/admin/departments/${id}`).then((r) => r.data),

  getEmployees: (id: string) =>
    api
      .get<DepartmentEmployeeDTO[]>(`/admin/departments/${id}/employees`)
      .then((r) => r.data),
};
```

Note: `id` is now `string` (was `number`) because department IDs are now department codes (strings) from the view.

- [ ] **Step 3: TypeScript check**

```powershell
cd NAFClient
npm run build 2>&1 | Select-String "error TS"
```

Errors are expected here — the hooks and pages still reference old types. They are fixed in the next tasks.

- [ ] **Step 4: Commit**

```powershell
git add NAFClient/src/features/admin/departments/types.ts
git add NAFClient/src/features/admin/departments/api.ts
git commit -m "refactor: update department frontend types and API to read-only cache-backed shape"
```

---

## Task 3: Frontend — Slim department hooks

**Files:**
- Modify: `NAFClient/src/features/admin/departments/hooks/useDepartments.ts`
- Modify: `NAFClient/src/features/admin/departments/hooks/useDepartmentEmployees.ts`

- [ ] **Step 1: Replace useDepartments.ts**

Replace the entire content of `NAFClient/src/features/admin/departments/hooks/useDepartments.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { departmentsApi } from "../api";

export function useDepartments() {
  return useQuery({
    queryKey: ["admin", "departments"],
    queryFn: departmentsApi.getAll,
  });
}

export function useDepartmentDetail(id: string) {
  return useQuery({
    queryKey: ["admin", "departments", id],
    queryFn: () => departmentsApi.getById(id),
    enabled: !!id,
  });
}
```

- [ ] **Step 2: Replace useDepartmentEmployees.ts**

Replace the entire content of `NAFClient/src/features/admin/departments/hooks/useDepartmentEmployees.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { departmentsApi } from "../api";

export function useDepartmentEmployees(departmentId: string) {
  return useQuery({
    queryKey: ["admin", "departments", departmentId, "employees"],
    queryFn: () => departmentsApi.getEmployees(departmentId),
    enabled: !!departmentId,
  });
}
```

- [ ] **Step 3: Commit**

```powershell
git add NAFClient/src/features/admin/departments/hooks/useDepartments.ts
git add NAFClient/src/features/admin/departments/hooks/useDepartmentEmployees.ts
git commit -m "refactor: remove department write hooks, keep read-only queries"
```

---

## Task 4: Frontend — Delete write-only dialog components

**Files:**
- Delete: `NAFClient/src/features/admin/departments/components/AddDepartmentDialog.tsx`
- Delete: `NAFClient/src/features/admin/departments/components/ChangeDepartmentHeadDialog.tsx`
- Delete: `NAFClient/src/features/admin/departments/components/AddDepartmentEmployeeDialog.tsx`

- [ ] **Step 1: Delete the three dialog files**

```powershell
Remove-Item "NAFClient/src/features/admin/departments/components/AddDepartmentDialog.tsx"
Remove-Item "NAFClient/src/features/admin/departments/components/ChangeDepartmentHeadDialog.tsx"
Remove-Item "NAFClient/src/features/admin/departments/components/AddDepartmentEmployeeDialog.tsx"
```

- [ ] **Step 2: Commit**

```powershell
git add -u NAFClient/src/features/admin/departments/components/
git commit -m "chore: delete stale department write dialog components"
```

---

## Task 5: Frontend — Update DepartmentListPage to read-only

**Files:**
- Modify: `NAFClient/src/features/admin/departments/pages/DepartmentListPage.tsx`

- [ ] **Step 1: Read the current file**

Open `NAFClient/src/features/admin/departments/pages/DepartmentListPage.tsx` and read its full content.

- [ ] **Step 2: Remove AddDepartmentDialog and location filter**

Make these changes:
- Remove any import of `AddDepartmentDialog`
- Remove the location filter state and dropdown (departments no longer have a location field)
- Remove the "Add department" button and its handler
- Update `useDepartments()` call — it no longer takes a `locationId` argument
- Update the table columns to use `DepartmentViewDTO` fields: `id` (string), `departmentDesc`, `departmentHead` instead of old fields (`code`, `name`, `isActive`, `location`)

The page should render a simple table of all departments showing department code, description, and department head. Clicking a row navigates to `/admin/departments/:id`. No create button.

- [ ] **Step 3: Commit**

```powershell
git add NAFClient/src/features/admin/departments/pages/DepartmentListPage.tsx
git commit -m "refactor: make DepartmentListPage read-only, remove add button and location filter"
```

---

## Task 6: Frontend — Update DepartmentDetailPage and DepartmentEmployeeTable to read-only

**Files:**
- Modify: `NAFClient/src/features/admin/departments/pages/DepartmentDetailPage.tsx`
- Modify: `NAFClient/src/features/admin/departments/components/DepartmentEmployeeTable.tsx`

- [ ] **Step 1: Read both files**

Open and read the full content of:
- `NAFClient/src/features/admin/departments/pages/DepartmentDetailPage.tsx`
- `NAFClient/src/features/admin/departments/components/DepartmentEmployeeTable.tsx`

- [ ] **Step 2: Update DepartmentDetailPage**

Make these changes to `DepartmentDetailPage.tsx`:
- Remove import of `ChangeDepartmentHeadDialog`
- Remove import of `AddDepartmentEmployeeDialog`
- Remove `useDepartmentMutations` usage (hook no longer exists)
- Remove `useDepartmentEmployeeMutations` usage (hook no longer exists)
- Remove the "Change Head" button and its handler
- Remove the "Set Inactive" button and its handler
- Remove the "Add Employee" button and its handler
- Update `useDepartmentDetail(id)` — `id` is now a `string` param from the URL (was `Number(id)`)
- Update `useDepartmentEmployees(id)` — `id` is now a `string`
- Display department info using `DepartmentViewDTO` fields: `departmentDesc` and `departmentHead`
- Keep the `DepartmentEmployeeTable` render

- [ ] **Step 3: Update DepartmentEmployeeTable**

Make these changes to `DepartmentEmployeeTable.tsx`:
- Remove `useDepartmentEmployeeMutations` import and usage
- Remove the remove-employee button column
- Remove the confirmation dialog for removal
- The table should render employees with their name, position — read-only
- Columns to show: full name (`firstName` + `lastName`), `position`
- Keep the "View NAF" / "Create NAF" row actions if they exist and are functional; remove if they reference deleted types

- [ ] **Step 4: TypeScript check**

```powershell
cd NAFClient
npm run build 2>&1 | Select-String "error TS"
```

Fix any remaining type errors before committing.

- [ ] **Step 5: Commit**

```powershell
git add NAFClient/src/features/admin/departments/pages/DepartmentDetailPage.tsx
git add NAFClient/src/features/admin/departments/components/DepartmentEmployeeTable.tsx
git commit -m "refactor: make DepartmentDetailPage and DepartmentEmployeeTable read-only"
```

---

## Task 7: Frontend — Fix admin location filter

**Files:**
- Modify: `NAFClient/src/features/admin/api.ts`
- Modify: `NAFClient/src/features/admin/hooks/useAdminLocations.ts`
- Modify: `NAFClient/src/features/admin/hooks/useAdminAllUsers.ts`

- [ ] **Step 1: Remove stale methods from adminApi**

In `NAFClient/src/features/admin/api.ts`, remove these three methods from the `adminApi` object:

```typescript
// Remove these:
getLocations: () =>
  api.get<LocationDTO[]>("/user-locations").then((r) => r.data),

assignLocation: (userId: number, locationId: number) =>
  api.post(`/user-locations/${userId}/assign`, locationId).then((r) => r.data),

removeLocation: (userId: number, locationId: number) =>
  api.delete(`/user-locations/${userId}/remove/${locationId}`).then((r) => r.data),
```

Also remove `LocationDTO` from the import list in the same file (it comes from `./types` — check if it's still used elsewhere in the file first; if not, remove the import).

- [ ] **Step 2: Replace useAdminLocations.ts**

Replace the entire content of `NAFClient/src/features/admin/hooks/useAdminLocations.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api";

export function useAdminLocations() {
  const locationsQuery = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: adminApi.getAdminLocations,
  });

  return { locationsQuery };
}
```

- [ ] **Step 3: Update useAdminAllUsers.ts**

In `NAFClient/src/features/admin/hooks/useAdminAllUsers.ts`, change line 8 from:

```typescript
queryFn: adminApi.getLocations,
```

to:

```typescript
queryFn: adminApi.getAdminLocations,
```

- [ ] **Step 4: TypeScript check**

```powershell
cd NAFClient
npm run build 2>&1 | Select-String "error TS"
```

Fix any errors. Common ones: any consumer of `useAdminLocations` that destructured `assignLocationMutation` or `removeLocationMutation` will now error — those are removed in Task 8.

- [ ] **Step 5: Commit**

```powershell
git add NAFClient/src/features/admin/api.ts
git add NAFClient/src/features/admin/hooks/useAdminLocations.ts
git add NAFClient/src/features/admin/hooks/useAdminAllUsers.ts
git commit -m "fix: wire admin location filter to /admin/locations, remove stale user-location methods"
```

---

## Task 8: Frontend — Remove location section from UserDetailPage

**Files:**
- Modify: `NAFClient/src/features/admin/pages/UserDetailPage.tsx`

- [ ] **Step 1: Remove useAdminLocations import and usage**

In `NAFClient/src/features/admin/pages/UserDetailPage.tsx`:

Remove line:
```typescript
import { useAdminLocations } from "../hooks/useAdminLocations";
```

Remove from the component body:
```typescript
const { assignLocationMutation, removeLocationMutation } = useAdminLocations();
```

Remove state variables:
```typescript
const [locationEditing, setLocationEditing] = useState(false);
const [selectedLocationId, setSelectedLocationId] = useState(0);
```

Remove the `handleChangeLocation` function (lines 107–115):
```typescript
const handleChangeLocation = async () => {
  if (!user || !selectedLocationId) return;
  if (user.locationId) {
    await removeLocationMutation.mutateAsync({ userId: user.id, locationId: user.locationId });
  }
  await assignLocationMutation.mutateAsync({ userId: user.id, locationId: selectedLocationId });
  setLocationEditing(false);
  setSelectedLocationId(0);
};
```

- [ ] **Step 2: Remove the Location JSX section**

Remove the entire Location card from the JSX (lines 268–333), which starts with:
```tsx
{/* Location */}
<div className="rounded-xl border border-gray-100 bg-white p-5">
```
and ends with:
```tsx
</div>
```
(the closing div of the Location card, before the `</div>` that closes the right column).

Also remove `MapPin` from the lucide-react import if it's no longer used elsewhere in the file.

- [ ] **Step 3: Remove locationsQuery from useAdminAllUsers destructuring**

In `UserDetailPage.tsx`, the component destructures `useAdminAllUsers()`:
```typescript
const { users, isLoading, locationsQuery } = useAdminAllUsers();
```

Remove `locationsQuery` from the destructuring since the location section is gone:
```typescript
const { users, isLoading } = useAdminAllUsers();
```

- [ ] **Step 4: TypeScript check and build**

```powershell
cd NAFClient
npm run build 2>&1 | Select-String "error TS"
```

Fix any remaining errors.

- [ ] **Step 5: Full build confirmation**

```powershell
cd NAFClient
npm run build 2>&1 | Select-String "built in|error"
```

Expected: `✓ built in X.XXs` with no errors.

- [ ] **Step 6: Commit**

```powershell
git add NAFClient/src/features/admin/pages/UserDetailPage.tsx
git commit -m "feat: remove user location assignment section from UserDetailPage"
```

---

## Task 9: Final build smoke test

- [ ] **Step 1: Backend build**

```powershell
cd NAFServer
dotnet build --no-restore 2>&1 | Where-Object { $_ -like "*): error*" }
```

Expected: no output (no errors).

- [ ] **Step 2: Frontend build**

```powershell
cd NAFClient
npm run build 2>&1 | Select-String "built in|error"
```

Expected: `✓ built in X.XXs`.

- [ ] **Step 3: Confirm deleted files are gone**

```powershell
Test-Path "NAFClient/src/features/admin/departments/components/AddDepartmentDialog.tsx"
Test-Path "NAFClient/src/features/admin/departments/components/ChangeDepartmentHeadDialog.tsx"
Test-Path "NAFClient/src/features/admin/departments/components/AddDepartmentEmployeeDialog.tsx"
```

Expected: all three return `False`.

- [ ] **Step 4: Confirm stale API methods are gone**

```powershell
Select-String -Path "NAFClient/src/features/admin/api.ts" -Pattern "getLocations|assignLocation|removeLocation|user-locations"
```

Expected: no output.
