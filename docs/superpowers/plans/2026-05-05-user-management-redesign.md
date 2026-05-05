# User Management Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the separate Roles and Locations admin tabs with a single unified Users tab that handles user creation, list view, detail view, and role/location management.

**Architecture:** Extract a new `useAdminAllUsers` hook (fan-out across all locations, deduplicate) to share between `UsersPage` and `UserDetailPage`. `UsersPage` shows a searchable table of all users; `UserDetailPage` shows employee info plus inline role and location management. The old `RolesPage` and `LocationsPage` are deleted; their routes are replaced.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, ShadCN, React Query (@tanstack/react-query), React Router v6, Sonner (toast), Lucide React icons.

---

## Files Changed

| Action  | File                                                                 |
|---------|----------------------------------------------------------------------|
| Modify  | `NAFClient/src/app/routesEnum.ts`                                    |
| Modify  | `NAFClient/src/app/router.tsx`                                       |
| Modify  | `NAFClient/src/shared/components/layout/AdminLayout.tsx`             |
| Add     | `NAFClient/src/features/admin/hooks/useAdminAllUsers.ts`             |
| Modify  | `NAFClient/src/features/admin/hooks/useAdminUsers.ts`                |
| Modify  | `NAFClient/src/features/admin/hooks/useAdminLocations.ts`            |
| Add     | `NAFClient/src/features/admin/pages/UsersPage.tsx`                   |
| Add     | `NAFClient/src/features/admin/pages/UserDetailPage.tsx`              |
| Delete  | `NAFClient/src/features/admin/pages/RolesPage.tsx`                   |
| Delete  | `NAFClient/src/features/admin/pages/LocationsPage.tsx`               |

---

## Task 1: Update routesEnum.ts

**Files:**
- Modify: `NAFClient/src/app/routesEnum.ts`

- [ ] **Step 1: Add ADMIN_USER_DETAIL and remove ADMIN_ROLES / ADMIN_LOCATIONS**

Replace the relevant lines so the enum reads:

```typescript
export enum RoutesEnum {
  // Login routes
  LOGIN_REQUESTOR = "/login",
  LOGIN_ADMIN = "/login/admin",
  LOGIN_TECH = "/login/tech",

  // Requestor/Approver routes
  NAF = "/NAF",

  // Admin routes
  ADMIN = "/admin",
  ADMIN_FOR_IMPLEMENTATIONS = "/admin/for-implementations",
  ADMIN_NAF = "/admin/NAF",
  ADMIN_NAF_DETAIL = "/admin/NAF/:nafId",
  ADMIN_IMPLEMENTATION_DETAIL = "/admin/for-implementations/:nafId",
  ADMIN_USERS = "/admin/users",
  ADMIN_USER_DETAIL = "/admin/users/:userId",

  // Technical Team routes
  TECH = "/tech",
  TECH_MY_TASKS = "/tech/my-tasks",
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd NAFClient && npm run build 2>&1 | head -30
```

Expected: no errors related to `ADMIN_ROLES` or `ADMIN_LOCATIONS` (they're only used in router.tsx and AdminLayout.tsx — those get updated in later tasks).

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/app/routesEnum.ts
git commit -m "refactor: add ADMIN_USER_DETAIL route, remove ADMIN_ROLES and ADMIN_LOCATIONS"
```

---

## Task 2: Create useAdminAllUsers hook

**Files:**
- Create: `NAFClient/src/features/admin/hooks/useAdminAllUsers.ts`

- [ ] **Step 1: Create the hook**

```typescript
import { useQueries, useQuery } from "@tanstack/react-query";
import { adminApi } from "../api";
import type { UserDTO } from "../types";

export function useAdminAllUsers() {
  const locationsQuery = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: adminApi.getLocations,
  });

  const locationIds = locationsQuery.data?.map((l) => l.id) ?? [];

  const perLocationQueries = useQueries({
    queries: locationIds.map((id) => ({
      queryKey: ["admin", "users", id],
      queryFn: () => adminApi.getUsers(id),
    })),
  });

  const users: UserDTO[] = [
    ...new Map(
      perLocationQueries.flatMap((q) => q.data ?? []).map((u) => [u.id, u])
    ).values(),
  ];

  const isLoading =
    locationsQuery.isLoading || perLocationQueries.some((q) => q.isLoading);

  return { users, isLoading, locationsQuery };
}
```

- [ ] **Step 2: Commit**

```bash
git add NAFClient/src/features/admin/hooks/useAdminAllUsers.ts
git commit -m "feat: add useAdminAllUsers hook"
```

---

## Task 3: Simplify useAdminUsers and useAdminLocations

**Files:**
- Modify: `NAFClient/src/features/admin/hooks/useAdminUsers.ts`
- Modify: `NAFClient/src/features/admin/hooks/useAdminLocations.ts`

- [ ] **Step 1: Rewrite useAdminUsers.ts**

The hook no longer needs a `locationId` parameter or fan-out logic. It only exposes mutations:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";
import type { AssignRoleDTO } from "../types";
import { toast } from "sonner";

export function useAdminUsers() {
  const queryClient = useQueryClient();

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

  return { assignRoleMutation, removeRoleMutation };
}
```

