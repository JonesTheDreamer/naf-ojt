# Admin NAF Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two admin pages — a location-scoped NAF list with read-only detail, and a location-scoped implementation list with status actions — to the existing admin area.

**Architecture:** Eight tasks: two backend tasks (new paginated NAF list endpoint, location-scope the for-implementations endpoint), followed by six frontend tasks (setup, API/hook, NAF list page, NAF detail page, implementation list, implementation detail). Each task commits independently.

**Tech Stack:** ASP.NET Core 8 / EF Core (backend), React 19 / TypeScript / Tailwind v4 / ShadCN / React Query (frontend)

---

## File Map

**Created:**
- `NAFServer/src/Infrastructure/Persistence/Repositories/NAFRepository.cs` — new `GetNAFsByLocationPagedAsync`
- `NAFClient/src/features/admin/hooks/useAdminNAFs.ts`
- `NAFClient/src/features/admin/components/implementationColumns.tsx`
- `NAFClient/src/features/admin/components/AdminResourceRequestList.tsx`
- `NAFClient/src/features/admin/components/ImplementationResourceRequestItem.tsx`
- `NAFClient/src/features/admin/components/ImplementationResourceRequestList.tsx`
- `NAFClient/src/features/admin/pages/AdminNAFListPage.tsx`
- `NAFClient/src/features/admin/pages/AdminNAFDetailPage.tsx`
- `NAFClient/src/features/admin/pages/AdminImplementationDetailPage.tsx`

**Modified:**
- `NAFServer/src/Domain/Interface/Repository/INAFRepository.cs`
- `NAFServer/src/Application/Interfaces/INAFService.cs`
- `NAFServer/src/Application/Services/NAFService.cs`
- `NAFServer/src/API/Controllers/AdminController.cs`
- `NAFServer/src/Domain/Interface/Repository/IImplementationRepository.cs`
- `NAFServer/src/Application/Interfaces/IImplementationService.cs`
- `NAFServer/src/Application/Services/ImplementationService.cs`
- `NAFServer/src/API/Controllers/ImplementationController.cs`
- `NAFClient/src/shared/components/layout/AdminLayout.tsx`
- `NAFClient/src/features/naf/components/NAFDetailHeader.tsx`
- `NAFClient/src/app/routesEnum.ts`
- `NAFClient/src/app/router.tsx`
- `NAFClient/src/features/admin/api.ts`
- `NAFClient/src/features/admin/hooks/useForImplementations.ts`
- `NAFClient/src/features/admin/pages/ForImplementationsPage.tsx`

**Deleted:**
- `NAFClient/src/features/admin/components/ImplementationViewToggle.tsx`
- `NAFClient/src/features/admin/components/ImplementationNAFAccordion.tsx`
- `NAFClient/src/features/admin/components/ImplementationResourceAccordion.tsx`
- `NAFClient/src/features/admin/components/ImplementationResourceRequestRow.tsx`

---

## Task 1: Backend — Admin NAF list endpoint

**Files:**
- Modify: `NAFServer/src/Domain/Interface/Repository/INAFRepository.cs`
- Modify: `NAFServer/src/Infrastructure/Persistence/Repositories/NAFRepository.cs`
- Modify: `NAFServer/src/Application/Interfaces/INAFService.cs`
- Modify: `NAFServer/src/Application/Services/NAFService.cs`
- Modify: `NAFServer/src/API/Controllers/AdminController.cs`

- [ ] **Step 1: Add method to INAFRepository**

In `NAFServer/src/Domain/Interface/Repository/INAFRepository.cs`, add:

```csharp
using NAFServer.src.Application.DTOs.NAF;
using NAFServer.src.Domain.Entities;
using static NAFServer.src.Application.DTOs.Common.PaginatedDTO;
namespace NAFServer.src.Domain.Interface.Repository
{
    public interface INAFRepository
    {
        public Task<NAF> GetByIdAsync(Guid nafId);
        public Task<List<NAFDTO>> GetByEmployeeIdAsync(string employeeId);
        public Task<PagedResult<NAFDTO>> GetNAFUnderEmployee(string employeeId, int page = 1);
        public Task<PagedResult<NAFDTO>> GetNAFToApprove(string employeeId, int page = 1);
        public Task<bool> EmployeeHasNAFForDepartmentAsync(string employeeId, int departmentId);
        public Task<PagedResult<NAFDTO>> GetNAFsByLocationPagedAsync(int locationId, string status, int page);
    }
}
```

- [ ] **Step 2: Implement in NAFRepository**

In `NAFServer/src/Infrastructure/Persistence/Repositories/NAFRepository.cs`, add `using NAFServer.src.Domain.Enums;` to the existing usings block, then append the method to the class:

```csharp
// At top of file, add this using:
using NAFServer.src.Domain.Enums;
```

