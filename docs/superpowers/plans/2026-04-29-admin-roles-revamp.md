# Admin Roles Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix broken user role assignment on the admin roles page (404 on submit, roles showing as numbers) and add four UI improvements (colored badges, employee lookup preview, removal confirmation, search filter).

**Architecture:** A new `POST /admin/users/{employeeId}/roles` endpoint replaces the broken `POST /admin/users`. The service layer uses an upsert pattern (find-or-create user) then adds the role. A global `JsonStringEnumConverter` fixes enum serialization across the entire API. The frontend is updated to match the new endpoint, correct role values, and four UI improvements.

**Tech Stack:** ASP.NET Core 8, EF Core, C# records; React 19 + TypeScript, React Query, Tailwind CSS v4, ShadCN

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `NAFServer/Program.cs` | Modify line 18 | Add global `JsonStringEnumConverter` |
| `NAFServer/src/Application/DTOs/User/UserDTO.cs` | Modify | Change `List<Roles>` to `List<string>` |
| `NAFServer/src/Application/DTOs/Admin/AssignRoleDTO.cs` | Create | New DTO for role assignment request |
| `NAFServer/src/Application/DTOs/Admin/AddUserDTO.cs` | Delete | Replaced by `AssignRoleDTO` |
| `NAFServer/src/Application/Interfaces/IAdminService.cs` | Modify | Replace `AddUserAsync` with `AssignRoleToEmployeeAsync` |
| `NAFServer/src/Application/Services/AdminService.cs` | Modify | Implement upsert role assignment, remove old method |
| `NAFServer/src/Infrastructure/Persistence/Repositories/UserRoleRepository.cs` | Modify | Fix `AddUserRoleAsync` to handle new users with no existing roles |
| `NAFServer/src/API/Controllers/AdminController.cs` | Modify | Replace `AddUser` action with `AssignRoleToEmployee` |
| `NAFClient/src/features/admin/types.ts` | Modify | Add `AssignRoleDTO`, remove `AddUserDTO` |
| `NAFClient/src/features/admin/api.ts` | Modify | Replace `addUser` with `assignRole` |
| `NAFClient/src/features/admin/hooks/useAdminUsers.ts` | Modify | Update mutation to call `assignRole` |
| `NAFClient/src/features/admin/pages/RolesPage.tsx` | Modify | Fix `ROLES`, four UI improvements |

---

## Task 1: Fix enum serialization + UserDTO roles field

**Files:**
- Modify: `NAFServer/Program.cs:18`
- Modify: `NAFServer/src/Application/DTOs/User/UserDTO.cs`
- Modify: `NAFServer/src/Application/Services/AdminService.cs:83` (the `.Select` mapping)

- [ ] **Step 1: Add `JsonStringEnumConverter` to `Program.cs`**

Open `NAFServer/Program.cs`. Replace line 18:
```csharp
// Before
builder.Services.AddControllers();

// After
builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
```

- [ ] **Step 2: Change `UserDTO.Roles` from enum list to string list**

Open `NAFServer/src/Application/DTOs/User/UserDTO.cs`. Replace the entire file content:
```csharp
namespace NAFServer.src.Application.DTOs.User
{
    public record UserDTO
    (
        int Id,
        string EmployeeId,
        string LastName,
        string FirstName,
        string? MiddleName,
        string Company,
        string Position,
        int DepartmentId,
        string Department,
        int LocationId,
        string Location,
        List<string> Roles
    );
}
```

- [ ] **Step 3: Fix the mapping in `AdminService.GetAllUsersInLocationAsync`**

Open `NAFServer/src/Application/Services/AdminService.cs`. Find the `result.Add(new UserDTO(...))` call around line 71. The last argument is the roles list. Change:
```csharp
// Before
activeRoles.Select(r => r.Role.Name).ToList()

// After
activeRoles.Select(r => r.Role.Name.ToString()).ToList()
```

