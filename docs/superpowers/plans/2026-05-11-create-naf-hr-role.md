# Create NAF Dialog (Admin) + HR Role Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Create NAF dialog to the Admin NAF list page and introduce a full HR frontend role with a Create NAF page and a read-only paginated NAF history list.

**Architecture:** Two independent additions — a one-liner change to `AdminNAFListPage` to wire in the existing `CreateNAFDialog`, and a new HR feature module (backend `HRController` + frontend `features/hr/`) with its own layout, two pages, hook, types, and api file. The HR module mirrors the admin module structure already in the codebase.

**Tech Stack:** ASP.NET Core 8, EF Core, React 19, TypeScript, TanStack React Query, Tailwind CSS v4, ShadCN, lucide-react.

---

## File Map

**Create (backend):**
- `NAFServer/src/Application/DTOs/HR/HRNafDTO.cs`
- `NAFServer/src/API/Controllers/HRController.cs`

**Create (frontend):**
- `NAFClient/src/features/hr/types.ts`
- `NAFClient/src/features/hr/api.ts`
- `NAFClient/src/features/hr/hooks/useHRNafs.ts`
- `NAFClient/src/features/hr/components/HRLayout.tsx`
- `NAFClient/src/features/hr/components/hrNafColumns.tsx`
- `NAFClient/src/features/hr/pages/HRNAFHistoryPage.tsx`
- `NAFClient/src/features/hr/pages/HRCreateNAFPage.tsx`

**Modify (frontend):**
- `NAFClient/src/app/routesEnum.ts` — add HR, HR_CREATE routes
- `NAFClient/src/features/auth/ProtectedRoute.tsx` — add HR to ROLE_HOME
- `NAFClient/src/app/router.tsx` — add lazy HR routes
- `NAFClient/src/features/admin/pages/AdminNAFListPage.tsx` — add Create NAF button

---

### Task 1: Backend — HRNafDTO and HRController

**Files:**
- Create: `NAFServer/src/Application/DTOs/HR/HRNafDTO.cs`
- Create: `NAFServer/src/API/Controllers/HRController.cs`

- [ ] **Step 1: Create the HRNafDTO**

Create file `NAFServer/src/Application/DTOs/HR/HRNafDTO.cs`:

```csharp
namespace NAFServer.src.Application.DTOs.HR
{
    public record HRNafDTO(
        Guid NafId,
        string EmployeeName,
        string Department,
        DateTime DateCreated
    );
}
```

- [ ] **Step 2: Create HRController**

Create file `NAFServer/src/API/Controllers/HRController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.HR;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;
using static NAFServer.src.Application.DTOs.Common.PaginatedDTO;
using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.API.Controllers
{
    [Route("api/hr")]
    [ApiController]
    [Authorize(Roles = "HR")]
    public class HRController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmployeeRepository _employeeRepository;

        public HRController(AppDbContext context, IEmployeeRepository employeeRepository)
        {
            _context = context;
            _employeeRepository = employeeRepository;
        }

        [HttpGet("nafs")]
        public async Task<IActionResult> GetNafs(
            [FromQuery][Range(1, int.MaxValue)] int page = 1)
        {
            const int pageSize = 50;

            var totalCount = await _context.NAFs.CountAsync();

            var nafs = await _context.NAFs
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();

            var dtos = new List<HRNafDTO>();
            foreach (var naf in nafs)
            {
                var employee = await _employeeRepository.GetByIdAsync(naf.EmployeeId);
                var employeeName = employee != null
                    ? $"{employee.FirstName} {employee.LastName}".Trim()
                    : naf.EmployeeId;
                var department = employee?.DepartmentDesc ?? string.Empty;

                dtos.Add(new HRNafDTO(naf.Id, employeeName, department, naf.CreatedAt));
            }

            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            return Ok(new PagedResult<HRNafDTO>
            {
                Data = dtos,
                TotalCount = totalCount,
                PageSize = pageSize,
                CurrentPage = page,
                TotalPages = totalPages
            });
        }
    }
}
```