```csharp
// Add this method to the NAFRepository class:
public async Task<PagedResult<NAFDTO>> GetNAFsByLocationPagedAsync(int locationId, string status, int page)
{
    int pageSize = 20;

    var query = _context.NAFs.Where(n => n.LocationId == locationId);

    switch (status.ToLower())
    {
        case "open":
            query = query.Where(n => n.Progress == Progress.OPEN);
            break;
        case "in_progress":
            query = query.Where(n => n.Progress == Progress.IN_PROGRESS);
            break;
        case "accomplished":
            query = query.Where(n => n.Progress == Progress.ACCOMPLISHED);
            break;
        default:
            query = query.Where(n =>
                n.Progress == Progress.OPEN ||
                n.Progress == Progress.IN_PROGRESS ||
                n.Progress == Progress.ACCOMPLISHED);
            break;
    }

    var totalCount = await query.CountAsync();
    int skip = (page - 1) * pageSize;

    var nafs = await query
        .OrderByDescending(n => n.SubmittedAt)
        .IncludeResourceRequestsWithAdditionalInfo()
        .Skip(skip)
        .Take(pageSize)
        .AsNoTracking()
        .ToListAsync();

    var employeeIds = nafs.Select(n => n.EmployeeId).Distinct().ToList();
    var employees = new List<Employee>();
    foreach (var id in employeeIds)
    {
        var emp = await _employeeRepository.GetByIdAsync(id);
        if (emp != null) employees.Add(emp);
    }
    var employeeLookup = employees.ToDictionary(e => e.Id);

    var nafDTOs = new List<NAFDTO>();
    foreach (var naf in nafs)
    {
        if (!employeeLookup.TryGetValue(naf.EmployeeId, out var emp)) continue;
        nafDTOs.Add(NAFMapper.ToDTO(naf, emp));
    }

    return new PagedResult<NAFDTO>
    {
        Data = nafDTOs,
        TotalCount = totalCount,
        PageSize = pageSize,
        CurrentPage = page,
        TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
    };
}
```

- [ ] **Step 3: Add method to INAFService**

In `NAFServer/src/Application/Interfaces/INAFService.cs`, add the signature:

```csharp
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
        public Task<List<NAFDTO>> GetNAFByLocationAsync(int locationId);
        Task<List<AddBasicResourceResultDTO>> AddBasicResourcesToNAFAsync(Guid nafId, List<BasicResourceWithDateDTO> resources);
        Task<PagedResult<NAFDTO>> GetNAFsByLocationPagedAsync(int locationId, string status, int page);
    }
}
```

- [ ] **Step 4: Implement in NAFService**

In `NAFServer/src/Application/Services/NAFService.cs`, add this method to the `NAFService` class (place it near the other public methods):

```csharp
public async Task<PagedResult<NAFDTO>> GetNAFsByLocationPagedAsync(int locationId, string status, int page)
{
    return await _nafRepository.GetNAFsByLocationPagedAsync(locationId, status, page);
}
```

- [ ] **Step 5: Add endpoint to AdminController**

Replace the entire `AdminController.cs` with:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.Interfaces;

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

        [HttpPost("users")]
        public async Task<IActionResult> AddUser([FromBody] AddUserDTO dto)
        {
            try
            {
                await _adminService.AddUserAsync(dto);
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
            [FromQuery] int page = 1)
        {
            return Ok(await _nafService.GetNAFsByLocationPagedAsync(locationId, status, page));
        }
    }
}
```

- [ ] **Step 6: Build and verify**

Run in `NAFServer/`:
```bash
dotnet build
```

Expected: Build succeeded, 0 errors.

- [ ] **Step 7: Commit**

```bash
git add NAFServer/src/Domain/Interface/Repository/INAFRepository.cs \
        NAFServer/src/Infrastructure/Persistence/Repositories/NAFRepository.cs \
        NAFServer/src/Application/Interfaces/INAFService.cs \
        NAFServer/src/Application/Services/NAFService.cs \
        NAFServer/src/API/Controllers/AdminController.cs
git commit -m "feat: add paginated admin NAF list endpoint scoped by location"
```

---

## Task 2: Backend — Location-scope for-implementations

**Files:**
- Modify: `NAFServer/src/Domain/Interface/Repository/IImplementationRepository.cs`
- Modify: `NAFServer/src/Infrastructure/Persistence/Repositories/ImplementationRepository.cs`
- Modify: `NAFServer/src/Application/Interfaces/IImplementationService.cs`
- Modify: `NAFServer/src/Application/Services/ImplementationService.cs`
- Modify: `NAFServer/src/API/Controllers/ImplementationController.cs`

- [ ] **Step 1: Update IImplementationRepository**

In `NAFServer/src/Domain/Interface/Repository/IImplementationRepository.cs`, change the signature of `GetForImplementationsAsync` to accept `int locationId`:

```csharp
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IImplementationRepository
    {
        Task<ResourceRequestImplementation> GetByIdAsync(string id);
        Task<List<NAF>> GetForImplementationsAsync(int locationId);
        Task<List<NAF>> GetMyTasksByEmployeeIdAsync(string employeeId);
        Task<ResourceRequestImplementation?> GetByResourceRequestIdAsync(Guid resourceRequestId);
        Task<ResourceRequestImplementation> CreateAsync(Guid resourceRequestId);
    }
}
```

- [ ] **Step 2: Update ImplementationRepository**

In `NAFServer/src/Infrastructure/Persistence/Repositories/ImplementationRepository.cs`, update `GetForImplementationsAsync` to add the location filter:

```csharp
public async Task<List<NAF>> GetForImplementationsAsync(int locationId)
{
    var nafs = await _context.NAFs
        .Where(n => n.LocationId == locationId && n.ResourceRequests.Any(rr => rr.Progress == Progress.IMPLEMENTATION))
        .Include(n => n.ResourceRequests.Where(rr => rr.Progress == Progress.IMPLEMENTATION))
            .ThenInclude(rr => rr.Resource)
        .Include(n => n.ResourceRequests.Where(rr => rr.Progress == Progress.IMPLEMENTATION))
            .ThenInclude(rr => rr.ResourceRequestPurposes)
        .Include(n => n.ResourceRequests.Where(rr => rr.Progress == Progress.IMPLEMENTATION))
            .ThenInclude(rr => rr.ResourceRequestsApprovalSteps)
                .ThenInclude(step => step.Histories)
        .Include(n => n.ResourceRequests.Where(rr => rr.Progress == Progress.IMPLEMENTATION))
            .ThenInclude(rr => rr.ResourceRequestImplementation)
        .AsNoTracking()
        .ToListAsync();

    var rrIds = nafs.SelectMany(n => n.ResourceRequests).Select(rr => rr.Id).ToList();

    if (rrIds.Any())
    {
        await _context.ResourceRequests
            .Where(rr => rrIds.Contains(rr.Id) && rr.AdditionalInfo is InternetRequestInfo)
            .Include(rr => ((InternetRequestInfo)rr.AdditionalInfo).InternetResource)
                .ThenInclude(ir => ir.Purpose)
            .LoadAsync();

        await _context.ResourceRequests
            .Where(rr => rrIds.Contains(rr.Id) && rr.AdditionalInfo is SharedFolderRequestInfo)
            .Include(rr => ((SharedFolderRequestInfo)rr.AdditionalInfo).SharedFolder)
            .LoadAsync();

        await _context.ResourceRequests
            .Where(rr => rrIds.Contains(rr.Id) && rr.AdditionalInfo is GroupEmailRequestInfo)
            .Include(rr => ((GroupEmailRequestInfo)rr.AdditionalInfo).GroupEmail)
            .LoadAsync();
    }

    return nafs;
}
```

- [ ] **Step 3: Update IImplementationService**

In `NAFServer/src/Application/Interfaces/IImplementationService.cs`, add `int locationId` to `GetForImplementationsAsync`:

```csharp
using NAFServer.src.Application.DTOs.NAF;
using NAFServer.src.Application.DTOs.ResourceRequest;

