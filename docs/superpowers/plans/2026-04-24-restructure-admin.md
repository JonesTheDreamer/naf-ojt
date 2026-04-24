# Admin Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the `admin` feature — create `api.ts` from existing service files, absorb all `features/tech/` files (hooks, components, pages) into `features/admin/`, update all imports, and clean up orphaned service files and the `tech/` feature folder.

**Architecture:** The `admin` feature already has pages and hooks that import from `services/EntityAPI/adminService.ts`. The `tech` feature has a parallel structure (hooks, components, pages) importing from `services/EntityAPI/implementationService.ts`. Both services move into a single `features/admin/api.ts`. All `tech/` files relocate into `admin/`, with `TechTeamLayout` references replaced by `AdminLayout`. `router.tsx` import paths update to point at `admin/pages/`. `features/tech/` and both old service files are deleted.

**Tech Stack:** React 19, TypeScript, Vite

**Prerequisite:** Run this plan AFTER `2026-04-24-restructure-shared.md` is complete (so `@/shared/api/client` exists and old `services/api.tsx` is gone).

---

## File Map

| Source | Destination |
|--------|-------------|
| `src/services/EntityAPI/adminService.ts` | `src/features/admin/api.ts` (merged; old file deleted) |
| `src/services/EntityAPI/implementationService.ts` | `src/features/admin/api.ts` (merged; old file deleted) |
| `src/features/tech/types.ts` | `src/features/admin/types.ts` (new; old file deleted) |
| `src/features/admin/hooks/useAdminLocations.ts` | same path, import updated |
| `src/features/admin/hooks/useAdminUsers.ts` | same path, import updated |
| `src/features/tech/hooks/useForImplementations.ts` | `src/features/admin/hooks/useForImplementations.ts` |
| `src/features/tech/hooks/useMyTasks.ts` | `src/features/admin/hooks/useMyTasks.ts` |
| `src/features/tech/components/DelayedReasonModal.tsx` | `src/features/admin/components/DelayedReasonModal.tsx` |
| `src/features/tech/components/ImplementationNAFAccordion.tsx` | `src/features/admin/components/ImplementationNAFAccordion.tsx` |
| `src/features/tech/components/ImplementationResourceAccordion.tsx` | `src/features/admin/components/ImplementationResourceAccordion.tsx` |
| `src/features/tech/components/ImplementationResourceRequestRow.tsx` | `src/features/admin/components/ImplementationResourceRequestRow.tsx` |
| `src/features/tech/components/ImplementationViewToggle.tsx` | `src/features/admin/components/ImplementationViewToggle.tsx` |
| `src/features/tech/components/ResourceRequestInfoModal.tsx` | `src/features/admin/components/ResourceRequestInfoModal.tsx` |
| `src/features/tech/pages/ForImplementationsPage.tsx` | `src/features/admin/pages/ForImplementationsPage.tsx` |
| `src/features/tech/pages/MyTasksPage.tsx` | `src/features/admin/pages/MyTasksPage.tsx` |
| `src/features/tech/pages/TechTeamHomePage.tsx` | `src/features/admin/pages/TechTeamHomePage.tsx` |
| `src/app/router.tsx` | same path, lazy imports updated |
| — | `src/features/admin/index.ts` (new) |

---

### Task 1: Create `features/admin/api.ts` and `features/admin/types.ts`

**Files:**
- Create: `NAFClient/src/features/admin/types.ts`
- Create: `NAFClient/src/features/admin/api.ts`

- [ ] **Step 1: Write `src/features/admin/types.ts`**

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
```

- [ ] **Step 2: Write `src/features/admin/api.ts`**

```ts
import { api } from "@/shared/api/client";
import type { NAF } from "@/shared/types/api/naf";
import type { ForImplementationItemDTO } from "./types";

export interface UserRoleDTO {
  id: number;
  employeeId: string;
  role: string;
  dateAdded: string;
  dateRemoved: string | null;
}