- [ ] **Step 3: Build backend to verify no errors**

Run from `NAFServer/`:
```bash
dotnet build
```
Expected: `Build succeeded. 0 Error(s)`

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Application/DTOs/HR/HRNafDTO.cs NAFServer/src/API/Controllers/HRController.cs
git commit -m "feat(hr): add HRNafDTO and HRController with GET /api/hr/nafs"
```

---

### Task 2: Frontend — Routes and ProtectedRoute

**Files:**
- Modify: `NAFClient/src/app/routesEnum.ts`
- Modify: `NAFClient/src/features/auth/ProtectedRoute.tsx`

- [ ] **Step 1: Add HR routes to routesEnum.ts**

Current file (`NAFClient/src/app/routesEnum.ts`):
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

Replace with:
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

  HR = "/hr",
  HR_CREATE = "/hr/create",
}
```

- [ ] **Step 2: Add HR to ROLE_HOME in ProtectedRoute.tsx**

Current `ROLE_HOME` in `NAFClient/src/features/auth/ProtectedRoute.tsx`:
```ts
const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  REQUESTOR_APPROVER: "/NAF",
};
```

Replace with:
```ts
const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  REQUESTOR_APPROVER: "/NAF",
  HR: "/hr",
};
```

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/app/routesEnum.ts NAFClient/src/features/auth/ProtectedRoute.tsx
git commit -m "feat(hr): add HR and HR_CREATE routes, add HR to ROLE_HOME"
```

---

### Task 3: Frontend — HR types, api, hook

**Files:**
- Create: `NAFClient/src/features/hr/types.ts`
- Create: `NAFClient/src/features/hr/api.ts`
- Create: `NAFClient/src/features/hr/hooks/useHRNafs.ts`

- [ ] **Step 1: Create types.ts**

Create `NAFClient/src/features/hr/types.ts`:
```ts
export interface HRNafDTO {
  nafId: string;
  employeeName: string;
  department: string;
  dateCreated: string;
}
```

- [ ] **Step 2: Create api.ts**

Create `NAFClient/src/features/hr/api.ts`:
```ts
import { api } from "@/shared/api/client";
import type { PagedResult } from "@/shared/types/common/pagedResult";
import type { HRNafDTO } from "./types";

export const hrApi = {
  getNafs: (page: number) =>
    api
      .get<PagedResult<HRNafDTO>>("/hr/nafs", { params: { page } })
      .then((r) => r.data),
};
```

- [ ] **Step 3: Create useHRNafs.ts**

Create `NAFClient/src/features/hr/hooks/useHRNafs.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import { hrApi } from "../api";

export function useHRNafs(page: number) {
  const query = useQuery({
    queryKey: ["hr", "nafs", page],
    queryFn: () => hrApi.getNafs(page),
  });
  return { query };
}
```

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/features/hr/types.ts NAFClient/src/features/hr/api.ts NAFClient/src/features/hr/hooks/useHRNafs.ts
git commit -m "feat(hr): add HR types, api, and useHRNafs hook"
```

---

### Task 4: Frontend — HRLayout and hrNafColumns

**Files:**
- Create: `NAFClient/src/features/hr/components/HRLayout.tsx`
- Create: `NAFClient/src/features/hr/components/hrNafColumns.tsx`

- [ ] **Step 1: Create HRLayout.tsx**

Create `NAFClient/src/features/hr/components/HRLayout.tsx`:
```tsx
import { ClipboardList, FilePlus } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/shared/components/layout/Layout";
import { useAuth } from "@/features/auth/AuthContext";

const navItems = [
  { label: "Create NAF", icon: <FilePlus className="w-5 h-5" />, href: "/hr/create" },
  { label: "NAF History", icon: <ClipboardList className="w-5 h-5" />, href: "/hr" },
];

export default function HRLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Layout navItems={navItems} currentUser={{ name: user?.name ?? "HR" }} onLogout={handleLogout}>
      {children}
    </Layout>
  );
}
```