- [ ] **Step 4: Build the backend to verify no compile errors**

Run from `NAFServer/`:
```
dotnet build
```
Expected: `Build succeeded` with 0 errors.

- [ ] **Step 5: Commit**

```
git add NAFServer/Program.cs NAFServer/src/Application/DTOs/User/UserDTO.cs NAFServer/src/Application/Services/AdminService.cs
git commit -m "fix: serialize enums as strings globally, fix UserDTO roles field type"
```

---

## Task 2: Create `AssignRoleDTO` and update `IAdminService` interface

**Files:**
- Create: `NAFServer/src/Application/DTOs/Admin/AssignRoleDTO.cs`
- Modify: `NAFServer/src/Application/Interfaces/IAdminService.cs`

- [ ] **Step 1: Create `AssignRoleDTO.cs`**

Create `NAFServer/src/Application/DTOs/Admin/AssignRoleDTO.cs` with:
```csharp
namespace NAFServer.src.Application.DTOs.Admin
{
    public record AssignRoleDTO(string Role, int LocationId);
}
```

- [ ] **Step 2: Update `IAdminService` interface**

Replace the entire content of `NAFServer/src/Application/Interfaces/IAdminService.cs`:
```csharp
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.DTOs.User;

namespace NAFServer.src.Application.Interfaces
{
    public interface IAdminService
    {
        Task<List<UserDTO>> GetAllUsersInLocationAsync(int locationId);
        Task AssignRoleToEmployeeAsync(string employeeId, AssignRoleDTO dto);
    }
}
```

- [ ] **Step 3: Build to verify interface compiles (service will break — expected)**

```
dotnet build
```
Expected: Build fails with error in `AdminService.cs` about not implementing `AssignRoleToEmployeeAsync`. That is expected — it will be fixed in Task 4.

- [ ] **Step 4: Commit**

```
git add NAFServer/src/Application/DTOs/Admin/AssignRoleDTO.cs NAFServer/src/Application/Interfaces/IAdminService.cs
git commit -m "feat: add AssignRoleDTO and update IAdminService interface"
```

---

## Task 3: Fix `UserRoleRepository.AddUserRoleAsync` for new users

**Files:**
- Modify: `NAFServer/src/Infrastructure/Persistence/Repositories/UserRoleRepository.cs`

**Context:** `GetUserRolesAsync` throws `KeyNotFoundException` when a user has no roles at all. `AddUserRoleAsync` calls `GetUserRolesAsync` first, so it fails for brand-new users. The fix is to catch the "no roles" exception and continue with an empty list.

- [ ] **Step 1: Fix `AddUserRoleAsync` to handle new users**

Open `NAFServer/src/Infrastructure/Persistence/Repositories/UserRoleRepository.cs`. Replace the `AddUserRoleAsync` method:
```csharp
public async Task<List<UserRole>> AddUserRoleAsync(int userId, int roleId)
{
    List<UserRole> roles;
    try
    {
        roles = await GetUserRolesAsync(userId);
    }
    catch (KeyNotFoundException)
    {
        roles = new List<UserRole>();
    }

    var existingRole = roles.FirstOrDefault(r => r.RoleId == roleId);
    if (existingRole != null)
    {
        if (existingRole.IsActive)
            throw new KeyNotFoundException("User already has this role.");
        existingRole.SetToActive();
    }
    else
    {
        _context.UserRoles.Add(new UserRole(userId, roleId));
    }
    await _context.SaveChangesAsync();

    try
    {
        return await GetUserRolesAsync(userId);
    }
    catch (KeyNotFoundException)
    {
        return new List<UserRole>();
    }
}
```

- [ ] **Step 2: Build to verify**

```
dotnet build
```
Expected: Same errors as before (AdminService still broken from Task 2). No new errors.

- [ ] **Step 3: Commit**

```
git add NAFServer/src/Infrastructure/Persistence/Repositories/UserRoleRepository.cs
git commit -m "fix: handle new users with no existing roles in AddUserRoleAsync"
```

