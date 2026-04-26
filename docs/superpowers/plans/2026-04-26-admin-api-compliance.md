# Admin API Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the admin client to match server-side API changes — new endpoint paths, new DTO shapes, integer IDs replacing string identifiers — and add location-scoped user views with a "View All" toggle.

**Architecture:** The server's `AdminController` now requires `?locationId=N` on `GET /admin/users` and returns `UserDTO` (with `id`, name fields, `roles: string[]`). Role removal moved to `DELETE /user-roles/{userId}/remove/{roleId}`. Locations moved to `GET/POST /user-locations`. The admin's own location is added to `GET /auth/me` so pages can default-filter to it. A "View All" toggle fans out per-location queries using React Query's `useQueries`.

**Tech Stack:** React 19, TypeScript, ASP.NET Core 8, `@tanstack/react-query` v5

**Prerequisite:** The shared restructure plan (`2026-04-24-restructure-shared.md`) and admin feature consolidation (`2026-04-24-restructure-admin.md`) must already be complete.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `NAFServer/src/Application/DTOs/Auth/AuthUserDTO.cs` | Modify | Add `LocationId` and `Location` fields |
| `NAFServer/src/Application/Services/AuthService.cs` | Modify | Inject `IUserLocationRepository`; populate location in `GetCurrentUserAsync` |
| `NAFClient/src/shared/types/api/auth.ts` | Modify | Add `locationId: number` and `location: string` to `AuthUser` |
| `NAFClient/src/features/auth/pages/AdminLoginPage.tsx` | Modify | Call `authApi.me()` after login so `user.locationId` is available immediately |
| `NAFClient/src/features/admin/types.ts` | Rewrite | Replace `ForImplementationItemDTO`-only file with `UserDTO`, `LocationDTO`, `UserRoleDetailDTO` |
| `NAFClient/src/features/admin/api.ts` | Rewrite | Match new server endpoints; remove gone endpoints; add user-roles and user-locations calls |
| `NAFClient/src/features/admin/hooks/useAdminLocations.ts` | Rewrite | Use `GET /user-locations`; `assignLocation` takes `userId + locationId` (both `number`) |
| `NAFClient/src/features/admin/hooks/useAdminUsers.ts` | Rewrite | Accept `locationId: number \| null`; null triggers `useQueries` fan-out across all locations |
| `NAFClient/src/features/admin/pages/RolesPage.tsx` | Rewrite | Default to `user.locationId`; "View All" toggle; updated form and user card rendering |
| `NAFClient/src/features/admin/pages/LocationsPage.tsx` | Rewrite | Same location filter; assign form uses user select + location select (both by ID) |

---

### Task 1: Extend `AuthUserDTO` and `AuthService` to include the admin's location

**Files:**
- Modify: `NAFServer/src/Application/DTOs/Auth/AuthUserDTO.cs`
- Modify: `NAFServer/src/Application/Services/AuthService.cs`

- [ ] **Step 1: Replace `AuthUserDTO.cs`**

```csharp
namespace NAFServer.src.Application.DTOs.Auth
{
    public record AuthUserDTO(string EmployeeId, string Role, string Name, int LocationId, string Location);
}
```

- [ ] **Step 2: Update `AuthService.cs` — add `IUserLocationRepository` dependency and populate location**

Replace the entire file content:

```csharp
using Microsoft.IdentityModel.Tokens;
using NAFServer.src.Application.DTOs.Auth;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace NAFServer.src.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IConfiguration _config;
        private readonly IUserRepository _userRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly IUserLocationRepository _userLocationRepository;

        public AuthService(
            IConfiguration config,
            IUserRepository userRepository,
            IEmployeeRepository employeeRepository,
            IUserRoleRepository userRoleRepository,
            IRoleRepository roleRepository,
            IUserLocationRepository userLocationRepository)
        {
            _config = config;
            _userRepository = userRepository;
            _employeeRepository = employeeRepository;
            _userRoleRepository = userRoleRepository;
            _roleRepository = roleRepository;
            _userLocationRepository = userLocationRepository;
        }

        public async Task<bool> ValidateRoleAsync(string employeeId, Roles role)
        {
            try
            {
                var user = await _userRepository.GetUserByEmployeeId(employeeId);
                var roleEntity = await _roleRepository.GetByNameAsync(role);
                if (roleEntity == null) return false;
                return await _userRoleRepository.UserHasRoleAsync(user.Id, roleEntity.Id);
            }
            catch (KeyNotFoundException)
            {
                return false;
            }
        }

        public Task<string> GenerateTokenAsync(string employeeId, Roles role)
        {
            var jwtSettings = _config.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expireMinutes = int.Parse(jwtSettings["ExpireMinutes"]!);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, employeeId),
                new Claim(ClaimTypes.Role, role.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expireMinutes),
                signingCredentials: creds
            );

            return Task.FromResult(new JwtSecurityTokenHandler().WriteToken(token));
        }

        public async Task<AuthUserDTO> GetCurrentUserAsync(string employeeId)
        {
            var employee = await _employeeRepository.GetByIdAsync(employeeId)
                ?? throw new KeyNotFoundException($"Employee {employeeId} not found");

            var user = await _userRepository.GetUserByEmployeeId(employeeId);

            List<Domain.Entities.UserRole> activeRoles;
            try
            {
                activeRoles = await _userRoleRepository.GetUserActiveRolesAsync(user.Id);
            }
            catch (KeyNotFoundException)
            {
                activeRoles = new List<Domain.Entities.UserRole>();
            }

            var primaryRole = activeRoles.FirstOrDefault()?.Role.Name.ToString() ?? "";

            int locationId = 0;
            string location = "";
            try
            {
                var userLocation = await _userLocationRepository.GetUserActiveLocation(user.Id);
                locationId = userLocation.LocationId;
                location = userLocation.Location?.Name ?? "";
            }
            catch (KeyNotFoundException) { }

            return new AuthUserDTO(
                employeeId,
                primaryRole,
                $"{employee.FirstName} {employee.LastName}",
                locationId,
                location
            );
        }
    }
}
```

- [ ] **Step 3: Build the server to verify no errors**

```bash
cd NAFServer && dotnet build
```

Expected: Build succeeds with 0 errors.

---

### Task 2: Update client `AuthUser` type and fix login to fetch full user

**Files:**
- Modify: `NAFClient/src/shared/types/api/auth.ts`
- Modify: `NAFClient/src/features/auth/pages/AdminLoginPage.tsx`

- [ ] **Step 1: Add `locationId` and `location` to `AuthUser`**

Replace `NAFClient/src/shared/types/api/auth.ts`:

```ts
export interface AuthUser {
  employeeId: string;
  role: string;
  name: string;
  locationId: number;
  location: string;
}

export interface LoginRequest {
  employeeId: string;
}
```

- [ ] **Step 2: Update `AdminLoginPage.tsx` to call `me()` after login**

The `POST /auth/login/admin` response only contains `{ employeeId, role }`. Calling `authApi.me()` immediately after gives the full `AuthUser` including `locationId`.

Replace `NAFClient/src/features/auth/pages/AdminLoginPage.tsx`:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "../api";
import { useAuth } from "../AuthContext";

