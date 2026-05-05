# Users Page Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three issues in the Users admin pages: switch the table to DataTable for UI uniformity, guard the Add Role action against users with no location, and ensure mutations update the page reactively without a reload.

**Architecture:** Two files changed — `UsersPage.tsx` gets the `DataTable` component and `space-y-4` wrapper replacing the raw table; `UserDetailPage.tsx` gets a guard on `handleAddRole` that blocks the call when `user.locationId` is 0. No new files, no new hooks, no backend changes.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, ShadCN, `@tanstack/react-table` (ColumnDef), `@tanstack/react-query`.

---

## Files Changed

| Action | File |
|--------|------|
| Modify | `NAFClient/src/features/admin/pages/UsersPage.tsx` |
| Modify | `NAFClient/src/features/admin/pages/UserDetailPage.tsx` |

---

## Task 1: Rewrite UsersPage to use DataTable

**Files:**
- Modify: `NAFClient/src/features/admin/pages/UsersPage.tsx`

- [ ] **Step 1: Replace the file with the DataTable version**

Replace the full contents of `NAFClient/src/features/admin/pages/UsersPage.tsx` with:

```tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
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
import { DataTable } from "@/shared/components/ui/datatable";
import { useAdminAllUsers } from "../hooks/useAdminAllUsers";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useAdminLocations } from "../hooks/useAdminLocations";
import { searchEmployees } from "@/shared/api/employeeService";
import type { Employee } from "@/shared/types/api/employee";
import type { UserDTO } from "../types";
import { RoutesEnum } from "@/app/routesEnum";

const ROLES = ["ADMIN", "MANAGEMENT", "REQUESTOR_APPROVER", "HR"];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-amber-100 text-amber-800 border border-amber-200",
  MANAGEMENT: "bg-blue-100 text-blue-800 border border-blue-200",
  HR: "bg-green-100 text-green-800 border border-green-200",
  REQUESTOR_APPROVER: "bg-slate-100 text-slate-700 border border-slate-200",
};

const columns: ColumnDef<UserDTO>[] = [
  {
    accessorKey: "firstName",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.firstName} {row.original.lastName}
      </span>
    ),
  },
  {
    accessorKey: "employeeId",
    header: "Employee ID",
  },
  {
    accessorKey: "department",
    header: "Department",
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => row.original.location || "—",
  },
  {
    accessorKey: "roles",
    header: "Roles",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.roles.map((r) => (
          <span
            key={r}
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[r] ?? "bg-gray-100 text-gray-700 border border-gray-200"}`}
          >
            {r}
          </span>
        ))}
      </div>
    ),
  },
];

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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
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
          className="max-w-sm"
        />

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          onRowClick={(u) =>
            navigate(RoutesEnum.ADMIN_USER_DETAIL.replace(":userId", String(u.id)))
          }
          emptyMessage={search ? "No users match your search." : "No users found."}
        />
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd NAFClient && npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...`

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/admin/pages/UsersPage.tsx
git commit -m "feat: switch UsersPage to DataTable with space-y-4 layout"
```

---

## Task 2: Guard handleAddRole in UserDetailPage

**Files:**
- Modify: `NAFClient/src/features/admin/pages/UserDetailPage.tsx`

The `handleAddRole` function passes `locationId: user.locationId` to `assignRoleMutation`. When `user.locationId` is `0` (user has no location assigned), the backend call `AddUserCurrentLocation(userId, 0)` can throw a DB constraint error that propagates past the `catch (KeyNotFoundException)` block and causes the request to fail silently or error. Guard this by blocking the Add Role action and showing an inline message when location is not set.

- [ ] **Step 1: Add addRoleError state and update handleAddRole**

Replace the `addRoleValue` state declaration and `handleAddRole` function (lines 33 and 43–51) with:

```tsx
  const [addRoleValue, setAddRoleValue] = useState("");
  const [addRoleError, setAddRoleError] = useState("");

  const handleAddRole = async () => {
    if (!user || !addRoleValue) return;
    if (!user.locationId) {
      setAddRoleError("Assign a location to this user before adding a role.");
      return;
    }
    setAddRoleError("");
    await assignRoleMutation.mutateAsync({
      employeeId: user.employeeId,
      role: addRoleValue,
      locationId: user.locationId,
    });
    setAddRoleValue("");
  };
```

- [ ] **Step 2: Render addRoleError below the Add Role row**

The existing "Add Role" UI block (lines 165–186) currently ends with `</div>` after the Add button. Add the error message inside that block, right after the `<Button>`:

```tsx
            {availableRoles.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <select
                    className="border rounded px-3 py-1.5 text-sm"
                    value={addRoleValue}
                    onChange={(e) => {
                      setAddRoleValue(e.target.value);
                      setAddRoleError("");
                    }}
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
                {addRoleError && (
                  <p className="text-xs text-red-500">{addRoleError}</p>
                )}
              </div>
            )}
```

- [ ] **Step 3: Verify build passes**

```bash
cd NAFClient && npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...`

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/features/admin/pages/UserDetailPage.tsx
git commit -m "fix: guard handleAddRole against missing location in UserDetailPage"
```

---

## Self-Review

**Spec coverage:**
- [x] Section 1 (UI uniformity): `space-y-4` wrapper, `DataTable` with `ColumnDef<UserDTO>[]`, skeleton loading, row click → Task 1
- [x] Section 2 (401 fix): guard `handleAddRole` when `user.locationId === 0`, show inline error → Task 2
- [x] Section 3 (reactive updates): `DataTable` keeps existing rows visible during React Query background refetch (`isLoading = false` during refetch, only `isFetching = true`) → covered by Task 1; no separate task needed

**Placeholder scan:** None found.

**Type consistency:** `UserDTO` from `../types` used in `ColumnDef<UserDTO>[]`. `user.locationId` (`number`) compared to `0` — correct. `setAddRoleError` / `addRoleError` match across steps.