---

## Task 4: Implement `AssignRoleToEmployeeAsync` in `AdminService`, remove old method

**Files:**
- Modify: `NAFServer/src/Application/Services/AdminService.cs`

- [ ] **Step 1: Replace `AddUserAsync` with `AssignRoleToEmployeeAsync`**

Open `NAFServer/src/Application/Services/AdminService.cs`. Replace the entire `AddUserAsync` method (lines 89–102) with:
```csharp
public async Task AssignRoleToEmployeeAsync(string employeeId, AssignRoleDTO dto)
{
    if (!Enum.TryParse<Roles>(dto.Role, ignoreCase: true, out var role))
        throw new ArgumentException($"Invalid role: {dto.Role}");

    var roleEntity = await _roleRepository.GetByNameAsync(role)
        ?? throw new KeyNotFoundException($"Role '{dto.Role}' not found in database.");

    User user;
    try
    {
        user = await _userRepository.GetUserByEmployeeId(employeeId);
    }
    catch (KeyNotFoundException)
    {
        user = new User(employeeId);
        await _userRepository.AddAsync(user);
    }

    try
    {
        await _userLocationRepository.AddUserCurrentLocation(user.Id, dto.LocationId);
    }
    catch (KeyNotFoundException)
    {
        // Already in this location — not an error
    }

    try
    {
        await _userRoleRepository.AddUserRoleAsync(user.Id, roleEntity.Id);
    }
    catch (KeyNotFoundException)
    {
        // Already has this role — not an error
    }
}
```

Also update the `using` at the top of `AdminService.cs` — make sure `AddUserDTO` import is removed since `AssignRoleDTO` is in the same namespace (`NAFServer.src.Application.DTOs.Admin`) which is already imported.

- [ ] **Step 2: Build to verify**

```
dotnet build
```
Expected: `Build succeeded` — the interface is now satisfied.

- [ ] **Step 3: Commit**

```
git add NAFServer/src/Application/Services/AdminService.cs
git commit -m "feat: implement AssignRoleToEmployeeAsync with upsert pattern"
```

---

## Task 5: Update `AdminController`, remove old endpoint and `AddUserDTO`

**Files:**
- Modify: `NAFServer/src/API/Controllers/AdminController.cs`
- Delete: `NAFServer/src/Application/DTOs/Admin/AddUserDTO.cs`

- [ ] **Step 1: Replace `AddUser` action in `AdminController`**

Open `NAFServer/src/API/Controllers/AdminController.cs`. Replace the entire file:
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.API.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly INAFService _nafService;

        public AdminController(IAdminService adminService, INAFService nafService)
        {
            _adminService = adminService;
            _nafService = nafService;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] int locationId)
        {
            return Ok(await _adminService.GetAllUsersInLocationAsync(locationId));
        }

        [HttpPost("users/{employeeId}/roles")]
        public async Task<IActionResult> AssignRoleToEmployee(string employeeId, [FromBody] AssignRoleDTO dto)
        {
            try
            {
                await _adminService.AssignRoleToEmployeeAsync(employeeId, dto);
                return Created("", null);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("nafs")]
        public async Task<IActionResult> GetAdminNAFs(
            [FromQuery] int locationId,
            [FromQuery] string status = "all",
            [FromQuery][Range(1, int.MaxValue)] int page = 1)
        {
            return Ok(await _nafService.GetNAFsByLocationPagedAsync(locationId, status, page));
        }
    }
}
```

- [ ] **Step 2: Delete `AddUserDTO.cs`**

Delete the file `NAFServer/src/Application/DTOs/Admin/AddUserDTO.cs`.

- [ ] **Step 3: Build to verify**

```
dotnet build
```
Expected: `Build succeeded` with 0 errors.

- [ ] **Step 4: Manual smoke test**

Start the server: `dotnet run` from `NAFServer/`.

Test the new endpoint with a valid employee ID and role:
```
POST http://localhost:5186/api/admin/users/EMP001/roles
Authorization: Bearer <admin-token>
Content-Type: application/json

