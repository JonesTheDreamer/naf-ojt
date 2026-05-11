# Admin Resource Requests Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the admin "Implementations" sidebar tab with a "Resource Requests" tab that shows a paginated, progress-filtered flat list of all resource requests across all NAFs, where clicking a row navigates to that employee's NAF detail page.

**Architecture:** A new `GET /api/admin/resource-requests` endpoint projects `ResourceRequest` rows (with NAF + Resource joins) into a flat `AdminResourceRequestDTO`, paged server-side. The frontend consumes it via a new hook and renders a tab-filtered `DataTable` with `TablePagination`. The old Implementations pages, hook, and columns are deleted; the sidebar nav item is swapped in place.

**Tech Stack:** ASP.NET Core 8 / EF Core (backend), React 19 + TypeScript + React Query + TanStack Table + Tailwind (frontend)

---

## File Map

### Backend — Create
- `NAFServer/src/Application/DTOs/Admin/AdminResourceRequestDTO.cs`

### Backend — Modify
- `NAFServer/src/Domain/Enums/Progress.cs` — add `CANCELLED`
- `NAFServer/src/Application/Interfaces/INAFService.cs` — add method signature
- `NAFServer/src/Application/Services/NAFService.cs` — implement method
- `NAFServer/src/API/Controllers/AdminController.cs` — add endpoint

### Frontend — Delete
- `NAFClient/src/features/admin/pages/ForImplementationsPage.tsx`
- `NAFClient/src/features/admin/pages/AdminImplementationDetailPage.tsx`
- `NAFClient/src/features/admin/hooks/useForImplementations.ts`
- `NAFClient/src/features/admin/components/implementationColumns.tsx`

### Frontend — Create
- `NAFClient/src/features/admin/hooks/useAdminResourceRequests.ts`
- `NAFClient/src/features/admin/components/resourceRequestColumns.tsx`
- `NAFClient/src/features/admin/pages/AdminResourceRequestsPage.tsx`

### Frontend — Modify
- `NAFClient/src/features/admin/types.ts` — add `AdminResourceRequestDTO`
- `NAFClient/src/features/admin/api.ts` — add `getAdminResourceRequests`
- `NAFClient/src/app/routesEnum.ts` — add `ADMIN_RESOURCE_REQUESTS`, remove old routes
- `NAFClient/src/app/router.tsx` — add new route, remove old routes
- `NAFClient/src/shared/components/layout/AdminLayout.tsx` — swap nav item

---

## Task 1: Add CANCELLED to Backend Progress Enum

**Files:**
- Modify: `NAFServer/src/Domain/Enums/Progress.cs`

The frontend `Progress` enum already has `CANCELLED = 7`. The backend enum is missing it. Adding it keeps the two in sync and ensures the filter endpoint can handle it.

- [ ] **Step 1: Open the file and add CANCELLED**

Replace the entire file content:

```csharp
namespace NAFServer.src.Domain.Enums
{
    public enum Progress
    {
        OPEN,           // 0 — no approvers yet
        IN_PROGRESS,    // 1 — waiting for next approver
        FOR_SCREENING,  // 2 — awaiting technical screening
        IMPLEMENTATION, // 3 — technical team is working on it
        ACCOMPLISHED,   // 4 — delivered
        REJECTED,       // 5 — an approver rejected
        NOT_ACCOMPLISHED, // 6 — requestor closed a rejected request
        CANCELLED       // 7 — cancelled
    }
}
```

- [ ] **Step 2: Build the backend to confirm no breakage**

```bash
cd NAFServer && dotnet build
```

Expected: `Build succeeded.`

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/Domain/Enums/Progress.cs
git commit -m "feat(domain): add CANCELLED to Progress enum"
```

---

## Task 2: Create AdminResourceRequestDTO

**Files:**
- Create: `NAFServer/src/Application/DTOs/Admin/AdminResourceRequestDTO.cs`

- [ ] **Step 1: Create the file**

```csharp
namespace NAFServer.src.Application.DTOs.Admin
{
    public record AdminResourceRequestDTO(
        Guid Id,
        Guid NafId,
        string NafReference,
        string EmployeeName,
        string ResourceName,
        int Progress,
        DateTime? DateNeeded,
        DateTime CreatedAt
    );
}
```

`Progress` is serialized as `int` so the frontend numeric enum values map directly (same pattern used throughout the codebase — e.g. `NAFDTO` returns `Progress` as its underlying int).

- [ ] **Step 2: Build to confirm**

```bash
cd NAFServer && dotnet build
```

Expected: `Build succeeded.`

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/Application/DTOs/Admin/AdminResourceRequestDTO.cs
git commit -m "feat(dto): add AdminResourceRequestDTO"
```