namespace NAFServer.src.Application.Interfaces
{
    public interface IImplementationService
    {
        Task<ResourceRequestImplementationDTO> SetToInProgress(string request, string employeeId);
        Task<ResourceRequestImplementationDTO> SetToDelayed(string request, string delayReason);
        Task<ResourceRequestImplementationDTO> SetToAccomplished(string request);
        Task<List<NAFDTO>> GetMyTasksAsync(string employeeId);
        Task<List<NAFDTO>> GetForImplementationsAsync(int locationId);
        Task<ForImplementationItemDTO> AssignToMeAsync(Guid resourceRequestId, string employeeId);
    }
}
```

- [ ] **Step 4: Update ImplementationService**

In `NAFServer/src/Application/Services/ImplementationService.cs`, update `GetForImplementationsAsync`:

```csharp
public async Task<List<NAFDTO>> GetForImplementationsAsync(int locationId)
{
    var nafs = await _implementationRepository.GetForImplementationsAsync(locationId);
    return await MapNAFsToDTO(nafs);
}
```

- [ ] **Step 5: Update ImplementationController**

In `NAFServer/src/API/Controllers/ImplementationController.cs`, add `[FromQuery] int locationId` to `GetForImplementations` and pass it to the service:

```csharp
[HttpGet("for-implementations")]
public async Task<IActionResult> GetForImplementations([FromQuery] int locationId)
{
    return Ok(await _implementationService.GetForImplementationsAsync(locationId));
}
```

- [ ] **Step 6: Build and verify**

```bash
dotnet build
```

Expected: Build succeeded, 0 errors.

- [ ] **Step 7: Commit**

```bash
git add NAFServer/src/Domain/Interface/Repository/IImplementationRepository.cs \
        NAFServer/src/Infrastructure/Persistence/Repositories/ImplementationRepository.cs \
        NAFServer/src/Application/Interfaces/IImplementationService.cs \
        NAFServer/src/Application/Services/ImplementationService.cs \
        NAFServer/src/API/Controllers/ImplementationController.cs