export default function AdminLoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await authApi.loginAdmin({ employeeId });
      const me = await authApi.me();
      setUser(me);
      navigate("/admin");
    } catch {
      setError("Invalid employee ID or unauthorized.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Enter your employee ID"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Verify client build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds. (TypeScript will flag `user.locationId` as valid now.)

---

### Task 3: Rewrite `features/admin/types.ts` and `features/admin/api.ts`

**Files:**
- Modify: `NAFClient/src/features/admin/types.ts`
- Modify: `NAFClient/src/features/admin/api.ts`

- [ ] **Step 1: Rewrite `src/features/admin/types.ts`**

```ts
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

export interface AddUserDTO {
  employeeId: string;
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

- [ ] **Step 2: Rewrite `src/features/admin/api.ts`**

```ts
import { api } from "@/shared/api/client";
import type { NAF } from "@/shared/types/api/naf";
import type {
  AddUserDTO,
  ForImplementationItemDTO,
  LocationDTO,
  UserDTO,
  UserRoleDetailDTO,
} from "./types";

export const adminApi = {
  // Admin user management
  getUsers: (locationId: number) =>
    api.get<UserDTO[]>(`/admin/users?locationId=${locationId}`).then((r) => r.data),

  addUser: (data: AddUserDTO) =>
    api.post("/admin/users", data).then((r) => r.data),

  // Location management (moved to /user-locations)
  getLocations: () =>
    api.get<LocationDTO[]>("/user-locations").then((r) => r.data),

  assignLocation: (userId: number, locationId: number) =>
    api.post(`/user-locations/${userId}/assign`, locationId).then((r) => r.data),

  // Role management (moved to /user-roles)
  getUserActiveRoles: (userId: number) =>
    api.get<UserRoleDetailDTO[]>(`/user-roles/${userId}/active`).then((r) => r.data),

  removeRole: (userId: number, roleId: number) =>
    api.delete(`/user-roles/${userId}/remove/${roleId}`).then((r) => r.data),

  // Implementation endpoints (unchanged)
  getMyTasks: () =>
    api.get<NAF[]>("/implementations/my-tasks").then((r) => r.data),

  getForImplementations: () =>
    api.get<NAF[]>("/implementations/for-implementations").then((r) => r.data),

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

- [ ] **Step 3: Verify build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds. (The old hooks still compile since they haven't been updated yet — TypeScript errors will appear there, but the api.ts itself is valid.)

---

### Task 4: Rewrite `useAdminLocations` hook

**Files:**
- Modify: `NAFClient/src/features/admin/hooks/useAdminLocations.ts`

- [ ] **Step 1: Rewrite the hook**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";
import { toast } from "sonner";

export function useAdminLocations() {
  const queryClient = useQueryClient();

  const locationsQuery = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: adminApi.getLocations,
  });

  const assignLocationMutation = useMutation({
    mutationFn: ({ userId, locationId }: { userId: number; locationId: number }) =>
      adminApi.assignLocation(userId, locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Location assigned");
    },
    onError: () => toast.error("Failed to assign location"),
  });

  return { locationsQuery, assignLocationMutation };
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds (or errors only in the pages/hooks not yet updated).

---

### Task 5: Rewrite `useAdminUsers` hook

**Files:**
- Modify: `NAFClient/src/features/admin/hooks/useAdminUsers.ts`

The hook accepts `locationId: number | null`. When `null`, it fetches all locations first then fans out one query per location using `useQueries`. The `removeRoleMutation` fetches active roles internally to resolve `roleId` from a role name string.

- [ ] **Step 1: Rewrite the hook**

```ts
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";
import type { AddUserDTO, UserDTO } from "../types";
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

  const addUserMutation = useMutation({
    mutationFn: (data: AddUserDTO) => adminApi.addUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User added");
    },
    onError: () => toast.error("Failed to add user"),
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

  return { users, isLoading, addUserMutation, removeRoleMutation };
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds (or errors only in pages not yet updated).

---

### Task 6: Rewrite `RolesPage.tsx`

**Files:**
- Modify: `NAFClient/src/features/admin/pages/RolesPage.tsx`

The page reads `user.locationId` from auth context for the default filter. A "View All" toggle switches `locationId` to `null`. The "Add User" form selects a location from the loaded `LocationDTO[]` list. User cards display `firstName`/`lastName` and `roles: string[]`. Removing a role passes `userId` (number) and `roleName` (string) to the hook — the hook resolves `roleId` internally.

- [ ] **Step 1: Rewrite the page**

```tsx
import { useState } from "react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/AuthContext";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useAdminLocations } from "../hooks/useAdminLocations";
import type { AddUserDTO } from "../types";

const ROLES = ["ADMIN", "TECHNICAL_TEAM", "REQUESTOR_APPROVER"];

export default function RolesPage() {
  const { user } = useAuth();
  const [viewAll, setViewAll] = useState(false);
  const locationId = viewAll ? null : (user?.locationId ?? null);

  const { users, isLoading, addUserMutation, removeRoleMutation } = useAdminUsers(locationId);
  const { locationsQuery } = useAdminLocations();

  const [form, setForm] = useState<AddUserDTO>({ employeeId: "", role: "", locationId: user?.locationId ?? 0 });
  const [formError, setFormError] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      await addUserMutation.mutateAsync(form);
      setForm({ employeeId: "", role: "", locationId: user?.locationId ?? 0 });
    } catch {
      setFormError("Failed to add user. Check the employee ID and role.");
    }
  };

  const handleRemoveRole = (userId: number, roleName: string) => {
    removeRoleMutation.mutate({ userId, roleName });
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-amber-500">Roles Management</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewAll((v) => !v)}
        >
          {viewAll ? "My Location" : "View All"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add User Role</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end flex-wrap">
            <div className="flex flex-col gap-1">
              <Label>Employee ID</Label>
              <Input
                value={form.employeeId}
                onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                placeholder="Employee ID"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Role</Label>
              <select
                className="border rounded px-3 py-2 text-sm"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                required
              >
                <option value="">Select role</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Location</Label>
              <select
                className="border rounded px-3 py-2 text-sm"
                value={form.locationId}
                onChange={(e) => setForm((f) => ({ ...f, locationId: Number(e.target.value) }))}
                required
              >
                <option value={0}>Select location</option>
                {locationsQuery.data?.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={addUserMutation.isPending}>
              {addUserMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </form>
          {formError && <p className="text-sm text-red-500 mt-2">{formError}</p>}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading && <p className="text-muted-foreground">Loading...</p>}
        {users.map((u) => (
          <Card key={u.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-semibold">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-muted-foreground">{u.employeeId} · {u.location}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {u.roles.map((roleName) => (
                    <div key={roleName} className="flex items-center gap-1">
                      <Badge variant="secondary">{roleName}</Badge>
                      <button
                        className="text-red-400 hover:text-red-600 text-xs ml-1"
                        onClick={() => handleRemoveRole(u.id, roleName)}
                        disabled={removeRoleMutation.isPending}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds (or errors only in `LocationsPage` not yet updated).

---

### Task 7: Rewrite `LocationsPage.tsx`

**Files:**
- Modify: `NAFClient/src/features/admin/pages/LocationsPage.tsx`

The assign form lets the admin pick a user from the loaded list (select by `id`) and a location from `LocationDTO[]`. Default view shows the admin's own location; "View All" shows all.

- [ ] **Step 1: Rewrite the page**

```tsx
import { useState } from "react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/AuthContext";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useAdminLocations } from "../hooks/useAdminLocations";

export default function LocationsPage() {
  const { user } = useAuth();
  const [viewAll, setViewAll] = useState(false);
  const locationId = viewAll ? null : (user?.locationId ?? null);

  const { users, isLoading } = useAdminUsers(locationId);
  const { locationsQuery, assignLocationMutation } = useAdminLocations();

  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [selectedLocationId, setSelectedLocationId] = useState<number | "">("");
  const [formError, setFormError] = useState("");

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!selectedUserId || !selectedLocationId) return;
    try {
      await assignLocationMutation.mutateAsync({
        userId: selectedUserId as number,
        locationId: selectedLocationId as number,
      });
      setSelectedUserId("");
      setSelectedLocationId("");
    } catch {
      setFormError("Failed to assign location.");
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-amber-500">Locations Management</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewAll((v) => !v)}
        >
          {viewAll ? "My Location" : "View All"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assign Location to Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAssign} className="flex flex-col gap-3 sm:flex-row sm:items-end flex-wrap">
            <div className="flex flex-col gap-1">
              <Label>Employee</Label>
              <select
                className="border rounded px-3 py-2 text-sm"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : "")}
                required
              >
                <option value="">Select employee</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.employeeId})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Location</Label>
              <select
                className="border rounded px-3 py-2 text-sm"
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value ? Number(e.target.value) : "")}
                required
              >
                <option value="">Select location</option>
                {locationsQuery.data?.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={assignLocationMutation.isPending}>
              {assignLocationMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
          </form>
          {formError && <p className="text-sm text-red-500 mt-2">{formError}</p>}
        </CardContent>
      </Card>

      <div>
        <h2 className="font-semibold mb-3">Available Locations</h2>
        {locationsQuery.isLoading && <p className="text-muted-foreground">Loading...</p>}
        <div className="flex flex-wrap gap-2">
          {locationsQuery.data?.map((loc) => (
            <span key={loc.id} className="border rounded px-3 py-1 text-sm">{loc.name}</span>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-3">
          {viewAll ? "All Users" : `Users in ${user?.location ?? "your location"}`}
        </h2>
        {isLoading && <p className="text-muted-foreground">Loading...</p>}
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between border-b py-2 text-sm">
            <span className="font-medium">{u.firstName} {u.lastName}</span>
            <span className="text-muted-foreground">{u.location}</span>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Verify full build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds with 0 errors.

---

### Task 8: Commit

- [ ] **Step 1: Stage and commit all changes**

```bash
git add NAFServer/src/Application/DTOs/Auth/AuthUserDTO.cs
git add NAFServer/src/Application/Services/AuthService.cs
git add NAFClient/src/shared/types/api/auth.ts
git add NAFClient/src/features/auth/pages/AdminLoginPage.tsx
git add NAFClient/src/features/admin/types.ts
git add NAFClient/src/features/admin/api.ts
git add NAFClient/src/features/admin/hooks/useAdminLocations.ts
git add NAFClient/src/features/admin/hooks/useAdminUsers.ts
git add NAFClient/src/features/admin/pages/RolesPage.tsx
git add NAFClient/src/features/admin/pages/LocationsPage.tsx
git commit -m "feat: comply admin client with new server API — location-scoped user views"
```