export interface UserWithRolesDTO {
  employeeId: string;
  location: string;
  roles: UserRoleDTO[];
}

export interface AddUserDTO {
  employeeId: string;
  role: string;
  location: string;
}

export interface AssignLocationDTO {
  employeeId: string;
  location: string;
}

export const adminApi = {
  getUsers: () =>
    api.get<UserWithRolesDTO[]>("/admin/users").then((r) => r.data),

  addUser: (data: AddUserDTO) =>
    api.post("/admin/users", data).then((r) => r.data),

  removeRole: (employeeId: string, role: string) =>
    api.patch(`/admin/users/${employeeId}/roles/${role}/remove`).then((r) => r.data),

  getLocations: () =>
    api.get<string[]>("/admin/locations").then((r) => r.data),

  assignLocation: (data: AssignLocationDTO) =>
    api.post("/admin/locations/assign", data).then((r) => r.data),

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
    api.patch(`/implementations/${implementationId}/delayed`, JSON.stringify(delayReason)).then((r) => r.data),

  setToAccomplished: (implementationId: string) =>
    api.patch(`/implementations/${implementationId}/accomplished`).then((r) => r.data),
};
```

> Note: The import path for `NAF` uses `@/shared/types/api/naf` — this is the new path set by the shared restructure plan. If the shared plan has not yet run, temporarily use `@/types/api/naf`.

- [ ] **Step 3: Verify build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds (old service files still exist and are still imported).

---

### Task 2: Update existing admin hooks

**Files:**
- Modify: `NAFClient/src/features/admin/hooks/useAdminLocations.ts`
- Modify: `NAFClient/src/features/admin/hooks/useAdminUsers.ts`

- [ ] **Step 1: Rewrite `src/features/admin/hooks/useAdminLocations.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AssignLocationDTO } from "../api";
import { toast } from "sonner";

export function useAdminLocations() {
  const queryClient = useQueryClient();

  const locationsQuery = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: adminApi.getLocations,
  });

  const assignLocationMutation = useMutation({
    mutationFn: (data: AssignLocationDTO) => adminApi.assignLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "locations"] });
      toast.success("Location assigned");
    },
    onError: () => toast.error("Failed to assign location"),
  });

  return { locationsQuery, assignLocationMutation };
}
```

- [ ] **Step 2: Rewrite `src/features/admin/hooks/useAdminUsers.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AddUserDTO } from "../api";
import { toast } from "sonner";

export function useAdminUsers() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminApi.getUsers,
  });

  const addUserMutation = useMutation({
    mutationFn: (data: AddUserDTO) => adminApi.addUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User added");
    },
    onError: () => toast.error("Failed to add user"),
  });

  const removeRoleMutation = useMutation({
    mutationFn: ({ employeeId, role }: { employeeId: string; role: string }) =>
      adminApi.removeRole(employeeId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Role removed");
    },
    onError: () => toast.error("Failed to remove role"),
  });

  return { usersQuery, addUserMutation, removeRoleMutation };
}
```

- [ ] **Step 3: Verify build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds.

---

### Task 3: Move tech hooks into admin

**Files:**
- Create: `NAFClient/src/features/admin/hooks/useForImplementations.ts`
- Create: `NAFClient/src/features/admin/hooks/useMyTasks.ts`

- [ ] **Step 1: Write `src/features/admin/hooks/useForImplementations.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";
import { toast } from "sonner";

export function useForImplementations() {
  const queryClient = useQueryClient();

  const forImplementationsQuery = useQuery({
    queryKey: ["tech", "for-implementations"],
    queryFn: adminApi.getForImplementations,
  });

  const assignToMeMutation = useMutation({
    mutationFn: (resourceRequestId: string) =>
      adminApi.assignToMe(resourceRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tech", "for-implementations"] });
      queryClient.invalidateQueries({ queryKey: ["tech", "my-tasks"] });
      toast.success("Assigned to you");
    },
    onError: () => toast.error("Failed to assign task"),
  });

  return { forImplementationsQuery, assignToMeMutation };
}
```

- [ ] **Step 2: Write `src/features/admin/hooks/useMyTasks.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";
import { toast } from "sonner";