{ "role": "REQUESTOR_APPROVER", "locationId": 1 }
```
Expected: `201 Created`.

Test with an invalid role:
```
{ "role": "TECHNICAL_TEAM", "locationId": 1 }
```
Expected: `400 Bad Request` with message `"Invalid role: TECHNICAL_TEAM"`.

- [ ] **Step 5: Commit**

```
git add NAFServer/src/API/Controllers/AdminController.cs
git rm NAFServer/src/Application/DTOs/Admin/AddUserDTO.cs
git commit -m "feat: add AssignRoleToEmployee endpoint, remove old AddUser endpoint"
```

---

## Task 6: Update frontend types and API layer

**Files:**
- Modify: `NAFClient/src/features/admin/types.ts`
- Modify: `NAFClient/src/features/admin/api.ts`

- [ ] **Step 1: Update `types.ts`**

Open `NAFClient/src/features/admin/types.ts`. Remove the `AddUserDTO` interface and add `AssignRoleDTO`:
```typescript
export interface ForImplementationItemDTO {
  id: string;
  nafId: string;
  progress: string;
  resourceName: string;
  implementationId: string | null;
  implementationStatus: "OPEN" | "IN_PROGRESS" | "DELAYED" | "ACCOMPLISHED" | null;
  assignedTo: string | null;
}

export interface UserDTO {
  id: number;
  employeeId: string;
  lastName: string;
  firstName: string;
  middleName: string | null;
  company: string;
  position: string;
  departmentId: number;
  department: string;
  locationId: number;
  location: string;
  roles: string[];
}

export interface LocationDTO {
  id: number;
  name: string;
  isActive: boolean;
}

export interface AssignRoleDTO {
  role: string;
  locationId: number;
}

export interface UserRoleDetailDTO {
  id: number;
  roleId: number;
  role: string;
  userId: number;
  isActive: boolean;
  dateAdded: string;
  dateRemoved: string | null;
}
```

- [ ] **Step 2: Update `api.ts`**

Open `NAFClient/src/features/admin/api.ts`. Replace `addUser` with `assignRole`:
```typescript
import { api } from "@/shared/api/client";
import type { NAF } from "@/shared/types/api/naf";
import type { PagedResult } from "@/shared/types/common/pagedResult";
import type {
  AssignRoleDTO,
  ForImplementationItemDTO,
  LocationDTO,
  UserDTO,
  UserRoleDetailDTO,
} from "./types";