- [ ] **Step 2: Create hrNafColumns.tsx**

Create `NAFClient/src/features/hr/components/hrNafColumns.tsx`:
```tsx
import type { ColumnDef } from "@tanstack/react-table";
import type { HRNafDTO } from "../types";

export const hrNafColumns: ColumnDef<HRNafDTO>[] = [
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
    accessorKey: "department",
    header: "Department",
    size: 200,
    cell: ({ getValue }) => (
      <span className="text-sm text-foreground">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "dateCreated",
    header: "Date Created",
    size: 160,
    cell: ({ getValue }) => {
      const v = getValue<string>();
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
];
```

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/hr/components/HRLayout.tsx NAFClient/src/features/hr/components/hrNafColumns.tsx
git commit -m "feat(hr): add HRLayout and hrNafColumns"
```

---

### Task 5: Frontend — HRNAFHistoryPage

**Files:**
- Create: `NAFClient/src/features/hr/pages/HRNAFHistoryPage.tsx`

- [ ] **Step 1: Create HRNAFHistoryPage.tsx**

Create `NAFClient/src/features/hr/pages/HRNAFHistoryPage.tsx`:
```tsx
import { useState } from "react";
import HRLayout from "../components/HRLayout";
import { DataTable } from "@/shared/components/ui/datatable";
import { TablePagination } from "@/features/naf/components/tablePagination";
import { useHRNafs } from "../hooks/useHRNafs";
import { hrNafColumns } from "../components/hrNafColumns";

export default function HRNAFHistoryPage() {
  const [page, setPage] = useState(1);
  const { query } = useHRNafs(page);
  const result = query.data;

  return (
    <HRLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-amber-500">NAF History</h1>

        <DataTable
          columns={hrNafColumns}
          data={result?.data ?? []}
          isLoading={query.isLoading}
          emptyMessage="No NAFs found."
        />

        <TablePagination
          currentPage={result?.currentPage ?? 1}
          totalPages={result?.totalPages ?? 1}
          totalCount={result?.totalCount ?? 0}
          pageSize={result?.pageSize ?? 50}
          onPageChange={setPage}
        />
      </div>
    </HRLayout>
  );
}
```

- [ ] **Step 2: Run frontend build to check for type errors**

Run from `NAFClient/`:
```bash
npm run build
```
Expected: no TypeScript errors, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/hr/pages/HRNAFHistoryPage.tsx
git commit -m "feat(hr): add HRNAFHistoryPage"
```

---

### Task 6: Frontend — HRCreateNAFPage

**Files:**
- Create: `NAFClient/src/features/hr/pages/HRCreateNAFPage.tsx`

This page replicates the form logic from `createNAFDialog.tsx` as a full page (no dialog wrapper). On submit it navigates to `/hr`.

- [ ] **Step 1: Create HRCreateNAFPage.tsx**