git commit -m "feat: scope for-implementations endpoint by locationId"
```

---

## Task 3: Frontend setup — nav, detail header, routes

**Files:**
- Modify: `NAFClient/src/shared/components/layout/AdminLayout.tsx`
- Modify: `NAFClient/src/features/naf/components/NAFDetailHeader.tsx`
- Modify: `NAFClient/src/app/routesEnum.ts`
- Modify: `NAFClient/src/app/router.tsx`

- [ ] **Step 1: Add NAFs and Implementations to AdminLayout nav**

Replace `NAFClient/src/shared/components/layout/AdminLayout.tsx` with:

```tsx
import { Home, Users, MapPin, FileText, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import Layout from "./Layout";
import { useAuth } from "@/features/auth/AuthContext";

const navItems = [
  { label: "Home", icon: <Home className="w-5 h-5" />, href: "/admin" },
  { label: "NAFs", icon: <FileText className="w-5 h-5" />, href: "/admin/NAF" },
  { label: "Implementations", icon: <Wrench className="w-5 h-5" />, href: "/admin/for-implementations" },
  { label: "Roles", icon: <Users className="w-5 h-5" />, href: "/admin/roles" },
  { label: "Locations", icon: <MapPin className="w-5 h-5" />, href: "/admin/locations" },
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

- [ ] **Step 2: Make onDeactivate optional in NAFDetailHeader**

Replace `NAFClient/src/features/naf/components/NAFDetailHeader.tsx` with:

```tsx
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NAF } from "@/shared/types/api/naf";

function DetailField({ label, value, placeholder = "—" }: { label: string; value?: string | null; placeholder?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      {value ? <p className="text-sm font-medium">{value}</p> : <p className="text-sm text-muted-foreground italic">{placeholder}</p>}
    </div>
  );
}

interface NAFDetailHeaderProps {
  naf: NAF;
  onDeactivate?: () => void;
}

export function NAFDetailHeader({ naf, onDeactivate }: NAFDetailHeaderProps) {
  const employee = naf?.employee;

  if (!employee) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg font-bold">Employee Details</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground italic">Employee details unavailable.</p></CardContent>
      </Card>
    );
  }

  const fullName = [employee.lastName, employee.firstName, employee.middleName].filter(Boolean).join(", ");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 gap-4 flex-wrap">
        <CardTitle className="text-lg font-bold">Employee Details</CardTitle>
        {onDeactivate && (
          <Button size="sm" className="bg-red-400 hover:bg-red-500 text-white gap-1.5 shrink-0" onClick={onDeactivate}>
            Deactivate Access <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
          <div className="space-y-4">
            <DetailField label="Employee Name" value={fullName} />
            <DetailField label="Company" value={employee.company} />
            <DetailField label="Location" value={employee.location} />
          </div>
          <div className="space-y-4">
            <DetailField label="Department" value={employee.departmentDesc ?? employee.departmentId} />
            <DetailField label="Position" value={employee.position} />
            <DetailField label="Domain" value={null} placeholder="No Domain Yet" />
            <DetailField label="Username" value={null} placeholder="No Username Yet" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Add two new route constants to routesEnum.ts**

Replace `NAFClient/src/app/routesEnum.ts` with:

```ts
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
  ADMIN_ROLES = "/admin/roles",
  ADMIN_LOCATIONS = "/admin/locations",

  // Technical Team routes
  TECH = "/tech",
  TECH_MY_TASKS = "/tech/my-tasks",
}
```

- [ ] **Step 4: Fix ADMIN_NAF route and add three new routes in router.tsx**

Replace `NAFClient/src/app/router.tsx` with:

```tsx
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
const RolesPage = lazy(() => import("@/features/admin/pages/RolesPage"));
const LocationsPage = lazy(
  () => import("@/features/admin/pages/LocationsPage"),
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
          path={RoutesEnum.ADMIN_ROLES}
          element={
            <ProtectedRoute
              requiredRole="ADMIN"
              loginPath={RoutesEnum.LOGIN_ADMIN}
            >
              <RolesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_LOCATIONS}
          element={
            <ProtectedRoute
              requiredRole="ADMIN"
              loginPath={RoutesEnum.LOGIN_ADMIN}
            >
              <LocationsPage />
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

- [ ] **Step 5: Build frontend to verify types**

Run in `NAFClient/`:
```bash
npm run build
```

Expected: 0 TypeScript errors, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add NAFClient/src/shared/components/layout/AdminLayout.tsx \
        NAFClient/src/features/naf/components/NAFDetailHeader.tsx \
        NAFClient/src/app/routesEnum.ts \
        NAFClient/src/app/router.tsx
git commit -m "feat: add admin nav items, make NAFDetailHeader onDeactivate optional, add admin NAF routes"
```

---

## Task 4: Frontend — admin API client + useAdminNAFs hook

**Files:**
- Modify: `NAFClient/src/features/admin/api.ts`
- Create: `NAFClient/src/features/admin/hooks/useAdminNAFs.ts`

- [ ] **Step 1: Update admin/api.ts**

Replace `NAFClient/src/features/admin/api.ts` with:

```ts
import { api } from "@/shared/api/client";
import type { NAF } from "@/shared/types/api/naf";
import type { PagedResult } from "@/shared/types/common/pagedResult";
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

  // Admin NAF list (new)
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

- [ ] **Step 2: Create useAdminNAFs.ts**

Create `NAFClient/src/features/admin/hooks/useAdminNAFs.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api";

export function useAdminNAFs(
  locationId: number | null,
  status: string,
  page: number,
) {
  const nafQuery = useQuery({
    queryKey: ["admin", "nafs", locationId, status, page],
    queryFn: () => adminApi.getAdminNAFs(locationId!, status, page),
    enabled: locationId != null,
  });

  return { nafQuery };
}
```

- [ ] **Step 3: Build to verify**

```bash
npm run build
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/features/admin/api.ts \
        NAFClient/src/features/admin/hooks/useAdminNAFs.ts
git commit -m "feat: add getAdminNAFs to admin api, create useAdminNAFs hook"
```

---

## Task 5: AdminNAFListPage

**Files:**
- Create: `NAFClient/src/features/admin/pages/AdminNAFListPage.tsx`

- [ ] **Step 1: Create AdminNAFListPage.tsx**

Create `NAFClient/src/features/admin/pages/AdminNAFListPage.tsx`:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { DataTable } from "@/shared/components/ui/datatable";
import { TablePagination } from "@/features/naf/components/tablePagination";
import { columns } from "@/features/naf/components/nafColumns";
import { useAdminNAFs } from "../hooks/useAdminNAFs";
import { useAuth } from "@/features/auth/AuthContext";
import { RoutesEnum } from "@/app/routesEnum";
import type { NAF } from "@/shared/types/api/naf";

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Accomplished", value: "accomplished" },
] as const;

export default function AdminNAFListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const locationId = user?.locationId ?? null;

  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { nafQuery } = useAdminNAFs(locationId, status, page);
  const result = nafQuery.data;

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleRowClick = (naf: NAF) => {
    navigate(`/admin/NAF/${naf.id}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-amber-500">Network Access Requests</h1>

        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusChange(tab.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                status === tab.value
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={result?.data ?? []}
          isLoading={nafQuery.isLoading}
          onRowClick={handleRowClick}
          emptyMessage="No Network Access Forms found."
        />

        <TablePagination
          currentPage={result?.currentPage ?? 1}
          totalPages={result?.totalPages ?? 1}
          totalCount={result?.totalCount ?? 0}
          pageSize={result?.pageSize ?? 20}
          onPageChange={setPage}
        />
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Build to verify**

```bash
npm run build
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/admin/pages/AdminNAFListPage.tsx
git commit -m "feat: add AdminNAFListPage with status tabs and server-driven pagination"
```

---

## Task 6: AdminResourceRequestList + AdminNAFDetailPage

**Files:**
- Create: `NAFClient/src/features/admin/components/AdminResourceRequestList.tsx`
- Create: `NAFClient/src/features/admin/pages/AdminNAFDetailPage.tsx`

- [ ] **Step 1: Create AdminResourceRequestList.tsx**

Create `NAFClient/src/features/admin/components/AdminResourceRequestList.tsx`:

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/shared/utils/utils";
import type { NAF, ResourceRequest } from "@/shared/types/api/naf";
import { Progress } from "@/shared/types/enum/progress";
import { Status } from "@/shared/types/enum/status";
import { PROGRESS_CONFIG } from "@/features/naf/components/progressBadge";
import { AdditionalInfoBlock } from "@/features/naf/components/resource-request/ResourceRequestContent";
import { ResourceIcon } from "@/features/naf/components/resource-request/resourceRequestUtils";

function ApprovalStepsBlock({ request }: { request: ResourceRequest }) {
  if (!request.steps || request.steps.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-muted-foreground mb-2">Approval Steps</p>
      <div className="space-y-1.5">
        {request.steps.map((step) => {
          const lastHistory = [...step.histories]
            .sort((a, b) => new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime())[0];
          const statusLabel = !lastHistory
            ? "Pending"
            : lastHistory.status === Status.APPROVED
            ? "Approved"
            : lastHistory.status === Status.REJECTED
            ? "Rejected"
            : "Pending";
          const statusColor =
            lastHistory?.status === Status.APPROVED
              ? "text-emerald-600"
              : lastHistory?.status === Status.REJECTED
              ? "text-red-500"
              : "text-muted-foreground";
          return (
            <div key={step.id} className="flex items-center justify-between text-sm">
              <span className="text-foreground">{step.approverName ?? step.approverId}</span>
              <span className={cn("text-xs font-semibold", statusColor)}>{statusLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AdminResourceRequestListProps {
  naf: NAF;
}

export function AdminResourceRequestList({ naf }: AdminResourceRequestListProps) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Requests</h2>
      <Accordion type="multiple" className="space-y-2">
        {naf.resourceRequests.map((req) => {
          const progress = req.progress as unknown as Progress;
          const config = PROGRESS_CONFIG[progress];
          return (
            <AccordionItem
              key={req.id}
              value={req.id}
              className="border rounded-lg px-0 overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ResourceIcon iconUrl={req.resource.iconUrl} name={req.resource.name} />
                  <span className="text-sm font-medium truncate">{req.resource.name}</span>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold mr-2 shrink-0",
                    config?.className
                      .split(" ")
                      .filter((c) => c.startsWith("text-"))
                      .join(" "),
                  )}
                >
                  {config?.label ?? String(progress)}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2 space-y-3">
                <ApprovalStepsBlock request={req} />
                {req.additionalInfo && <AdditionalInfoBlock info={req.additionalInfo} />}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
```

- [ ] **Step 2: Create AdminNAFDetailPage.tsx**

Create `NAFClient/src/features/admin/pages/AdminNAFDetailPage.tsx`:

```tsx
import { useParams, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useNAF } from "@/features/naf/hooks/useNAF";
import { NAFDetailHeader } from "@/features/naf/components/NAFDetailHeader";
import { AdminResourceRequestList } from "../components/AdminResourceRequestList";
import { RoutesEnum } from "@/app/routesEnum";
import { ProgressStatus } from "@/shared/types/api/naf";

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function nafProgressColor(progress: number): string {
  switch (progress as ProgressStatus) {
    case ProgressStatus["In Progress"]: return "text-blue-600";
    case ProgressStatus.Accomplished: return "text-emerald-600";
    case ProgressStatus.Rejected: return "text-red-500";
    default: return "text-amber-500";
  }
}

export default function AdminNAFDetailPage() {
  const { nafId } = useParams<{ nafId: string }>();
  const navigate = useNavigate();
  const { nafQuery, isLoading, isError } = useNAF({ nafId });
  const naf = nafQuery.data;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto w-full space-y-6 pb-12 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate(RoutesEnum.ADMIN_NAF)}
        >
          <ChevronLeft className="h-4 w-4" /> Back to NAFs
        </Button>

        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {isError && (
          <p className="text-sm text-muted-foreground">Failed to load NAF details.</p>
        )}

        {naf && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-semibold text-foreground">Reference:</span>
                  <span className="text-base font-bold text-amber-500">{naf.reference}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last Update: {formatDateTime(naf.updatedAt)}
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-0.5 shrink-0">
                <span className="text-xs text-muted-foreground">Status</span>
                <span
                  className={`text-sm font-bold ${nafProgressColor(naf.progress as unknown as number)}`}
                >
                  {ProgressStatus[naf.progress as unknown as number]}
                </span>
              </div>
            </div>
            <Separator />
            <NAFDetailHeader naf={naf} />
            <AdminResourceRequestList naf={naf} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 3: Build to verify**

```bash
npm run build
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/features/admin/components/AdminResourceRequestList.tsx \
        NAFClient/src/features/admin/pages/AdminNAFDetailPage.tsx
git commit -m "feat: add AdminResourceRequestList and AdminNAFDetailPage (read-only)"
```

---

## Task 7: Implementation list — columns, hook update, page rewrite, delete old components

**Files:**
- Create: `NAFClient/src/features/admin/components/implementationColumns.tsx`
- Modify: `NAFClient/src/features/admin/hooks/useForImplementations.ts`
- Modify: `NAFClient/src/features/admin/pages/ForImplementationsPage.tsx`
- Delete: `ImplementationViewToggle.tsx`, `ImplementationNAFAccordion.tsx`, `ImplementationResourceAccordion.tsx`, `ImplementationResourceRequestRow.tsx`

- [ ] **Step 1: Create implementationColumns.tsx**

Create `NAFClient/src/features/admin/components/implementationColumns.tsx`:

```tsx
import type { ColumnDef } from "@tanstack/react-table";
import type { NAF, ResourceRequest } from "@/shared/types/api/naf";
import { Progress } from "@/shared/types/enum/progress";

function getContrastColor(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#374151" : "#ffffff";
}

export function getClosestDateNeeded(naf: NAF): string | undefined {
  const dates = naf.resourceRequests
    .filter(
      (rr) =>
        (rr.progress as unknown as Progress) === Progress.IMPLEMENTATION &&
        rr.dateNeeded,
    )
    .map((rr) => rr.dateNeeded!);
  if (!dates.length) return undefined;
  return dates.sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  )[0];
}

function EmployeeCell({ row }: { row: NAF }) {
  const { firstName, lastName, middleName, departmentDesc, departmentId } =
    row.employee;
  const fullName = `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ""}`;
  const dept = departmentDesc ?? departmentId;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-semibold text-sm text-foreground">{fullName}</span>
      {dept && <span className="text-xs text-muted-foreground">{dept}</span>}
    </div>
  );
}

function ImplementationRequestBadges({
  requests,
}: {
  requests: ResourceRequest[];
}) {
  const implRequests = requests.filter(
    (rr) => (rr.progress as unknown as Progress) === Progress.IMPLEMENTATION,
  );
  if (!implRequests.length)
    return <span className="text-muted-foreground text-sm">—</span>;

  const first = implRequests[0];
  const overflow = implRequests.length - 1;

  return (
    <div className="flex flex-col gap-1">
      <span
        className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-medium w-fit min-w-[70px] text-center"
        style={{
          backgroundColor: `#${first.resource.color}` || "#93c5fd",
          color: getContrastColor(`#${first.resource.color}` || "#93c5fd"),
        }}
      >
        {first.resource.name}
      </span>
      {overflow > 0 && (
        <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-medium w-fit bg-orange-100 text-orange-700 border border-orange-200">
          + {overflow} more...
        </span>
      )}
    </div>
  );
}

export const implementationColumns: ColumnDef<NAF>[] = [
  {
    id: "employee",
    header: "Employee",
    size: 220,
    cell: ({ row }) => <EmployeeCell row={row.original} />,
  },
  {
    id: "requests",
    header: "Requests",
    size: 160,
    cell: ({ row }) => (
      <ImplementationRequestBadges requests={row.original.resourceRequests} />
    ),
  },
  {
    id: "dateNeeded",
    header: "Date Needed",
    size: 160,
    cell: ({ row }) => {
      const date = getClosestDateNeeded(row.original);
      if (!date) return <span className="text-muted-foreground text-sm">—</span>;
      return (
        <span className="text-sm">
          {new Date(date).toLocaleDateString("en-US", {
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

- [ ] **Step 2: Rewrite useForImplementations.ts**

Replace `NAFClient/src/features/admin/hooks/useForImplementations.ts` with:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";
import { toast } from "sonner";

export function useForImplementations(locationId: number | null) {
  const queryClient = useQueryClient();
  const queryKey = ["admin", "for-implementations", locationId];

  const forImplementationsQuery = useQuery({
    queryKey,
    queryFn: () => adminApi.getForImplementations(locationId!),
    enabled: locationId != null,
  });

  const acceptMutation = useMutation({
    mutationFn: (resourceRequestId: string) =>
      adminApi.assignToMe(resourceRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Task accepted");
    },
    onError: () => toast.error("Failed to accept task"),
  });

  const setToInProgressMutation = useMutation({
    mutationFn: (implementationId: string) =>
      adminApi.setToInProgress(implementationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Set to In Progress");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const setToDelayedMutation = useMutation({
    mutationFn: ({
      implementationId,
      delayReason,
    }: {
      implementationId: string;
      delayReason: string;
    }) => adminApi.setToDelayed(implementationId, delayReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Marked as Delayed");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const setToAccomplishedMutation = useMutation({
    mutationFn: (implementationId: string) =>
      adminApi.setToAccomplished(implementationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Marked as Accomplished");
    },
    onError: () => toast.error("Failed to update status"),
  });

  return {
    forImplementationsQuery,
    acceptMutation,
    setToInProgressMutation,
    setToDelayedMutation,
    setToAccomplishedMutation,
  };
}
```

- [ ] **Step 3: Rewrite ForImplementationsPage.tsx**

Replace `NAFClient/src/features/admin/pages/ForImplementationsPage.tsx` with:

```tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { DataTable } from "@/shared/components/ui/datatable";
import { useForImplementations } from "../hooks/useForImplementations";
import { useAuth } from "@/features/auth/AuthContext";
import {
  implementationColumns,
  getClosestDateNeeded,
} from "../components/implementationColumns";
import { RoutesEnum } from "@/app/routesEnum";
import type { NAF } from "@/shared/types/api/naf";

export default function ForImplementationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const locationId = user?.locationId ?? null;

  const { forImplementationsQuery } = useForImplementations(locationId);

  const nafs = useMemo(() => {
    const data = forImplementationsQuery.data ?? [];
    return [...data].sort((a, b) => {
      const aDate = getClosestDateNeeded(a);
      const bDate = getClosestDateNeeded(b);
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });
  }, [forImplementationsQuery.data]);

  const handleRowClick = (naf: NAF) => {
    navigate(`${RoutesEnum.ADMIN_FOR_IMPLEMENTATIONS}/${naf.id}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-amber-500">For Implementation</h1>
        <DataTable
          columns={implementationColumns}
          data={nafs}
          isLoading={forImplementationsQuery.isLoading}
          onRowClick={handleRowClick}
          emptyMessage="No items for implementation."
        />
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 4: Delete the four replaced components**

```bash
git rm NAFClient/src/features/admin/components/ImplementationViewToggle.tsx \
       NAFClient/src/features/admin/components/ImplementationNAFAccordion.tsx \
       NAFClient/src/features/admin/components/ImplementationResourceAccordion.tsx \
       NAFClient/src/features/admin/components/ImplementationResourceRequestRow.tsx
```

- [ ] **Step 5: Build to verify**

```bash
npm run build
```

Expected: 0 errors (the deleted files are no longer imported by anything).

- [ ] **Step 6: Commit**

```bash
git add NAFClient/src/features/admin/components/implementationColumns.tsx \
        NAFClient/src/features/admin/hooks/useForImplementations.ts \
        NAFClient/src/features/admin/pages/ForImplementationsPage.tsx
git commit -m "feat: rewrite ForImplementationsPage as flat table, add implementationColumns, update useForImplementations"
```

---

## Task 8: Implementation detail page

**Files:**
- Create: `NAFClient/src/features/admin/components/ImplementationResourceRequestItem.tsx`
- Create: `NAFClient/src/features/admin/components/ImplementationResourceRequestList.tsx`
- Create: `NAFClient/src/features/admin/pages/AdminImplementationDetailPage.tsx`

- [ ] **Step 1: Create ImplementationResourceRequestItem.tsx**

Create `NAFClient/src/features/admin/components/ImplementationResourceRequestItem.tsx`:

```tsx
import { useState } from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/utils";
import type { ResourceRequest } from "@/shared/types/api/naf";
import { ImplementationStatus } from "@/shared/types/enum/status";
import { AdditionalInfoBlock } from "@/features/naf/components/resource-request/ResourceRequestContent";
import { ResourceIcon } from "@/features/naf/components/resource-request/resourceRequestUtils";
import { DelayedReasonModal } from "./DelayedReasonModal";

const IMPL_STATUS_CONFIG: Record<
  ImplementationStatus,
  { label: string; textClass: string }
> = {
  [ImplementationStatus.OPEN]: {
    label: "Open",
    textClass: "text-amber-500",
  },
  [ImplementationStatus.IN_PROGRESS]: {
    label: "In Progress",
    textClass: "text-blue-600",
  },
  [ImplementationStatus.DELAYED]: {
    label: "Delayed",
    textClass: "text-yellow-600",
  },
  [ImplementationStatus.ACCOMPLISHED]: {
    label: "Accomplished",
    textClass: "text-emerald-600",
  },
};

interface ImplementationResourceRequestItemProps {
  request: ResourceRequest;
  onAccept: (resourceRequestId: string) => void;
  onSetToInProgress: (implementationId: string) => void;
  onSetToDelayed: (implementationId: string, delayReason: string) => void;
  onSetToAccomplished: (implementationId: string) => void;
  isSubmitting?: boolean;
}

export function ImplementationResourceRequestItem({
  request,
  onAccept,
  onSetToInProgress,
  onSetToDelayed,
  onSetToAccomplished,
  isSubmitting,
}: ImplementationResourceRequestItemProps) {
  const [delayModalOpen, setDelayModalOpen] = useState(false);

  const impl = request.implementation;
  const status = impl?.status ?? ImplementationStatus.OPEN;
  const config = IMPL_STATUS_CONFIG[status];

  return (
    <>
      <AccordionItem
        value={request.id}
        className="border rounded-lg px-0 overflow-hidden"
      >
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <ResourceIcon
              iconUrl={request.resource.iconUrl}
              name={request.resource.name}
            />
            <span className="text-sm font-medium truncate">
              {request.resource.name}
            </span>
          </div>
          <span className={cn("text-sm font-semibold mr-2 shrink-0", config.textClass)}>
            {config.label}
          </span>
        </AccordionTrigger>

        <AccordionContent className="px-4 pb-4 pt-2 space-y-3">
          {request.additionalInfo && (
            <AdditionalInfoBlock info={request.additionalInfo} />
          )}

          {request.dateNeeded && (
            <p className="text-sm text-muted-foreground">
              Date Needed:{" "}
              <span className="font-medium text-foreground">
                {new Date(request.dateNeeded).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </p>
          )}

          {status === ImplementationStatus.DELAYED && impl?.delayReason && (
            <div>
              <p className="text-xs font-semibold text-yellow-600 mb-1">
                Delay Reason
              </p>
              <p className="text-sm text-muted-foreground">{impl.delayReason}</p>
            </div>
          )}

          {status === ImplementationStatus.ACCOMPLISHED &&
            impl?.accomplishedAt && (
              <p className="text-sm text-muted-foreground">
                Accomplished:{" "}
                <span className="font-medium text-foreground">
                  {new Date(impl.accomplishedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}

          <div className="flex flex-wrap gap-2 mt-2">
            {status === ImplementationStatus.OPEN && (
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white"
                disabled={isSubmitting}
                onClick={() => onAccept(request.id)}
              >
                Accept
              </Button>
            )}

            {status === ImplementationStatus.IN_PROGRESS && (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  disabled={isSubmitting}
                  onClick={() => onSetToAccomplished(impl!.id)}
                >
                  Mark Accomplished
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                  disabled={isSubmitting}
                  onClick={() => setDelayModalOpen(true)}
                >
                  Mark Delayed
                </Button>
              </>
            )}

            {status === ImplementationStatus.DELAYED && (
              <>
                <Button
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={isSubmitting}
                  onClick={() => onSetToInProgress(impl!.id)}
                >
                  Back to In Progress
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  disabled={isSubmitting}
                  onClick={() => onSetToAccomplished(impl!.id)}
                >
                  Mark Accomplished
                </Button>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      <DelayedReasonModal
        open={delayModalOpen}
        onOpenChange={setDelayModalOpen}
        onConfirm={(reason) => {
          onSetToDelayed(impl!.id, reason);
          setDelayModalOpen(false);
        }}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
```

- [ ] **Step 2: Create ImplementationResourceRequestList.tsx**

Create `NAFClient/src/features/admin/components/ImplementationResourceRequestList.tsx`:

```tsx
import { Accordion } from "@/components/ui/accordion";
import type { ResourceRequest } from "@/shared/types/api/naf";
import { Progress } from "@/shared/types/enum/progress";
import { ImplementationResourceRequestItem } from "./ImplementationResourceRequestItem";

interface ImplementationResourceRequestListProps {
  requests: ResourceRequest[];
  onAccept: (resourceRequestId: string) => void;
  onSetToInProgress: (implementationId: string) => void;
  onSetToDelayed: (implementationId: string, delayReason: string) => void;
  onSetToAccomplished: (implementationId: string) => void;
  isSubmitting?: boolean;
}

export function ImplementationResourceRequestList({
  requests,
  onAccept,
  onSetToInProgress,
  onSetToDelayed,
  onSetToAccomplished,
  isSubmitting,
}: ImplementationResourceRequestListProps) {
  const implRequests = requests.filter(
    (rr) =>
      (rr.progress as unknown as Progress) === Progress.IMPLEMENTATION,
  );

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Requests</h2>
      {implRequests.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No implementation requests found.
        </p>
      )}
      <Accordion type="multiple" className="space-y-2">
        {implRequests.map((req) => (
          <ImplementationResourceRequestItem
            key={req.id}
            request={req}
            onAccept={onAccept}
            onSetToInProgress={onSetToInProgress}
            onSetToDelayed={onSetToDelayed}
            onSetToAccomplished={onSetToAccomplished}
            isSubmitting={isSubmitting}
          />
        ))}
      </Accordion>
    </div>
  );
}
```

- [ ] **Step 3: Create AdminImplementationDetailPage.tsx**

Create `NAFClient/src/features/admin/pages/AdminImplementationDetailPage.tsx`:

```tsx
import { useParams, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useNAF } from "@/features/naf/hooks/useNAF";
import { useForImplementations } from "../hooks/useForImplementations";
import { useAuth } from "@/features/auth/AuthContext";
import { NAFDetailHeader } from "@/features/naf/components/NAFDetailHeader";
import { ImplementationResourceRequestList } from "../components/ImplementationResourceRequestList";
import { RoutesEnum } from "@/app/routesEnum";

export default function AdminImplementationDetailPage() {
  const { nafId } = useParams<{ nafId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const locationId = user?.locationId ?? null;

  const { nafQuery, isLoading, isError } = useNAF({ nafId });
  const naf = nafQuery.data;

  const {
    acceptMutation,
    setToInProgressMutation,
    setToDelayedMutation,
    setToAccomplishedMutation,
  } = useForImplementations(locationId);

  const isSubmitting =
    acceptMutation.isPending ||
    setToInProgressMutation.isPending ||
    setToDelayedMutation.isPending ||
    setToAccomplishedMutation.isPending;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto w-full space-y-6 pb-12 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate(RoutesEnum.ADMIN_FOR_IMPLEMENTATIONS)}
        >
          <ChevronLeft className="h-4 w-4" /> Back to Implementations
        </Button>

        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {isError && (
          <p className="text-sm text-muted-foreground">
            Failed to load NAF details.
          </p>
        )}

        {naf && (
          <>
            <Separator />
            <NAFDetailHeader naf={naf} />
            <ImplementationResourceRequestList
              requests={naf.resourceRequests}
              onAccept={(rrId) => acceptMutation.mutate(rrId)}
              onSetToInProgress={(implId) =>
                setToInProgressMutation.mutate(implId)
              }
              onSetToDelayed={(implId, reason) =>
                setToDelayedMutation.mutate({
                  implementationId: implId,
                  delayReason: reason,
                })
              }
              onSetToAccomplished={(implId) =>
                setToAccomplishedMutation.mutate(implId)
              }
              isSubmitting={isSubmitting}
            />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 4: Build to verify**

```bash
npm run build
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add NAFClient/src/features/admin/components/ImplementationResourceRequestItem.tsx \
        NAFClient/src/features/admin/components/ImplementationResourceRequestList.tsx \
        NAFClient/src/features/admin/pages/AdminImplementationDetailPage.tsx
git commit -m "feat: add implementation detail page with status actions (accept, in-progress, delayed, accomplished)"
```

---

## Manual Test Checklist

After all tasks are done, start both servers and verify:

**Backend:**
```bash
cd NAFServer && dotnet run
```

- `GET /api/admin/nafs?locationId=1&status=all&page=1` — returns `PagedResult<NAF>` with up to 20 items, excludes REJECTED/IMPLEMENTATION/NOT_ACCOMPLISHED
- `GET /api/admin/nafs?locationId=1&status=open` — returns only OPEN NAFs
- `GET /implementations/for-implementations?locationId=1` — returns NAFs with IMPLEMENTATION requests for that location only

**Frontend:**
```bash
cd NAFClient && npm run dev
```

Login as an ADMIN user, then:
- Sidebar shows NAFs and Implementations links
- `/admin/NAF` — status tabs work, table loads, clicking a row navigates to detail
- `/admin/NAF/:id` — shows employee info, read-only resource request accordion with approval steps
- `/admin/for-implementations` — flat table sorted by Date Needed ascending
- `/admin/for-implementations/:id` — shows only IMPLEMENTATION requests; action buttons match the current status; "Mark Delayed" opens the reason modal; mutations update the list on success