---

## Task 3: Add Service Method

**Files:**
- Modify: `NAFServer/src/Application/Interfaces/INAFService.cs`
- Modify: `NAFServer/src/Application/Services/NAFService.cs`

- [ ] **Step 1: Add the method signature to INAFService**

Open `NAFServer/src/Application/Interfaces/INAFService.cs`. The current file ends at line 18. Add one line before the closing brace:

```csharp
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.DTOs.NAF;
using static NAFServer.src.Application.DTOs.Common.PaginatedDTO;

namespace NAFServer.src.Application.Interfaces
{
    public interface INAFService
    {
        public Task<NAFDTO> GetNAFByIdAsync(Guid id);
        public Task<NAFDTO> CreateAsync(CreateNAFRequestDTO request);
        public Task<PagedResult<NAFDTO>> GetNAFsUnderEmployeeAsync(string employeeId, int page);
        public Task<NAFDTO> DeactivateNAFAsync(Guid nafId);
        public Task<NAFDTO> ActivateNAFAsync(Guid nafId);
        public Task<PagedResult<NAFDTO>> GetNAFToApproveAsync(string employeeId, int page);
        public Task<bool> EmployeeHasNAFForDepartmentAsync(string employeeId, int departmentId);
        public Task<List<NAFDTO>> GetNAFByEmployeeIdAsync(string employeeId);
        Task<List<AddBasicResourceResultDTO>> AddBasicResourcesToNAFAsync(Guid nafId, List<BasicResourceWithDateDTO> resources);
        Task<PagedResult<NAFDTO>> GetNAFsByLocationPagedAsync(int locationId, string status, int page);
        Task<PagedResult<AdminResourceRequestDTO>> GetResourceRequestsByLocationPagedAsync(int locationId, string progress, int page);
    }
}
```

- [ ] **Step 2: Implement the method in NAFService**

Open `NAFServer/src/Application/Services/NAFService.cs`. Add the using at the top (after existing usings):

```csharp
using NAFServer.src.Application.DTOs.Admin;
```

Then add the following method at the end of the class (before the final `}`), after `GetNAFsByLocationPagedAsync`:

```csharp
public async Task<PagedResult<AdminResourceRequestDTO>> GetResourceRequestsByLocationPagedAsync(
    int locationId, string progress, int page)
{
    const int pageSize = 10;

    var query = _context.ResourceRequests
        .Include(rr => rr.NAF)
        .Include(rr => rr.Resource)
        .Where(rr => rr.NAF.LocationId == locationId);

    if (!string.Equals(progress, "all", StringComparison.OrdinalIgnoreCase)
        && Enum.TryParse<Domain.Enums.Progress>(progress, ignoreCase: true, out var parsedProgress))
    {
        query = query.Where(rr => rr.Progress == parsedProgress);
    }

    var totalCount = await query.CountAsync();

    var items = await query
        .OrderByDescending(rr => rr.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    var dtos = new List<AdminResourceRequestDTO>();
    foreach (var rr in items)
    {
        var employee = await _employeeRepository.GetByIdAsync(rr.NAF.EmployeeId);
        var employeeName = employee != null
            ? $"{employee.FirstName} {employee.LastName}".Trim()
            : rr.NAF.EmployeeId;

        dtos.Add(new AdminResourceRequestDTO(
            rr.Id,
            rr.NAFId,
            rr.NAF.Reference,
            employeeName,
            rr.Resource.Name,
            (int)rr.Progress,
            rr.DateNeeded == default(DateTime) ? null : rr.DateNeeded,
            rr.CreatedAt
        ));
    }

    return new PagedResult<AdminResourceRequestDTO>
    {
        Data = dtos,
        TotalCount = totalCount,
        PageSize = pageSize,
        CurrentPage = page,
        TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
    };
}
```

- [ ] **Step 3: Build to confirm**

```bash
cd NAFServer && dotnet build
```