- [ ] **Step 2: Rewrite useAdminLocations.ts — remove allUsers logic**

```typescript
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

  const removeLocationMutation = useMutation({
    mutationFn: ({ userId, locationId }: { userId: number; locationId: number }) =>
      adminApi.removeLocation(userId, locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Location removed");
    },
    onError: () => toast.error("Failed to remove location"),
  });

  return { locationsQuery, assignLocationMutation, removeLocationMutation };
}
```

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/admin/hooks/useAdminUsers.ts NAFClient/src/features/admin/hooks/useAdminLocations.ts
git commit -m "refactor: simplify useAdminUsers and useAdminLocations"
```

---

## Task 4: Create UsersPage

**Files:**
- Create: `NAFClient/src/features/admin/pages/UsersPage.tsx`

- [ ] **Step 1: Create UsersPage.tsx**

```typescript
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminAllUsers } from "../hooks/useAdminAllUsers";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useAdminLocations } from "../hooks/useAdminLocations";
import { searchEmployees } from "@/shared/api/employeeService";
import type { Employee } from "@/shared/types/api/employee";
import { RoutesEnum } from "@/app/routesEnum";

const ROLES = ["ADMIN", "MANAGEMENT", "REQUESTOR_APPROVER", "HR"];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-amber-100 text-amber-800 border border-amber-200",
  MANAGEMENT: "bg-blue-100 text-blue-800 border border-blue-200",
  HR: "bg-green-100 text-green-800 border border-green-200",
  REQUESTOR_APPROVER: "bg-slate-100 text-slate-700 border border-slate-200",
};