Create `NAFClient/src/features/hr/pages/HRCreateNAFPage.tsx`:
```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronDown,
  Laptop,
  MapPin,
  Monitor,
  User,
} from "lucide-react";
import HRLayout from "../components/HRLayout";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/common/searchbar";
import { searchEmployees } from "@/shared/api/employeeService";
import { getResourceGroups } from "@/shared/api/resourceService";
import { useNAF } from "@/features/naf/hooks/useNAF";
import { useAuth } from "@/features/auth/AuthContext";
import type { Employee } from "@/shared/types/api/employee";

const WITH_HARDWARE_AUTO_ADD = [
  "Microsoft 365 (E1)",
  "Basic Internet",
  "Active Directory",
  "Printer Access (Black and White)",
];
const NO_HARDWARE_AUTO_ADD = ["Active Directory"];

function EmployeeCard({ employee }: { employee: Employee }) {
  const initials =
    `${employee.firstName[0] ?? ""}${employee.lastName[0] ?? ""}`.toUpperCase();
  return (
    <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            {employee.lastName}, {employee.firstName}{" "}
            {employee.middleName ?? ""}
          </p>
          <p className="font-mono text-[10px] text-gray-400 mt-0.5 tracking-wider">
            {employee.id}
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Monitor className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          <span>{employee.position || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <User className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          <span>{employee.departmentDesc || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          <span>{employee.location || "—"}</span>
        </div>
      </div>
    </div>
  );
}

export default function HRCreateNAFPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeHasNAFAlert, setShowEmployeeHasNAFAlert] = useState(false);
  const [hardwareId, setHardwareId] = useState<number>(0);
  const [dateNeeded, setDateNeeded] = useState("");

  const { employeeNAFs, createNAFAsync, isLoading: employeeLoading } = useNAF({
    employeeId: selectedEmployee?.id,
  });

  const resourceGroupsQuery = useQuery({
    queryKey: ["resourceGroups"],
    queryFn: getResourceGroups,
    staleTime: 1000 * 60 * 10,
  });

  const hardwareResources =
    resourceGroupsQuery.data
      ?.find((g) => g.name === "Hardware")
      ?.resources.filter((r) => r.isActive) ?? [];

  const selectedHardware = hardwareResources.find((r) => r.id === hardwareId) ?? null;
  const autoAddedNames = selectedHardware ? WITH_HARDWARE_AUTO_ADD : NO_HARDWARE_AUTO_ADD;

  const fetchEmployee = async (query: string): Promise<Employee[]> => {
    try {
      return await searchEmployees(query);
    } catch {
      return [];
    }
  };

  const reset = () => {
    setSelectedEmployee(null);
    setShowEmployeeHasNAFAlert(false);
    setHardwareId(0);
    setDateNeeded("");
  };

  useEffect(() => {
    setShowEmployeeHasNAFAlert(
      !!(employeeNAFs.data && employeeNAFs.data.length > 0),
    );
  }, [employeeNAFs.data]);

  const canSubmit = !!selectedEmployee && !showEmployeeHasNAFAlert && !employeeLoading;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedEmployee || !user) return;
    try {
      await createNAFAsync({
        employeeId: selectedEmployee.id,
        requestorId: user.employeeId,
        hardwareId,
        dateNeeded: dateNeeded || null,
      });
      reset();
      navigate("/hr");
    } catch {
      /* surfaced by toast */
    }
  }

  return (
    <HRLayout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-amber-500 mb-6">New Network Access Form</h1>

        <form onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-5" style={{ minHeight: 420 }}>
              {/* Left: Employee panel */}
              <div className="col-span-2 bg-gray-50/80 border-r border-gray-100 p-5 flex flex-col gap-3">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                  Requesting Access For
                </p>

                <SearchBar<Employee>
                  fetchResults={fetchEmployee}
                  placeholder="Search by name or ID…"
                  onSelect={(e) => setSelectedEmployee(e)}
                  getKey={(e) => e.id}
                  getValue={(e) => e.id}
                  renderItem={(e) => (
                    <div className="flex flex-col py-0.5">
                      <span className="text-xs font-medium text-gray-800">
                        {e.lastName}, {e.firstName} {e.middleName ?? ""}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {e.id} · {e.position}
                      </span>
                    </div>
                  )}
                />

                {selectedEmployee ? (
                  <EmployeeCard employee={selectedEmployee} />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400">No employee selected</p>
                      <p className="text-[10px] text-gray-300 mt-0.5">Search above to continue</p>
                    </div>
                  </div>
                )}

                {showEmployeeHasNAFAlert && selectedEmployee && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-700">Cannot create NAF</p>
                      <p className="text-[10px] text-red-600 mt-0.5 leading-snug">
                        {selectedEmployee.id} already has an active NAF for{" "}
                        {selectedEmployee.departmentDesc ?? "their department"}.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Config panel */}
              <div
                className={`col-span-3 p-5 flex flex-col gap-5 ${!selectedEmployee ? "opacity-40 pointer-events-none" : ""}`}
              >
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                  Resource Configuration
                </p>

                {/* Hardware select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-gray-400" />
                    Hardware
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all pr-8"
                      value={hardwareId}
                      onChange={(e) => setHardwareId(Number(e.target.value))}
                    >
                      <option value={0}>None</option>
                      {hardwareResources.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Date needed */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-xs font-medium text-gray-600 flex items-center gap-1.5"
                    htmlFor="hr-date-needed"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                    Date Needed
                  </label>
                  <input
                    id="hr-date-needed"
                    type="date"
                    value={dateNeeded}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDateNeeded(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all"
                  />
                </div>

                {/* Auto-added resources */}
                <div className="flex-1 flex flex-col gap-2">
                  <p className="text-xs font-medium text-gray-600">Automatically included</p>
                  <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-3 space-y-1.5">
                    {selectedHardware && (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 shrink-0">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                        <span className="text-xs text-amber-800">{selectedHardware.name}</span>
                      </div>
                    )}
                    {autoAddedNames.map((name) => (
                      <div key={name} className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-300 shrink-0">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                        <span className="text-xs text-amber-700">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-3.5 flex items-center justify-between bg-gray-50/50">
              <p className="text-[10px] text-gray-400">
                {selectedEmployee
                  ? `Submitting for ${selectedEmployee.firstName} ${selectedEmployee.lastName}`
                  : "Select an employee to continue"}
              </p>
              <Button
                type="submit"
                size="sm"
                disabled={!canSubmit}
                className="bg-amber-500 hover:bg-amber-600 text-white border-0 min-w-[80px]"
              >
                {employeeLoading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Checking…
                  </span>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </HRLayout>
  );
}
```