Expected: `Build succeeded.`

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Application/Interfaces/INAFService.cs NAFServer/src/Application/Services/NAFService.cs
git commit -m "feat(service): add GetResourceRequestsByLocationPagedAsync to NAFService"
```

---

## Task 4: Add Controller Endpoint

**Files:**
- Modify: `NAFServer/src/API/Controllers/AdminController.cs`

- [ ] **Step 1: Add the endpoint**

Open `NAFServer/src/API/Controllers/AdminController.cs`. Add the following action after the existing `GetAdminNAFs` method (before the closing `}`):

```csharp
[HttpGet("resource-requests")]
public async Task<IActionResult> GetAdminResourceRequests(
    [FromQuery] int locationId,
    [FromQuery] string progress = "all",
    [FromQuery][Range(1, int.MaxValue)] int page = 1)
{
    return Ok(await _nafService.GetResourceRequestsByLocationPagedAsync(locationId, progress, page));
}
```

The `[Range]` attribute is already imported via `System.ComponentModel.DataAnnotations` at the top of the file.

- [ ] **Step 2: Build and run a quick smoke test**

```bash
cd NAFServer && dotnet build
```

Expected: `Build succeeded.`

Then start the server:

```bash
dotnet run
```

Open in a browser or use curl:

```
GET http://localhost:5186/api/admin/resource-requests?locationId=1&progress=all&page=1
```

Expected: a JSON object with `data`, `totalCount`, `pageSize`, `currentPage`, `totalPages`.

Stop the server.

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/API/Controllers/AdminController.cs
git commit -m "feat(api): add GET /admin/resource-requests endpoint"
```

---

## Task 5: Frontend Cleanup — Delete Old Files and Routes

**Files:**
- Delete: `NAFClient/src/features/admin/pages/ForImplementationsPage.tsx`
- Delete: `NAFClient/src/features/admin/pages/AdminImplementationDetailPage.tsx`
- Delete: `NAFClient/src/features/admin/hooks/useForImplementations.ts`
- Delete: `NAFClient/src/features/admin/components/implementationColumns.tsx`
- Modify: `NAFClient/src/app/routesEnum.ts`
- Modify: `NAFClient/src/app/router.tsx`

- [ ] **Step 1: Delete the four old files**

```bash
cd NAFClient
rm src/features/admin/pages/ForImplementationsPage.tsx
rm src/features/admin/pages/AdminImplementationDetailPage.tsx
rm src/features/admin/hooks/useForImplementations.ts
rm src/features/admin/components/implementationColumns.tsx
```

- [ ] **Step 2: Update routesEnum.ts**

Replace the full content of `NAFClient/src/app/routesEnum.ts`:

```ts
export enum RoutesEnum {
  LOGIN = "/login",

  NAF = "/NAF",

  ADMIN = "/admin",
  ADMIN_NAF = "/admin/NAF",
  ADMIN_NAF_DETAIL = "/admin/NAF/:nafId",
  ADMIN_USERS = "/admin/users",
  ADMIN_USER_DETAIL = "/admin/users/:userId",
  ADMIN_RESOURCES = "/admin/resources",
  ADMIN_RESOURCE_DETAIL = "/admin/resources/:resourceId",
  ADMIN_RESOURCE_REQUESTS = "/admin/resource-requests",
}
```

- [ ] **Step 3: Update router.tsx — remove old routes, add placeholder import**

Open `NAFClient/src/app/router.tsx`. Make these changes:

**Remove** the two lazy imports:
```ts
const ForImplementationsPage = lazy(
  () => import("@/features/admin/pages/ForImplementationsPage"),
);
const AdminImplementationDetailPage = lazy(
  () => import("@/features/admin/pages/AdminImplementationDetailPage"),
);
```

**Remove** the two `<Route>` blocks that used those pages:
```tsx
<Route
  path={RoutesEnum.ADMIN_FOR_IMPLEMENTATIONS}
  element={
    <ProtectedRoute requiredRole="ADMIN">
      <ForImplementationsPage />
    </ProtectedRoute>
  }
/>
<Route
  path={RoutesEnum.ADMIN_IMPLEMENTATION_DETAIL}
  element={
    <ProtectedRoute requiredRole="ADMIN">
      <AdminImplementationDetailPage />
    </ProtectedRoute>
  }
/>
```

**Add** a lazy import for the new page (after the existing admin page imports):
```ts
const AdminResourceRequestsPage = lazy(
  () => import("@/features/admin/pages/AdminResourceRequestsPage"),
);
```

**Add** a new `<Route>` (after the `ADMIN_RESOURCES` route, before the `*` catch-all):
```tsx
<Route
  path={RoutesEnum.ADMIN_RESOURCE_REQUESTS}
  element={
    <ProtectedRoute requiredRole="ADMIN">
      <AdminResourceRequestsPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 4: Run lint to confirm no broken imports**

```bash
cd NAFClient && npm run lint
```

Expected: no errors referencing the deleted files. (TypeScript will complain that `AdminResourceRequestsPage` doesn't exist yet — that's expected and will be fixed in Task 8.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(admin): remove implementations pages, routes, hook, and columns"
```

