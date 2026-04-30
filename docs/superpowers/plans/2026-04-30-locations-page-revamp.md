# Locations Page Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revise `LocationsPage.tsx` to match the UI/UX pattern of `RolesPage.tsx` — Dialog-based assign form with employee ID lookup, Card list with search, and inline remove confirmation for locations.

**Architecture:** Three sequential changes: add the missing `removeLocation` API call, extend the `useAdminLocations` hook with a remove mutation and an all-users cross-reference list, then fully rewrite `LocationsPage.tsx` using the new hook surface and the same component structure as `RolesPage.tsx`.

**Tech Stack:** React 19, TypeScript, TanStack Query, ShadCN (Dialog, Card, Input, Button, Label), Sonner toasts, Tailwind CSS v4.

---

## File Map

| File | Change |
|---|---|
| `NAFClient/src/features/admin/api.ts` | Add `removeLocation` |
| `NAFClient/src/features/admin/hooks/useAdminLocations.ts` | Add `allUsers`, `removeLocationMutation` |
| `NAFClient/src/features/admin/pages/LocationsPage.tsx` | Full rewrite |

---

## Task 1: Add `removeLocation` to `adminApi`

**Files:**
- Modify: `NAFClient/src/features/admin/api.ts`

- [ ] **Step 1: Add the API call**

Open `NAFClient/src/features/admin/api.ts`. After the `assignLocation` entry, add:

```ts
  removeLocation: (userId: number, locationId: number) =>
    api.delete(`/user-locations/${userId}/remove/${locationId}`).then((r) => r.data),
```

The full `adminApi` object after the change (relevant section):

```ts
  // Location management
  getLocations: () =>
    api.get<LocationDTO[]>("/user-locations").then((r) => r.data),

  assignLocation: (userId: number, locationId: number) =>
    api.post(`/user-locations/${userId}/assign`, locationId).then((r) => r.data),

  removeLocation: (userId: number, locationId: number) =>
    api.delete(`/user-locations/${userId}/remove/${locationId}`).then((r) => r.data),
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd NAFClient && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/admin/api.ts
git commit -m "feat: add removeLocation to adminApi"
```

---

## Task 2: Extend `useAdminLocations` hook

**Files:**
- Modify: `NAFClient/src/features/admin/hooks/useAdminLocations.ts`

The hook needs two additions:
1. `allUsers: UserDTO[]` — flat list of every user across all locations, used by `LocationsPage` to cross-reference an employee search result against existing system accounts.
2. `removeLocationMutation` — calls `adminApi.removeLocation`, invalidates user queries, shows toast.

- [ ] **Step 1: Replace the hook file**

Replace the entire contents of `NAFClient/src/features/admin/hooks/useAdminLocations.ts` with:

```ts
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";
import type { UserDTO } from "../types";
import { toast } from "sonner";

export function useAdminLocations() {
  const queryClient = useQueryClient();

  const locationsQuery = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: adminApi.getLocations,
  });

  // Fetch all users across every location for the assign dialog cross-reference.
  const locationIds = locationsQuery.data?.map((l) => l.id) ?? [];
  const perLocationQueries = useQueries({
    queries: locationIds.map((id) => ({
      queryKey: ["admin", "users", id],
      queryFn: () => adminApi.getUsers(id),
    })),
  });
  const allUsers: UserDTO[] = perLocationQueries.flatMap((q) => q.data ?? []);

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

  return { locationsQuery, allUsers, assignLocationMutation, removeLocationMutation };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd NAFClient && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/admin/hooks/useAdminLocations.ts
git commit -m "feat: add allUsers and removeLocationMutation to useAdminLocations"
```

---

## Task 3: Rewrite `LocationsPage.tsx`

**Files:**
- Modify: `NAFClient/src/features/admin/pages/LocationsPage.tsx`

This is a full replacement. The page mirrors `RolesPage.tsx` structurally:
- Header: title + "View All / My Location" toggle + "Assign Location" Dialog button
- Assign dialog: employee ID text input with 400ms debounce lookup → `searchEmployees` → cross-reference against `allUsers` → location dropdown
- Card list with search filter and inline remove confirm per user

The `empLookup` state machine has five states:
- `"idle"` — input empty
- `"loading"` — debounce timer fired, awaiting search result
- `"found"` — employee found in HR **and** in `allUsers` (has a system account); `userId` is set
- `"no_account"` — employee found in HR but **not** in `allUsers` (no system account)
- `"not_found"` — employee not found in HR at all

- [ ] **Step 1: Replace the page file**

Replace the entire contents of `NAFClient/src/features/admin/pages/LocationsPage.tsx` with:

```tsx
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/AuthContext";
import { useAdminLocations } from "../hooks/useAdminLocations";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { searchEmployees } from "@/shared/api/employeeService";
import type { Employee } from "@/shared/types/api/employee";

export default function LocationsPage() {
  const { user } = useAuth();
  const [viewAll, setViewAll] = useState(false);
  const locationId = viewAll ? null : (user?.locationId ?? null);

  const { locationsQuery, allUsers, assignLocationMutation, removeLocationMutation } =
    useAdminLocations();
  const { users, isLoading } = useAdminUsers(locationId);

  // Dialog state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState(0);
  const [formError, setFormError] = useState("");

  // Employee lookup preview
  const [empLookup, setEmpLookup] = useState<{
    state: "idle" | "loading" | "found" | "not_found" | "no_account";
    employee: Employee | null;
    userId: number | null;
  }>({ state: "idle", employee: null, userId: null });

  useEffect(() => {
    if (!employeeId.trim()) {
      setEmpLookup({ state: "idle", employee: null, userId: null });
      return;
    }
    const timer = setTimeout(async () => {
      setEmpLookup({ state: "loading", employee: null, userId: null });
      try {
        const results = await searchEmployees(employeeId.trim());
        const match = results.find((e) => e.id === employeeId.trim());
        if (!match) {
          setEmpLookup({ state: "not_found", employee: null, userId: null });
          return;
        }
        const userRecord = allUsers.find((u) => u.employeeId === match.id);
        if (!userRecord) {
          setEmpLookup({ state: "no_account", employee: match, userId: null });
          return;
        }
        setEmpLookup({ state: "found", employee: match, userId: userRecord.id });
      } catch {
        setEmpLookup({ state: "not_found", employee: null, userId: null });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [employeeId, allUsers]);

  // Inline removal confirmation
  const [pendingRemove, setPendingRemove] = useState<{
    userId: number;
    locationId: number;
  } | null>(null);

  // Search / filter
  const [search, setSearch] = useState("");
  const filtered = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.employeeId}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (empLookup.state === "no_account") {
      setFormError("No system account found. Assign a role first.");
      return;
    }
    if (empLookup.state !== "found" || empLookup.userId === null) {
      setFormError("Employee not found. Please enter a valid employee ID.");
      return;
    }
    if (!selectedLocationId) {
      setFormError("Please select a location.");
      return;
    }
    try {
      await assignLocationMutation.mutateAsync({
        userId: empLookup.userId,
        locationId: selectedLocationId,
      });
      setEmployeeId("");
      setSelectedLocationId(0);
      setEmpLookup({ state: "idle", employee: null, userId: null });
      setSheetOpen(false);
    } catch {
      setFormError("Failed to assign location. Please try again.");
    }
  };

  const handleConfirmRemove = async () => {
    if (!pendingRemove) return;
    await removeLocationMutation.mutateAsync(pendingRemove);
    setPendingRemove(null);
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-amber-500">Locations Management</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewAll((v) => !v)}
          >
            {viewAll ? "My Location" : "View All"}
          </Button>

          <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Assign Location</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Assign Location</DialogTitle>
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
                    <p className="text-xs text-muted-foreground">
                      Looking up employee…
                    </p>
                  )}
                  {empLookup.state === "found" && empLookup.employee && (
                    <p className="text-xs text-green-700">
                      {empLookup.employee.firstName} {empLookup.employee.lastName}{" "}
                      · {empLookup.employee.position}
                    </p>
                  )}
                  {empLookup.state === "no_account" && empLookup.employee && (
                    <p className="text-xs text-red-500">
                      {empLookup.employee.firstName} {empLookup.employee.lastName}{" "}
                      — No system account. Assign a role first.
                    </p>
                  )}
                  {empLookup.state === "not_found" && (
                    <p className="text-xs text-red-500">Employee not found</p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <Label>Location</Label>
                  <select
                    className="border rounded px-3 py-2 text-sm"
                    value={selectedLocationId}
                    onChange={(e) =>
                      setSelectedLocationId(Number(e.target.value))
                    }
                    required
                  >
                    <option value={0}>Select location</option>
                    {locationsQuery.data?.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formError && (
                  <p className="text-sm text-red-500">{formError}</p>
                )}

                <Button
                  type="submit"
                  disabled={assignLocationMutation.isPending}
                  className="w-full"
                >
                  {assignLocationMutation.isPending
                    ? "Assigning…"
                    : "Assign Location"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search + user list */}
      <div className="space-y-3">
        <Input
          placeholder="Search by name or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        {isLoading && (
          <p className="text-muted-foreground text-sm">Loading…</p>
        )}

        {!isLoading && filtered.length === 0 && (
          <p className="text-muted-foreground text-sm">
            {search ? "No users match your search." : "No users found."}
          </p>
        )}

        {filtered.map((u) => {
          const hasLocation = u.locationId && u.location;
          const isPending = pendingRemove?.userId === u.id;
          return (
            <Card key={u.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-semibold">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {u.employeeId} · {u.department}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasLocation ? (
                      <>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          {u.location}
                        </span>
                        {isPending ? (
                          <span className="flex items-center gap-1 text-xs">
                            <span className="text-muted-foreground">
                              Remove?
                            </span>
                            <button
                              className="text-red-600 font-semibold hover:underline"
                              onClick={handleConfirmRemove}
                              disabled={removeLocationMutation.isPending}
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
                            title="Remove location"
                            onClick={() =>
                              setPendingRemove({
                                userId: u.id,
                                locationId: u.locationId,
                              })
                            }
                          >
                            ✕
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd NAFClient && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start the dev server and manually test**

```bash
cd NAFClient && npm run dev
```

Open `http://localhost:5173` and log in as ADMIN. Navigate to Locations Management and verify:

1. Page shows the amber "Locations Management" heading, "View All / My Location" toggle, and "Assign Location" button.
2. Clicking "Assign Location" opens the Dialog.
3. Typing a valid employee ID triggers the debounce (400ms) and shows a green preview with name and position.
4. Typing an employee ID that exists in HR but has no system account shows the red "No system account. Assign a role first." message.
5. Typing an invalid ID shows "Employee not found".
6. Selecting a location and submitting assigns it; success toast appears and Dialog closes.
7. User cards show name, `employeeId · department`, and an amber location badge.
8. Clicking `✕` on a badge shows inline "Remove? Yes No"; clicking Yes removes it with a toast.
9. The search input filters the card list live.
10. "View All" toggle switches between scoped and full user list.

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/features/admin/pages/LocationsPage.tsx
git commit -m "feat: revamp LocationsPage to match RolesPage pattern"
```