export const adminApi = {
  // Admin user management
  getUsers: (locationId: number) =>
    api.get<UserDTO[]>(`/admin/users?locationId=${locationId}`).then((r) => r.data),

  assignRole: (employeeId: string, data: AssignRoleDTO) =>
    api.post(`/admin/users/${employeeId}/roles`, data).then((r) => r.data),

  // Location management
  getLocations: () =>
    api.get<LocationDTO[]>("/user-locations").then((r) => r.data),

  assignLocation: (userId: number, locationId: number) =>
    api.post(`/user-locations/${userId}/assign`, locationId).then((r) => r.data),

  // Role management
  getUserActiveRoles: (userId: number) =>
    api.get<UserRoleDetailDTO[]>(`/user-roles/${userId}/active`).then((r) => r.data),

  removeRole: (userId: number, roleId: number) =>
    api.delete(`/user-roles/${userId}/remove/${roleId}`).then((r) => r.data),

  // Admin NAF list
  getAdminNAFs: (locationId: number, status: string, page: number) =>
    api
      .get<PagedResult<NAF>>("/admin/nafs", { params: { locationId, status, page } })
      .then((r) => r.data),

  // Implementation endpoints
  getMyTasks: () =>
    api.get<NAF[]>("/implementations/my-tasks").then((r) => r.data),

  getForImplementations: (locationId: number) =>
    api
      .get<NAF[]>("/implementations/for-implementations", { params: { locationId } })
      .then((r) => r.data),

  assignToMe: (resourceRequestId: string) =>
    api
      .post<ForImplementationItemDTO>(`/implementations/resource-requests/${resourceRequestId}/assign`)
      .then((r) => r.data),

  setToInProgress: (implementationId: string) =>
    api.patch(`/implementations/${implementationId}/in-progress`).then((r) => r.data),

  setToDelayed: (implementationId: string, delayReason: string) =>
    api
      .patch(`/implementations/${implementationId}/delayed`, JSON.stringify(delayReason))
      .then((r) => r.data),

  setToAccomplished: (implementationId: string) =>
    api.patch(`/implementations/${implementationId}/accomplished`).then((r) => r.data),
};
```

- [ ] **Step 3: TypeScript check**

Run from `NAFClient/`:
```
npm run build
```
Expected: No TypeScript errors (or only pre-existing errors unrelated to this change).

- [ ] **Step 4: Commit**

```
git add NAFClient/src/features/admin/types.ts NAFClient/src/features/admin/api.ts
git commit -m "feat: replace AddUserDTO/addUser with AssignRoleDTO/assignRole"
```

---

## Task 7: Update `useAdminUsers` hook

**Files:**
- Modify: `NAFClient/src/features/admin/hooks/useAdminUsers.ts`

- [ ] **Step 1: Update `addUserMutation` to use `assignRole`**

Replace the entire content of `NAFClient/src/features/admin/hooks/useAdminUsers.ts`:
```typescript
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";
import type { AssignRoleDTO, UserDTO } from "../types";
import { toast } from "sonner";

export function useAdminUsers(locationId: number | null) {
  const queryClient = useQueryClient();

  const singleLocationQuery = useQuery({
    queryKey: ["admin", "users", locationId],
    queryFn: () => adminApi.getUsers(locationId!),
    enabled: locationId !== null,
  });

  const allLocationsQuery = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: adminApi.getLocations,
    enabled: locationId === null,
  });

  const locationIds =
    locationId === null ? (allLocationsQuery.data?.map((l) => l.id) ?? []) : [];

  const perLocationQueries = useQueries({
    queries: locationIds.map((id) => ({
      queryKey: ["admin", "users", id],
      queryFn: () => adminApi.getUsers(id),
    })),
  });

  const users: UserDTO[] =
    locationId !== null
      ? (singleLocationQuery.data ?? [])
      : perLocationQueries.flatMap((q) => q.data ?? []);

  const isLoading =
    locationId !== null
      ? singleLocationQuery.isLoading
      : allLocationsQuery.isLoading || perLocationQueries.some((q) => q.isLoading);

  const assignRoleMutation = useMutation({
    mutationFn: ({ employeeId, ...data }: { employeeId: string } & AssignRoleDTO) =>
      adminApi.assignRole(employeeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Role assigned");
    },
    onError: () => toast.error("Failed to assign role"),
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, roleName }: { userId: number; roleName: string }) => {
      const roles = await adminApi.getUserActiveRoles(userId);
      const target = roles.find((r) => r.role === roleName);
      if (!target) throw new Error(`Role ${roleName} not found on user`);
      return adminApi.removeRole(userId, target.roleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Role removed");
    },
    onError: () => toast.error("Failed to remove role"),
  });

  return { users, isLoading, assignRoleMutation, removeRoleMutation };
}
```

- [ ] **Step 2: TypeScript check**

```
npm run build
```
Expected: No errors introduced by this change. If `RolesPage.tsx` still references `addUserMutation`, it will error — that is fixed in Task 8.

- [ ] **Step 3: Commit**

```
git add NAFClient/src/features/admin/hooks/useAdminUsers.ts
git commit -m "feat: update useAdminUsers to use assignRoleMutation"
```

---

## Task 8: Revamp `RolesPage.tsx`

**Files:**
- Modify: `NAFClient/src/features/admin/pages/RolesPage.tsx`

This task implements all four UI improvements plus fixes the `ROLES` constant and wires up the new hook API.

- [ ] **Step 1: Replace the entire `RolesPage.tsx`**

Replace the entire content of `NAFClient/src/features/admin/pages/RolesPage.tsx`:
```typescript
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/AuthContext";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useAdminLocations } from "../hooks/useAdminLocations";
import { searchEmployees } from "@/shared/api/employeeService";
import type { Employee } from "@/shared/types/api/employee";