---

## Task 6: Frontend — Types, API Method, Hook

**Files:**
- Modify: `NAFClient/src/features/admin/types.ts`
- Modify: `NAFClient/src/features/admin/api.ts`
- Create: `NAFClient/src/features/admin/hooks/useAdminResourceRequests.ts`

- [ ] **Step 1: Add AdminResourceRequestDTO to types.ts**

Open `NAFClient/src/features/admin/types.ts`. Add the following import at the top:

```ts
import type { Progress } from "@/shared/types/enum/progress";
```

Then add the new interface at the end of the file:

```ts
export interface AdminResourceRequestDTO {
  id: string;
  nafId: string;
  nafReference: string;
  employeeName: string;
  resourceName: string;
  progress: Progress;
  dateNeeded?: string;
  createdAt: string;
}
```

- [ ] **Step 2: Add getAdminResourceRequests to api.ts**

Open `NAFClient/src/features/admin/api.ts`. Add the following import at the top alongside the existing imports:

```ts
import type { AdminResourceRequestDTO } from "./types";
```

Then add a new method to the `adminApi` object (after `getAdminNAFs`):

```ts
getAdminResourceRequests: (locationId: number, progress: string, page: number) =>
  api
    .get<PagedResult<AdminResourceRequestDTO>>("/admin/resource-requests", {
      params: { locationId, progress, page },
    })
    .then((r) => r.data),
```

Make sure `PagedResult` is already imported at the top of the file — it should already be there from the existing `getAdminNAFs` usage.

- [ ] **Step 3: Create useAdminResourceRequests.ts**

Create `NAFClient/src/features/admin/hooks/useAdminResourceRequests.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api";

export function useAdminResourceRequests(
  locationId: number | null,
  progress: string,
  page: number,
) {
  const query = useQuery({
    queryKey: ["admin", "resource-requests", locationId, progress, page],
    queryFn: () => adminApi.getAdminResourceRequests(locationId!, progress, page),
    enabled: locationId != null,
  });
  return { query };
}
```

- [ ] **Step 4: Type-check**

```bash
cd NAFClient && npm run build 2>&1 | head -40
```

Expected: TypeScript errors only about `AdminResourceRequestsPage` not found (not yet created) and no errors in the files just modified. If there are other errors, fix them before proceeding.

- [ ] **Step 5: Commit**

```bash
git add NAFClient/src/features/admin/types.ts NAFClient/src/features/admin/api.ts NAFClient/src/features/admin/hooks/useAdminResourceRequests.ts
git commit -m "feat(admin): add AdminResourceRequestDTO type, API method, and hook"
```

---

## Task 7: Frontend — Column Definitions

**Files:**
- Create: `NAFClient/src/features/admin/components/resourceRequestColumns.tsx`

- [ ] **Step 1: Create the columns file**

Create `NAFClient/src/features/admin/components/resourceRequestColumns.tsx`:

```tsx
import type { ColumnDef } from "@tanstack/react-table";
import { ProgressBadge } from "@/features/naf/components/progressBadge";
import type { AdminResourceRequestDTO } from "../types";

export const resourceRequestColumns: ColumnDef<AdminResourceRequestDTO>[] = [
  {
    accessorKey: "employeeName",
    header: "Employee",
    size: 200,
    cell: ({ getValue }) => (
      <span className="font-semibold text-sm text-foreground">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "resourceName",
    header: "Resource",
    size: 160,
    cell: ({ getValue }) => (
      <span className="text-sm text-foreground">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "progress",
    header: "Progress",
    size: 160,
    cell: ({ getValue }) => <ProgressBadge progress={getValue<number>()} />,
  },
  {
    accessorKey: "dateNeeded",
    header: "Date Needed",
    size: 140,
    cell: ({ getValue }) => {
      const v = getValue<string | undefined>();
      if (!v) return <span className="text-muted-foreground text-sm">—</span>;
      return (
        <span className="text-sm">
          {new Date(v).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      );
    },
  },
  {
    accessorKey: "nafReference",
    header: "NAF Reference",
    size: 200,
    cell: ({ getValue }) => (
      <span className="font-bold text-sm tracking-wide text-foreground">
        {getValue<string>()}
      </span>
    ),
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add NAFClient/src/features/admin/components/resourceRequestColumns.tsx
git commit -m "feat(admin): add resourceRequestColumns for AdminResourceRequestsPage"
```