- [ ] **Step 2: Run frontend build to check for type errors**

Run from `NAFClient/`:
```bash
npm run build
```
Expected: no TypeScript errors, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/hr/pages/HRCreateNAFPage.tsx
git commit -m "feat(hr): add HRCreateNAFPage"
```

---

### Task 7: Frontend — Wire routes and add Admin Create NAF button

**Files:**
- Modify: `NAFClient/src/app/router.tsx`
- Modify: `NAFClient/src/features/admin/pages/AdminNAFListPage.tsx`

- [ ] **Step 1: Add HR lazy imports to router.tsx**

In `NAFClient/src/app/router.tsx`, add these lazy imports after the existing `AdminResourceRequestsPage` import:

```tsx
const HRNAFHistoryPage = lazy(
  () => import("@/features/hr/pages/HRNAFHistoryPage"),
);
const HRCreateNAFPage = lazy(
  () => import("@/features/hr/pages/HRCreateNAFPage"),
);
```

- [ ] **Step 2: Add HR routes to the Routes block**

In `NAFClient/src/app/router.tsx`, add these routes before the catch-all `<Route path="*" ...>` line:

```tsx
{/* HR routes */}
<Route
  path={RoutesEnum.HR}
  element={
    <ProtectedRoute requiredRole="HR">
      <HRNAFHistoryPage />
    </ProtectedRoute>
  }
/>
<Route
  path={RoutesEnum.HR_CREATE}
  element={
    <ProtectedRoute requiredRole="HR">
      <HRCreateNAFPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 3: Add Create NAF button to AdminNAFListPage**

In `NAFClient/src/features/admin/pages/AdminNAFListPage.tsx`, add the `CreateNAFDialog` import:

```tsx
import { CreateNAFDialog } from "@/features/naf/components/createNAFDialog";
```

Then add the `<CreateNAFDialog />` component alongside the page heading. Replace:

```tsx
        <h1 className="text-2xl font-bold text-amber-500">
          Network Access Requests
        </h1>
```

With:

```tsx
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-500">
            Network Access Requests
          </h1>
          <CreateNAFDialog />
        </div>
```

- [ ] **Step 4: Run frontend build to verify all types compile**

Run from `NAFClient/`:
```bash
npm run build
```
Expected: no TypeScript errors, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add NAFClient/src/app/router.tsx NAFClient/src/features/admin/pages/AdminNAFListPage.tsx
git commit -m "feat(hr): wire HR routes in router, add Create NAF button to admin NAF list"
```