const ROLES = ["ADMIN", "MANAGEMENT", "REQUESTOR_APPROVER", "HR"];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-amber-100 text-amber-800 border border-amber-200",
  MANAGEMENT: "bg-blue-100 text-blue-800 border border-blue-200",
  HR: "bg-green-100 text-green-800 border border-green-200",
  REQUESTOR_APPROVER: "bg-slate-100 text-slate-700 border border-slate-200",
};

export default function RolesPage() {
  const { user } = useAuth();
  const [viewAll, setViewAll] = useState(false);
  const locationId = viewAll ? null : (user?.locationId ?? null);

  const { users, isLoading, assignRoleMutation, removeRoleMutation } = useAdminUsers(locationId);
  const { locationsQuery } = useAdminLocations();

  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState("");
  const [formLocationId, setFormLocationId] = useState(user?.locationId ?? 0);
  const [formError, setFormError] = useState("");

  // Employee lookup preview
  const [empLookup, setEmpLookup] = useState<{
    state: "idle" | "loading" | "found" | "not_found";
    employee: Employee | null;
  }>({ state: "idle", employee: null });

  useEffect(() => {
    if (!employeeId.trim()) {
      setEmpLookup({ state: "idle", employee: null });
      return;
    }
    const timer = setTimeout(async () => {
      setEmpLookup({ state: "loading", employee: null });
      try {
        const results = await searchEmployees(employeeId.trim());
        const match = results.find((e) => e.id === employeeId.trim());
        if (match) {
          setEmpLookup({ state: "found", employee: match });
        } else {
          setEmpLookup({ state: "not_found", employee: null });
        }
      } catch {
        setEmpLookup({ state: "not_found", employee: null });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [employeeId]);

  // Inline removal confirmation
  const [pendingRemove, setPendingRemove] = useState<{ userId: number; roleName: string } | null>(null);

  // Search/filter
  const [search, setSearch] = useState("");
  const filtered = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.employeeId}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      await assignRoleMutation.mutateAsync({ employeeId, role, locationId: formLocationId });
      setEmployeeId("");
      setRole("");
      setEmpLookup({ state: "idle", employee: null });
    } catch {
      setFormError("Failed to assign role. Check the employee ID and try again.");
    }
  };

  const handleConfirmRemove = async () => {
    if (!pendingRemove) return;
    await removeRoleMutation.mutateAsync(pendingRemove);
    setPendingRemove(null);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-amber-500">Roles Management</h1>
        <Button variant="outline" size="sm" onClick={() => setViewAll((v) => !v)}>
          {viewAll ? "My Location" : "View All"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 items-start">
        {/* Left panel — Assign Role form */}
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-base">Assign Role</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAssign} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Label>Employee ID</Label>
                <Input
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP001"
                  required
                />
                {empLookup.state === "loading" && (
                  <p className="text-xs text-muted-foreground">Looking up employee…</p>
                )}
                {empLookup.state === "found" && empLookup.employee && (
                  <p className="text-xs text-green-700">
                    {empLookup.employee.firstName} {empLookup.employee.lastName} · {empLookup.employee.position}
                  </p>
                )}
                {empLookup.state === "not_found" && (
                  <p className="text-xs text-red-500">Employee not found</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <Label>Role</Label>
                <select
                  className="border rounded px-3 py-2 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="">Select role</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <Label>Location</Label>
                <select
                  className="border rounded px-3 py-2 text-sm"
                  value={formLocationId}
                  onChange={(e) => setFormLocationId(Number(e.target.value))}
                  required
                >
                  <option value={0}>Select location</option>
                  {locationsQuery.data?.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <Button type="submit" disabled={assignRoleMutation.isPending} className="w-full">
                {assignRoleMutation.isPending ? "Assigning…" : "Assign Role"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right panel — User roles list */}
        <div className="space-y-3">
          <Input
            placeholder="Search by name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />

          {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

          {!isLoading && filtered.length === 0 && (
            <p className="text-muted-foreground text-sm">
              {search ? "No users match your search." : "No users found."}
            </p>
          )}

          {filtered.map((u) => (
            <Card key={u.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-semibold">{u.firstName} {u.lastName}</p>
                    <p className="text-sm text-muted-foreground">{u.employeeId} · {u.location}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {u.roles.map((roleName) => {
                      const isPending =
                        pendingRemove?.userId === u.id && pendingRemove?.roleName === roleName;
                      return (
                        <div key={roleName} className="flex items-center gap-1">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[roleName] ?? "bg-gray-100 text-gray-700 border border-gray-200"}`}
                          >
                            {roleName}
                          </span>
                          {isPending ? (
                            <span className="flex items-center gap-1 text-xs">
                              <span className="text-muted-foreground">Remove?</span>
                              <button
                                className="text-red-600 font-semibold hover:underline"
                                onClick={handleConfirmRemove}
                                disabled={removeRoleMutation.isPending}
                              >
                                Yes
                              </button>
                              <button
                                className="text-muted-foreground hover:underline"
                                onClick={() => setPendingRemove(null)}
                              >
                                No
                              </button>
                            </span>
                          ) : (
                            <button
                              className="text-red-400 hover:text-red-600 text-xs ml-0.5"
                              title={`Remove ${roleName}`}
                              onClick={() => setPendingRemove({ userId: u.id, roleName })}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: TypeScript check**

Run from `NAFClient/`:
```
npm run build
```
Expected: `Build succeeded` (or pre-existing errors only, none from the changed files).

- [ ] **Step 3: Manual UI test**

Start both servers (`dotnet run` in `NAFServer/`, `npm run dev` in `NAFClient/`). Navigate to `/admin/roles` as an ADMIN user and verify:

1. **Role badges show names** (e.g. "ADMIN", "REQUESTOR_APPROVER"), not numbers
2. **Role badges are colored** (amber for ADMIN, blue for MANAGEMENT, green for HR, slate for REQUESTOR_APPROVER)
3. **Employee lookup**: type a valid employee ID in the form → wait ~400ms → name and position appear below the field
4. **Employee lookup not found**: type a nonexistent ID → "Employee not found" in red
5. **Role assignment**: select a role + location → submit → toast "Role assigned" → user appears in list
6. **Removal confirmation**: click ✕ on a role badge → inline "Remove? Yes No" appears → click Yes → role removed; click No → confirmation dismissed
7. **Search filter**: type a name in the search box → list filters in real time

- [ ] **Step 4: Commit**

```
git add NAFClient/src/features/admin/pages/RolesPage.tsx
git commit -m "feat: revamp RolesPage with colored badges, employee lookup, removal confirm, search filter"
```

---

## Self-Review Notes

- All four UI improvements are in Task 8 with complete code
- `AddUserDTO` removal is handled in Task 5 with `git rm`
- `assignRoleMutation` name is consistent across `useAdminUsers.ts` (Task 7) and `RolesPage.tsx` (Task 8)
- The `ROLE_COLORS` fallback (`?? "bg-gray-100..."`) handles any role names not in the map
- Employee lookup uses `searchEmployees` from `@/shared/api/employeeService` which already exists — no new API function needed
- The `pendingRemove` state is scoped per `(userId, roleName)` pair so multiple cards don't interfere