---

## Task 8: Frontend — Page Component

**Files:**
- Create: `NAFClient/src/features/admin/pages/AdminResourceRequestsPage.tsx`

- [ ] **Step 1: Create the page**

Create `NAFClient/src/features/admin/pages/AdminResourceRequestsPage.tsx`:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { DataTable } from "@/shared/components/ui/datatable";
import { TablePagination } from "@/features/naf/components/tablePagination";
import { useAdminResourceRequests } from "../hooks/useAdminResourceRequests";
import { resourceRequestColumns } from "../components/resourceRequestColumns";
import { useAuth } from "@/features/auth/AuthContext";
import type { AdminResourceRequestDTO } from "../types";

const PROGRESS_TABS = [
  { label: "All", value: "all" },
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "For Screening", value: "FOR_SCREENING" },
  { label: "Implementation", value: "IMPLEMENTATION" },
  { label: "Accomplished", value: "ACCOMPLISHED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Not Accomplished", value: "NOT_ACCOMPLISHED" },
  { label: "Cancelled", value: "CANCELLED" },
] as const;

export default function AdminResourceRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const locationId = user?.locationId ?? null;

  const [progress, setProgress] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { query } = useAdminResourceRequests(locationId, progress, page);
  const result = query.data;

  const handleProgressChange = (value: string) => {
    setProgress(value);
    setPage(1);
  };

  const handleRowClick = (row: AdminResourceRequestDTO) => {
    navigate(`/admin/NAF/${row.nafId}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-amber-500">Resource Requests</h1>

        <div className="flex gap-2 flex-wrap">
          {PROGRESS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleProgressChange(tab.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                progress === tab.value
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <DataTable
          columns={resourceRequestColumns}
          data={result?.data ?? []}
          isLoading={query.isLoading}
          onRowClick={handleRowClick}
          emptyMessage="No resource requests found."
        />

        <TablePagination
          currentPage={result?.currentPage ?? 1}
          totalPages={result?.totalPages ?? 1}
          totalCount={result?.totalCount ?? 0}
          pageSize={result?.pageSize ?? 10}
          onPageChange={setPage}
        />
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Build to confirm TypeScript passes**

```bash
cd NAFClient && npm run build
```

Expected: `✓ built in` with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/admin/pages/AdminResourceRequestsPage.tsx
git commit -m "feat(admin): add AdminResourceRequestsPage with progress tabs and pagination"
```

---

## Task 9: Frontend — Sidebar Nav Item

**Files:**
- Modify: `NAFClient/src/shared/components/layout/AdminLayout.tsx`

- [ ] **Step 1: Update the nav items**

Open `NAFClient/src/shared/components/layout/AdminLayout.tsx`. Replace the full content:

```tsx
import { Home, Users, FileText, ClipboardList, Box } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import { useAuth } from "@/features/auth/AuthContext";

const navItems = [
  { label: "Home", icon: <Home className="w-5 h-5" />, href: "/admin" },
  { label: "NAFs", icon: <FileText className="w-5 h-5" />, href: "/admin/NAF" },
  { label: "Resource Requests", icon: <ClipboardList className="w-5 h-5" />, href: "/admin/resource-requests" },
  { label: "Users", icon: <Users className="w-5 h-5" />, href: "/admin/users" },
  { label: "Resources", icon: <Box className="w-5 h-5" />, href: "/admin/resources" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Layout navItems={navItems} currentUser={{ name: user?.name ?? "Admin" }} onLogout={handleLogout}>
      {children}
    </Layout>
  );
}
```

- [ ] **Step 2: Final build check**

```bash
cd NAFClient && npm run build
```

Expected: `✓ built in` — no TypeScript errors, no lint errors.

- [ ] **Step 3: Smoke test in the browser**

Start both servers:
```bash
# terminal 1
cd NAFServer && dotnet run

# terminal 2
cd NAFClient && npm run dev
```

1. Log in as an ADMIN user.
2. Confirm the sidebar shows **Resource Requests** (not Implementations).
3. Click **Resource Requests** — verify the page loads at `/admin/resource-requests`.
4. Verify the progress tab bar shows all 9 tabs (All through Cancelled).
5. Click a tab (e.g. "In Progress") — verify the table updates and page resets to 1.
6. If there are multiple pages, verify pagination works.
7. Click a row — verify navigation lands on `/admin/NAF/<nafId>` (the existing NAF detail page).

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/shared/components/layout/AdminLayout.tsx
git commit -m "feat(admin): replace Implementations nav item with Resource Requests"
```