export function useMyTasks() {
  const queryClient = useQueryClient();

  const myTasksQuery = useQuery({
    queryKey: ["tech", "my-tasks"],
    queryFn: adminApi.getMyTasks,
  });

  const setToDelayedMutation = useMutation({
    mutationFn: ({ implementationId, reason }: { implementationId: string; reason: string }) =>
      adminApi.setToDelayed(implementationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tech", "my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tech", "for-implementations"] });
      toast.success("Marked as delayed");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const setToAccomplishedMutation = useMutation({
    mutationFn: (implementationId: string) =>
      adminApi.setToAccomplished(implementationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tech", "my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tech", "for-implementations"] });
      toast.success("Marked as accomplished");
    },
    onError: () => toast.error("Failed to update status"),
  });

  return { myTasksQuery, setToDelayedMutation, setToAccomplishedMutation };
}
```

- [ ] **Step 3: Verify build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds (old tech hooks still exist).

---

### Task 4: Move tech components into admin

**Files:**
- Create: `NAFClient/src/features/admin/components/DelayedReasonModal.tsx`
- Create: `NAFClient/src/features/admin/components/ImplementationViewToggle.tsx`
- Create: `NAFClient/src/features/admin/components/ImplementationResourceRequestRow.tsx`
- Create: `NAFClient/src/features/admin/components/ResourceRequestInfoModal.tsx`
- Create: `NAFClient/src/features/admin/components/ImplementationNAFAccordion.tsx`
- Create: `NAFClient/src/features/admin/components/ImplementationResourceAccordion.tsx`

- [ ] **Step 1: Copy tech components into admin via git mv**

```bash
cd NAFClient/src
git mv features/tech/components/DelayedReasonModal.tsx features/admin/components/DelayedReasonModal.tsx
git mv features/tech/components/ImplementationViewToggle.tsx features/admin/components/ImplementationViewToggle.tsx
git mv features/tech/components/ImplementationResourceRequestRow.tsx features/admin/components/ImplementationResourceRequestRow.tsx
git mv features/tech/components/ResourceRequestInfoModal.tsx features/admin/components/ResourceRequestInfoModal.tsx
git mv features/tech/components/ImplementationNAFAccordion.tsx features/admin/components/ImplementationNAFAccordion.tsx
git mv features/tech/components/ImplementationResourceAccordion.tsx features/admin/components/ImplementationResourceAccordion.tsx
```

- [ ] **Step 2: Verify build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build will fail because tech pages still import from `../components/` (relative paths pointing to the old location). This is expected — the next task fixes the pages.

---

### Task 5: Move tech pages into admin and fix all imports

**Files:**
- Create: `NAFClient/src/features/admin/pages/ForImplementationsPage.tsx`
- Create: `NAFClient/src/features/admin/pages/MyTasksPage.tsx`
- Create: `NAFClient/src/features/admin/pages/TechTeamHomePage.tsx`

- [ ] **Step 1: Copy tech pages into admin via git mv**

```bash
cd NAFClient/src
git mv features/tech/pages/ForImplementationsPage.tsx features/admin/pages/ForImplementationsPage.tsx
git mv features/tech/pages/MyTasksPage.tsx features/admin/pages/MyTasksPage.tsx
git mv features/tech/pages/TechTeamHomePage.tsx features/admin/pages/TechTeamHomePage.tsx
```

- [ ] **Step 2: Update imports in `ForImplementationsPage.tsx`**

The file was already using `AdminLayout`, but it still imports from the old relative paths. Open `NAFClient/src/features/admin/pages/ForImplementationsPage.tsx` and update it to:

```tsx
import { useState } from "react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useForImplementations } from "../hooks/useForImplementations";
import { ImplementationViewToggle } from "../components/ImplementationViewToggle";
import { ImplementationNAFAccordion } from "../components/ImplementationNAFAccordion";
import { ImplementationResourceAccordion } from "../components/ImplementationResourceAccordion";

export default function ForImplementationsPage() {
  const [viewMode, setViewMode] = useState<"per-naf" | "per-resource">(
    "per-naf",
  );
  const { forImplementationsQuery, assignToMeMutation } =
    useForImplementations();

  const nafs = forImplementationsQuery.data ?? [];

  const handleAssign = (requestId: string) => {
    assignToMeMutation.mutate(requestId);
  };

  const handleAssignAll = (requestIds: string[]) => {
    for (const id of requestIds) {
      assignToMeMutation.mutate(id);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-amber-500">
          For Implementations
        </h1>
        <ImplementationViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {forImplementationsQuery.isLoading && (
        <p className="text-muted-foreground">Loading...</p>
      )}

      {!forImplementationsQuery.isLoading && nafs.length === 0 && (
        <p className="text-muted-foreground">No items for implementation.</p>
      )}

      {viewMode === "per-naf" ? (
        <ImplementationNAFAccordion
          nafs={nafs}
          mode="for-implementations"
          onAssign={handleAssign}
          onAssignAll={handleAssignAll}
          isSubmitting={assignToMeMutation.isPending}
        />
      ) : (
        <ImplementationResourceAccordion
          nafs={nafs}
          mode="for-implementations"
          onAssign={handleAssign}
          onAssignAll={handleAssignAll}
          isSubmitting={assignToMeMutation.isPending}
        />
      )}
    </AdminLayout>
  );
}
```

> Note: `@/shared/components/layout/AdminLayout` is the new path set by the shared restructure plan. If the shared plan has not yet run, use `@/components/layout/AdminLayout`.

- [ ] **Step 3: Update imports in `MyTasksPage.tsx`**

Open `NAFClient/src/features/admin/pages/MyTasksPage.tsx` and replace the entire file:

```tsx
import { useState } from "react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useMyTasks } from "../hooks/useMyTasks";
import { ImplementationViewToggle } from "../components/ImplementationViewToggle";
import { ImplementationNAFAccordion } from "../components/ImplementationNAFAccordion";
import { ImplementationResourceAccordion } from "../components/ImplementationResourceAccordion";

export default function MyTasksPage() {
  const [viewMode, setViewMode] = useState<"per-naf" | "per-resource">("per-naf");
  const { myTasksQuery, setToDelayedMutation, setToAccomplishedMutation } =
    useMyTasks();

  const nafs = myTasksQuery.data ?? [];

  const handleMarkDelayed = (implementationId: string, reason: string) => {
    setToDelayedMutation.mutate({ implementationId, reason });
  };

  const handleMarkAccomplished = (implementationId: string) => {
    setToAccomplishedMutation.mutate(implementationId);
  };

  const isSubmitting =
    setToDelayedMutation.isPending || setToAccomplishedMutation.isPending;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-amber-500">My Tasks</h1>
        <ImplementationViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {myTasksQuery.isLoading && (
        <p className="text-muted-foreground">Loading...</p>
      )}

      {!myTasksQuery.isLoading && nafs.length === 0 && (
        <p className="text-muted-foreground">No tasks assigned to you.</p>
      )}

      {viewMode === "per-naf" ? (
        <ImplementationNAFAccordion
          nafs={nafs}
          mode="my-tasks"
          onMarkDelayed={handleMarkDelayed}
          onMarkAccomplished={handleMarkAccomplished}
          isSubmitting={isSubmitting}
        />
      ) : (
        <ImplementationResourceAccordion
          nafs={nafs}
          mode="my-tasks"
          onMarkDelayed={handleMarkDelayed}
          onMarkAccomplished={handleMarkAccomplished}
          isSubmitting={isSubmitting}
        />
      )}
    </AdminLayout>
  );
}
```

- [ ] **Step 4: Update imports in `TechTeamHomePage.tsx`**

Open `NAFClient/src/features/admin/pages/TechTeamHomePage.tsx` and replace the entire file:

```tsx
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useAuth } from "@/features/auth/AuthContext";
import { useMyTasks } from "../hooks/useMyTasks";
import { useForImplementations } from "../hooks/useForImplementations";

export default function TechTeamHomePage() {
  const { user } = useAuth();
  const { myTasksQuery } = useMyTasks();
  const { forImplementationsQuery } = useForImplementations();

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-amber-500">Technical Team Dashboard</h1>
      <p className="text-muted-foreground">Welcome, {user?.name}.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">My Tasks</p>
          <p className="text-3xl font-bold">
            {myTasksQuery.isLoading ? "..." : (myTasksQuery.data?.length ?? 0)}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">For Implementations</p>
          <p className="text-3xl font-bold">
            {forImplementationsQuery.isLoading ? "..." : (forImplementationsQuery.data?.length ?? 0)}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 5: Verify build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds.

---

### Task 6: Update `router.tsx` lazy imports

**Files:**
- Modify: `NAFClient/src/app/router.tsx`

- [ ] **Step 1: Update the three lazy imports from `features/tech/pages/` to `features/admin/pages/`**

Open `NAFClient/src/app/router.tsx`. Find and replace:

```ts
const TechTeamHomePage = lazy(
  () => import("@/features/tech/pages/TechTeamHomePage"),
);
const MyTasksPage = lazy(() => import("@/features/tech/pages/MyTasksPage"));
const ForImplementationsPage = lazy(
  () => import("@/features/tech/pages/ForImplementationsPage"),
);
```

With:

```ts
const TechTeamHomePage = lazy(
  () => import("@/features/admin/pages/TechTeamHomePage"),
);
const MyTasksPage = lazy(() => import("@/features/admin/pages/MyTasksPage"));
const ForImplementationsPage = lazy(
  () => import("@/features/admin/pages/ForImplementationsPage"),
);
```

- [ ] **Step 2: Verify build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds.

---

### Task 7: Delete old service files and `features/tech/`

**Files:**
- Delete: `NAFClient/src/services/EntityAPI/adminService.ts`
- Delete: `NAFClient/src/services/EntityAPI/implementationService.ts`
- Delete: `NAFClient/src/features/tech/` (entire folder)

- [ ] **Step 1: Confirm no remaining imports of the old paths**

```bash
cd NAFClient
grep -r "EntityAPI/adminService\|EntityAPI/implementationService\|features/tech" src --include="*.ts" --include="*.tsx"
```

Expected: No output (zero matches).

- [ ] **Step 2: Delete old service files and tech folder**

```bash
rm src/services/EntityAPI/adminService.ts
rm src/services/EntityAPI/implementationService.ts
rm -r src/features/tech
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds.

---

### Task 8: Create `features/admin/index.ts`

**Files:**
- Create: `NAFClient/src/features/admin/index.ts`

- [ ] **Step 1: Write `src/features/admin/index.ts`**

```ts
export { default as AdminHomePage } from "./pages/AdminHomePage";
export { default as RolesPage } from "./pages/RolesPage";
export { default as LocationsPage } from "./pages/LocationsPage";
export { default as ForImplementationsPage } from "./pages/ForImplementationsPage";
export { default as MyTasksPage } from "./pages/MyTasksPage";
export { default as TechTeamHomePage } from "./pages/TechTeamHomePage";
```

- [ ] **Step 2: Verify build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd ..
git add NAFClient/
git commit -m "refactor: consolidate admin feature — add api.ts, index.ts, absorb tech feature"
```