export default function UsersPage() {
  const navigate = useNavigate();
  const { users, isLoading } = useAdminAllUsers();
  const { assignRoleMutation } = useAdminUsers();
  const { locationsQuery } = useAdminLocations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState("");
  const [formLocationId, setFormLocationId] = useState(0);
  const [formError, setFormError] = useState("");

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

  const [search, setSearch] = useState("");
  const filtered = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.employeeId}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const resetDialog = () => {
    setEmployeeId("");
    setRole("");
    setFormLocationId(0);
    setEmpLookup({ state: "idle", employee: null });
    setFormError("");
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (empLookup.state !== "found") {
      setFormError("Employee not found. Please enter a valid employee ID.");
      return;
    }
    if (!formLocationId) {
      setFormError("Please select a location.");
      return;
    }
    if (!role) {
      setFormError("Please select a role.");
      return;
    }
    try {
      await assignRoleMutation.mutateAsync({ employeeId, role, locationId: formLocationId });
      resetDialog();
      setDialogOpen(false);
    } catch {
      setFormError("Failed to add user. Check the employee ID and try again.");
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-amber-500">Users Management</h1>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetDialog();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">Add User</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAssign} className="flex flex-col gap-4 mt-4">
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
                {assignRoleMutation.isPending ? "Adding…" : "Add User"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Input
        placeholder="Search by name or ID…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm mb-4"
      />

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {!isLoading && filtered.length === 0 && (
        <p className="text-muted-foreground text-sm">
          {search ? "No users match your search." : "No users found."}
        </p>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Roles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    navigate(RoutesEnum.ADMIN_USER_DETAIL.replace(":userId", String(u.id)))
                  }
                >
                  <TableCell className="font-medium">
                    {u.firstName} {u.lastName}
                  </TableCell>
                  <TableCell>{u.employeeId}</TableCell>
                  <TableCell>{u.department}</TableCell>
                  <TableCell>{u.location || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <span
                          key={r}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[r] ?? "bg-gray-100 text-gray-700 border border-gray-200"}`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add NAFClient/src/features/admin/pages/UsersPage.tsx
git commit -m "feat: add UsersPage"
```

---

## Task 5: Create UserDetailPage

**Files:**
- Create: `NAFClient/src/features/admin/pages/UserDetailPage.tsx`

- [ ] **Step 1: Create UserDetailPage.tsx**

```typescript
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminAllUsers } from "../hooks/useAdminAllUsers";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useAdminLocations } from "../hooks/useAdminLocations";
import { RoutesEnum } from "@/app/routesEnum";

const ROLES = ["ADMIN", "MANAGEMENT", "REQUESTOR_APPROVER", "HR"];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-amber-100 text-amber-800 border border-amber-200",
  MANAGEMENT: "bg-blue-100 text-blue-800 border border-blue-200",
  HR: "bg-green-100 text-green-800 border border-green-200",
  REQUESTOR_APPROVER: "bg-slate-100 text-slate-700 border border-slate-200",
};

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { users, isLoading, locationsQuery } = useAdminAllUsers();
  const { assignRoleMutation, removeRoleMutation } = useAdminUsers();
  const { assignLocationMutation, removeLocationMutation } = useAdminLocations();

  const user = users.find((u) => u.id === Number(userId));

  // Role removal confirmation
  const [pendingRemoveRole, setPendingRemoveRole] = useState<string | null>(null);

  // Location editing
  const [locationEditing, setLocationEditing] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState(0);

  // Add role
  const [addRoleValue, setAddRoleValue] = useState("");

  const availableRoles = ROLES.filter((r) => !user?.roles.includes(r));

  const handleRemoveRole = async (roleName: string) => {
    if (!user) return;
    await removeRoleMutation.mutateAsync({ userId: user.id, roleName });
    setPendingRemoveRole(null);
  };

  const handleAddRole = async () => {
    if (!user || !addRoleValue) return;
    await assignRoleMutation.mutateAsync({
      employeeId: user.employeeId,
      role: addRoleValue,
      locationId: user.locationId,
    });
    setAddRoleValue("");
  };

  const handleChangeLocation = async () => {
    if (!user || !selectedLocationId) return;
    if (user.locationId) {
      await removeLocationMutation.mutateAsync({ userId: user.id, locationId: user.locationId });
    }
    await assignLocationMutation.mutateAsync({ userId: user.id, locationId: selectedLocationId });
    setLocationEditing(false);
    setSelectedLocationId(0);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground text-sm">Loading…</p>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground text-sm">User not found.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <button
          className="text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1"
          onClick={() => navigate(RoutesEnum.ADMIN_USERS)}
        >
          ← Users
        </button>
        <h1 className="text-2xl font-bold">
          {user.firstName} {user.lastName}
        </h1>
      </div>

      <div className="grid gap-4 max-w-2xl">
        {/* Employee Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Employee Info</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Full Name</span>
            <span>{user.firstName} {user.middleName ? user.middleName + " " : ""}{user.lastName}</span>
            <span className="text-muted-foreground">Employee ID</span>
            <span>{user.employeeId}</span>
            <span className="text-muted-foreground">Position</span>
            <span>{user.position}</span>
            <span className="text-muted-foreground">Department</span>
            <span>{user.department}</span>
            <span className="text-muted-foreground">Company</span>
            <span>{user.company}</span>
          </CardContent>
        </Card>

        {/* Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {user.roles.map((roleName) => {
                const isPending = pendingRemoveRole === roleName;
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
                          onClick={() => handleRemoveRole(roleName)}
                          disabled={removeRoleMutation.isPending}
                        >
                          Yes
                        </button>
                        <button
                          className="text-muted-foreground hover:underline"
                          onClick={() => setPendingRemoveRole(null)}
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        className="text-red-400 hover:text-red-600 text-xs ml-0.5"
                        title={`Remove ${roleName}`}
                        onClick={() => setPendingRemoveRole(roleName)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
              {user.roles.length === 0 && (
                <span className="text-muted-foreground text-sm">No roles assigned.</span>
              )}
            </div>

            {availableRoles.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  className="border rounded px-3 py-1.5 text-sm"
                  value={addRoleValue}
                  onChange={(e) => setAddRoleValue(e.target.value)}
                >
                  <option value="">Add role…</option>
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!addRoleValue || assignRoleMutation.isPending}
                  onClick={handleAddRole}
                >
                  Add
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.locationId ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                  {user.location}
                </span>
                {!locationEditing && (
                  <Button size="sm" variant="outline" onClick={() => setLocationEditing(true)}>
                    Change
                  </Button>
                )}
              </div>
            ) : (
              !locationEditing && (
                <Button size="sm" variant="outline" onClick={() => setLocationEditing(true)}>
                  Assign Location
                </Button>
              )
            )}

            {locationEditing && (
              <div className="flex items-center gap-2">
                <select
                  className="border rounded px-3 py-1.5 text-sm"
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(Number(e.target.value))}
                >
                  <option value={0}>Select location…</option>
                  {locationsQuery.data?.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  disabled={!selectedLocationId || assignLocationMutation.isPending || removeLocationMutation.isPending}
                  onClick={handleChangeLocation}
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setLocationEditing(false);
                    setSelectedLocationId(0);
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add NAFClient/src/features/admin/pages/UserDetailPage.tsx
git commit -m "feat: add UserDetailPage"
```

---

## Task 6: Update AdminLayout nav

**Files:**
- Modify: `NAFClient/src/shared/components/layout/AdminLayout.tsx`

- [ ] **Step 1: Replace Roles + Locations nav items with Users**

Replace the file contents with:

```typescript
import { Home, Users, FileText, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import Layout from "./Layout";
import { useAuth } from "@/features/auth/AuthContext";

const navItems = [
  { label: "Home", icon: <Home className="w-5 h-5" />, href: "/admin" },
  { label: "NAFs", icon: <FileText className="w-5 h-5" />, href: "/admin/NAF" },
  { label: "Implementations", icon: <Wrench className="w-5 h-5" />, href: "/admin/for-implementations" },
  { label: "Users", icon: <Users className="w-5 h-5" />, href: "/admin/users" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <Layout navItems={navItems} currentUser={{ name: user?.name ?? "Admin" }}>
      {children}
    </Layout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add NAFClient/src/shared/components/layout/AdminLayout.tsx
git commit -m "refactor: replace Roles/Locations nav with Users in AdminLayout"
```

---

## Task 7: Update router.tsx and delete old pages

**Files:**
- Modify: `NAFClient/src/app/router.tsx`
- Delete: `NAFClient/src/features/admin/pages/RolesPage.tsx`
- Delete: `NAFClient/src/features/admin/pages/LocationsPage.tsx`

- [ ] **Step 1: Update router.tsx**

Replace the full file with:

```typescript
import { Routes, Route, Navigate } from "react-router-dom";
import { RoutesEnum } from "./routesEnum";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";

const ViewAllNAF = lazy(() => import("@/features/naf/pages/ViewAllNAF"));
const NAFDetailPage = lazy(() => import("@/features/naf/pages/ViewNAFDetail"));

const AdminLoginPage = lazy(
  () => import("@/features/auth/pages/AdminLoginPage"),
);
const RequestorLoginPage = lazy(
  () => import("@/features/auth/pages/RequestorLoginPage"),
);

const AdminHomePage = lazy(
  () => import("@/features/admin/pages/AdminHomePage"),
);
const UsersPage = lazy(() => import("@/features/admin/pages/UsersPage"));
const UserDetailPage = lazy(
  () => import("@/features/admin/pages/UserDetailPage"),
);
const AdminNAFListPage = lazy(
  () => import("@/features/admin/pages/AdminNAFListPage"),
);
const AdminNAFDetailPage = lazy(
  () => import("@/features/admin/pages/AdminNAFDetailPage"),
);
const ForImplementationsPage = lazy(
  () => import("@/features/admin/pages/ForImplementationsPage"),
);
const AdminImplementationDetailPage = lazy(
  () => import("@/features/admin/pages/AdminImplementationDetailPage"),
);

export function AppRouter() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* Login routes */}
        <Route path={RoutesEnum.LOGIN_ADMIN} element={<AdminLoginPage />} />
        <Route
          path={RoutesEnum.LOGIN_REQUESTOR}
          element={<RequestorLoginPage />}
        />

        {/* Requestor/Approver routes */}
        <Route
          path={RoutesEnum.NAF}
          element={
            <ProtectedRoute
              requiredRole="REQUESTOR_APPROVER"
              loginPath={RoutesEnum.LOGIN_REQUESTOR}
            >
              <ViewAllNAF />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${RoutesEnum.NAF}/:nafId`}
          element={
            <ProtectedRoute
              requiredRole="REQUESTOR_APPROVER"
              loginPath={RoutesEnum.LOGIN_REQUESTOR}
            >
              <NAFDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path={RoutesEnum.ADMIN}
          element={
            <ProtectedRoute
              requiredRole="ADMIN"
              loginPath={RoutesEnum.LOGIN_ADMIN}
            >
              <AdminHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_NAF}
          element={
            <ProtectedRoute
              requiredRole="ADMIN"
              loginPath={RoutesEnum.LOGIN_ADMIN}
            >
              <AdminNAFListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_NAF_DETAIL}
          element={
            <ProtectedRoute
              requiredRole="ADMIN"
              loginPath={RoutesEnum.LOGIN_ADMIN}
            >
              <AdminNAFDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_FOR_IMPLEMENTATIONS}
          element={
            <ProtectedRoute
              requiredRole="ADMIN"
              loginPath={RoutesEnum.LOGIN_ADMIN}
            >
              <ForImplementationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_IMPLEMENTATION_DETAIL}
          element={
            <ProtectedRoute
              requiredRole="ADMIN"
              loginPath={RoutesEnum.LOGIN_ADMIN}
            >
              <AdminImplementationDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_USERS}
          element={
            <ProtectedRoute
              requiredRole="ADMIN"
              loginPath={RoutesEnum.LOGIN_ADMIN}
            >
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_USER_DETAIL}
          element={
            <ProtectedRoute
              requiredRole="ADMIN"
              loginPath={RoutesEnum.LOGIN_ADMIN}
            >
              <UserDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to={RoutesEnum.LOGIN_REQUESTOR} replace />}
        />
      </Routes>
    </Suspense>
  );
}
```

- [ ] **Step 2: Delete old pages**

```bash
rm NAFClient/src/features/admin/pages/RolesPage.tsx
rm NAFClient/src/features/admin/pages/LocationsPage.tsx
```

- [ ] **Step 3: Verify TypeScript build passes**

```bash
cd NAFClient && npm run build 2>&1 | tail -20
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: replace Roles/Locations pages with unified Users + UserDetail pages"
```

---

## Self-Review

**Spec coverage check:**
- [x] Navigation: Roles/Locations nav items removed, Users added → Task 6
- [x] Routes: ADMIN_ROLES/ADMIN_LOCATIONS removed, ADMIN_USERS/ADMIN_USER_DETAIL added → Tasks 1, 7
- [x] Pages deleted: RolesPage, LocationsPage → Task 7
- [x] UsersPage: header, search, table with 5 columns, Add User dialog with debounced lookup → Task 4
- [x] UserDetailPage: back link, employee info card, roles section with remove + add, location section → Task 5
- [x] useAdminAllUsers hook: fan-out across all locations, deduplicate, return users + isLoading + locationsQuery → Task 2
- [x] useAdminUser(userId): derived from useAdminAllUsers — implemented inline in UserDetailPage (spec says no new backend endpoint required; the pattern is `users.find(u => u.id === userId)`) 
- [x] useAdminUsers simplified: Task 3
- [x] useAdminLocations allUsers logic removed: Task 3
- [x] Mutations reused from hooks: assignRoleMutation, removeRoleMutation, assignLocationMutation, removeLocationMutation all used correctly

**Placeholder scan:** None found.

**Type consistency:** `UserDTO`, `AssignRoleDTO`, `LocationDTO` all sourced from `../types`. Method signatures (`assignRoleMutation.mutateAsync`, `removeRoleMutation.mutateAsync`, etc.) are consistent across all tasks.
