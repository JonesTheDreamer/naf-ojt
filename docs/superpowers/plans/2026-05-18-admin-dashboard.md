# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full admin dashboard with location toggle, per-status recent requests, average time to accomplish (cached 8h), beyond-deadline count, and resource access counts — replacing the current minimal AdminHomePage.

**Architecture:** Two new backend endpoints (`/admin/dashboard/stats` and `/admin/dashboard/average-time`) served by a new `DashboardService`. The frontend rewrites `AdminHomePage.tsx` using two new React Query hooks and the existing location dropdown pattern from `AdminNAFListPage`.

**Tech Stack:** ASP.NET Core 8, EF Core, IMemoryCache (via existing `CacheService`), React 19, TypeScript, TanStack React Query, Tailwind CSS v4, ShadCN

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `NAFServer/src/Domain/Enums/Progress.cs` | Modify | Add `DEACTIVATED = 7` |
| `NAFServer/src/Domain/Entities/ResourceRequest.cs` | Modify | Set `Progress = DEACTIVATED` in `DeactivateResourceRequest()` |
| `NAFServer/src/Application/DTOs/Admin/ResourceAccessCountDTO.cs` | Create | DTO for resource access counts |
| `NAFServer/src/Application/DTOs/Admin/DashboardStatsDTO.cs` | Create | Live stats response shape |
| `NAFServer/src/Application/DTOs/Admin/DashboardAverageTimeDTO.cs` | Create | Average time response shape |
| `NAFServer/src/Application/Interfaces/IDashboardService.cs` | Create | Service contract |
| `NAFServer/src/Application/Services/DashboardService.cs` | Create | `GetStatsAsync` + `GetAverageTimeAsync` |
| `NAFServer/src/API/Controllers/AdminController.cs` | Modify | Add 2 endpoints, inject `IDashboardService` |
| `NAFServer/Program.cs` | Modify | Register `IDashboardService → DashboardService` |
| `NAFClient/src/shared/types/enum/progress.ts` | Modify | Add `DEACTIVATED = 7` |
| `NAFClient/src/features/naf/components/progressBadge.tsx` | Modify | Add `DEACTIVATED` style in `PROGRESS_CONFIG` |
| `NAFClient/src/features/admin/types.ts` | Modify | Add 3 new DTO interfaces |
| `NAFClient/src/features/admin/api.ts` | Modify | Add 2 API methods |
| `NAFClient/src/features/admin/hooks/useAdminDashboardStats.ts` | Create | React Query hook for live stats |
| `NAFClient/src/features/admin/hooks/useAdminDashboardAverageTime.ts` | Create | React Query hook for avg time |
| `NAFClient/src/features/admin/pages/AdminHomePage.tsx` | Rewrite | Dashboard UI |

---

## Task 1: Add DEACTIVATED to Progress Enum

**Files:**
- Modify: `NAFServer/src/Domain/Enums/Progress.cs`
- Modify: `NAFServer/src/Domain/Entities/ResourceRequest.cs`

- [ ] **Step 1: Add DEACTIVATED to the enum**

Open `NAFServer/src/Domain/Enums/Progress.cs`. Replace the entire file content with:

```csharp
namespace NAFServer.src.Domain.Enums
{
    public enum Progress
    {
        OPEN,           // 0
        IN_PROGRESS,    // 1
        FOR_SCREENING,  // 2
        IMPLEMENTATION, // 3
        ACCOMPLISHED,   // 4
        REJECTED,       // 5
        CANCELLED,      // 6
        DEACTIVATED     // 7
    }
}
```

- [ ] **Step 2: Update DeactivateResourceRequest to set Progress**

In `NAFServer/src/Domain/Entities/ResourceRequest.cs`, find the `DeactivateResourceRequest` method and replace it:

```csharp
public ResourceRequest DeactivateResourceRequest()
{
    IsActive = false;
    Progress = Progress.DEACTIVATED;
    return this;
}
```

- [ ] **Step 3: Build the backend to verify no compile errors**

Run from `NAFServer/`:
```
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 4: Add and apply EF Core migration**

Run from `NAFServer/`:
```
dotnet ef migrations add AddDeactivatedProgress
dotnet ef database update
```

Expected: Migration created and applied. No schema changes occur (Progress is stored as int; the new value 7 requires no schema change).

- [ ] **Step 5: Commit**

```
git add NAFServer/src/Domain/Enums/Progress.cs
git add NAFServer/src/Domain/Entities/ResourceRequest.cs
git add NAFServer/src/Infrastructure/Persistence/Migrations/
git commit -m "feat: add DEACTIVATED progress enum value and update DeactivateResourceRequest"
```

---

## Task 2: Backend DTOs

**Files:**
- Create: `NAFServer/src/Application/DTOs/Admin/ResourceAccessCountDTO.cs`
- Create: `NAFServer/src/Application/DTOs/Admin/DashboardStatsDTO.cs`
- Create: `NAFServer/src/Application/DTOs/Admin/DashboardAverageTimeDTO.cs`

- [ ] **Step 1: Create ResourceAccessCountDTO**

```csharp
namespace NAFServer.src.Application.DTOs.Admin
{
    public record ResourceAccessCountDTO(
        int ResourceId,
        string ResourceName,
        int Count
    );
}
```

- [ ] **Step 2: Create DashboardStatsDTO**

```csharp
namespace NAFServer.src.Application.DTOs.Admin
{
    public record DashboardStatsDTO(
        Dictionary<string, List<AdminResourceRequestDTO>> RecentByStatus,
        int BeyondDeadlineCount,
        List<ResourceAccessCountDTO> ResourceAccessCounts
    );
}
```

- [ ] **Step 3: Create DashboardAverageTimeDTO**

```csharp
namespace NAFServer.src.Application.DTOs.Admin
{
    public record DashboardAverageTimeDTO(
        int SampleCount,
        double? OverallAvgDays,
        double? OpenToApprovalAvgDays,
        double? ApprovalToScreeningAvgDays,
        double? ScreeningToImplementationAvgDays,
        double? ImplementationToAccomplishedAvgDays
    );
}
```

- [ ] **Step 4: Build to verify**

```
dotnet build
```
Expected: 0 errors.

- [ ] **Step 5: Commit**

```
git add NAFServer/src/Application/DTOs/Admin/ResourceAccessCountDTO.cs
git add NAFServer/src/Application/DTOs/Admin/DashboardStatsDTO.cs
git add NAFServer/src/Application/DTOs/Admin/DashboardAverageTimeDTO.cs
git commit -m "feat: add dashboard DTOs"
```

---

## Task 3: IDashboardService Interface

**Files:**
- Create: `NAFServer/src/Application/Interfaces/IDashboardService.cs`

- [ ] **Step 1: Create the interface**

```csharp
using NAFServer.src.Application.DTOs.Admin;

namespace NAFServer.src.Application.Interfaces
{
    public interface IDashboardService
    {
        Task<DashboardStatsDTO> GetStatsAsync(int? locationId);
        Task<DashboardAverageTimeDTO> GetAverageTimeAsync(int? locationId);
    }
}
```

- [ ] **Step 2: Build to verify**

```
dotnet build
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```
git add NAFServer/src/Application/Interfaces/IDashboardService.cs
git commit -m "feat: add IDashboardService interface"
```

---

## Task 4: DashboardService — GetStatsAsync

**Files:**
- Create: `NAFServer/src/Application/Services/DashboardService.cs`

- [ ] **Step 1: Create DashboardService with GetStatsAsync**

```csharp
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;
using NAFServer.src.Infrastructure.Persistence;
using Microsoft.Extensions.Caching.Memory;

namespace NAFServer.src.Application.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly CacheService _cacheService;

        public DashboardService(
            AppDbContext context,
            IEmployeeRepository employeeRepository,
            CacheService cacheService)
        {
            _context = context;
            _employeeRepository = employeeRepository;
            _cacheService = cacheService;
        }

        public async Task<DashboardStatsDTO> GetStatsAsync(int? locationId)
        {
            // 1. Recent 5 requests per progress status
            var recentByStatus = new Dictionary<string, List<AdminResourceRequestDTO>>();

            foreach (var progress in Enum.GetValues<Progress>())
            {
                var items = await _context.ResourceRequests
                    .Include(rr => rr.NAF)
                    .Include(rr => rr.Resource)
                    .Where(rr => rr.Progress == progress)
                    .Where(rr => locationId == null || rr.NAF.LocationId == locationId)
                    .OrderByDescending(rr => rr.CreatedAt)
                    .Take(5)
                    .AsNoTracking()
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

                recentByStatus[progress.ToString()] = dtos;
            }

            // 2. Beyond deadline count (active, non-terminal requests past DateNeeded)
            var today = DateTime.Today;
            var beyondDeadlineCount = await _context.ResourceRequests
                .Where(rr => locationId == null || rr.NAF.LocationId == locationId)
                .Where(rr => rr.DateNeeded != default(DateTime) && rr.DateNeeded < today)
                .Where(rr => rr.Progress != Progress.ACCOMPLISHED
                          && rr.Progress != Progress.CANCELLED
                          && rr.Progress != Progress.REJECTED
                          && rr.Progress != Progress.DEACTIVATED)
                .CountAsync();

            // 3. Resource access counts (distinct employees per resource with ACCOMPLISHED requests)
            var accomplishedRequests = await _context.ResourceRequests
                .Include(rr => rr.NAF)
                .Include(rr => rr.Resource)
                .Where(rr => rr.Progress == Progress.ACCOMPLISHED)
                .Where(rr => locationId == null || rr.NAF.LocationId == locationId)
                .AsNoTracking()
                .ToListAsync();

            var resourceAccessCounts = accomplishedRequests
                .GroupBy(rr => new { rr.ResourceId, rr.Resource.Name })
                .Select(g => new ResourceAccessCountDTO(
                    g.Key.ResourceId,
                    g.Key.Name,
                    g.Select(rr => rr.NAF.EmployeeId).Distinct().Count()
                ))
                .OrderByDescending(x => x.Count)
                .ToList();

            return new DashboardStatsDTO(recentByStatus, beyondDeadlineCount, resourceAccessCounts);
        }

        public Task<DashboardAverageTimeDTO> GetAverageTimeAsync(int? locationId)
            => throw new NotImplementedException();
    }
}
```

- [ ] **Step 2: Build to verify**

```
dotnet build
```
Expected: 0 errors (NotImplementedException is acceptable at this stage).

- [ ] **Step 3: Commit**

```
git add NAFServer/src/Application/Services/DashboardService.cs
git commit -m "feat: add DashboardService with GetStatsAsync"
```

---

## Task 5: DashboardService — GetAverageTimeAsync

**Files:**
- Modify: `NAFServer/src/Application/Services/DashboardService.cs`

- [ ] **Step 1: Replace the GetAverageTimeAsync stub with the full implementation**

Replace `public Task<DashboardAverageTimeDTO> GetAverageTimeAsync(int? locationId) => throw new NotImplementedException();` with:

```csharp
public async Task<DashboardAverageTimeDTO> GetAverageTimeAsync(int? locationId)
{
    var cacheKey = $"dashboard:avg-time:{locationId?.ToString() ?? "all"}";
    var options = new MemoryCacheEntryOptions()
        .SetAbsoluteExpiration(TimeSpan.FromHours(8));

    return await _cacheService.GetOrSetAsync(cacheKey, async () =>
    {
        // Load accomplished requests that have a completed implementation
        var requests = await _context.ResourceRequests
            .Include(rr => rr.NAF)
            .Include(rr => rr.ResourceRequestImplementation)
            .Where(rr => rr.Progress == Progress.ACCOMPLISHED)
            .Where(rr => rr.ResourceRequestImplementation != null
                      && rr.ResourceRequestImplementation.AccomplishedAt != null)
            .Where(rr => locationId == null || rr.NAF.LocationId == locationId)
            .AsNoTracking()
            .ToListAsync();

        if (!requests.Any())
            return new DashboardAverageTimeDTO(0, null, null, null, null, null);

        var requestIds = requests.Select(r => r.Id).ToList();

        // Resolve approval step histories via step IDs
        var steps = await _context.ResourceRequestApprovalSteps
            .Where(s => requestIds.Contains(s.ResourceRequestId))
            .Select(s => new { s.Id, s.ResourceRequestId })
            .AsNoTracking()
            .ToListAsync();

        var stepIdToRequestId = steps.ToDictionary(s => s.Id, s => s.ResourceRequestId);
        var stepIdList = steps.Select(s => s.Id).ToList();

        var histories = await _context.ResourceRequestApprovalStepHistories
            .Where(h => stepIdList.Contains(h.ResourceRequestApprovalStepId))
            .Select(h => new { h.ResourceRequestApprovalStepId, h.ActionAt })
            .AsNoTracking()
            .ToListAsync();

        // Group action timestamps by ResourceRequestId
        var actionsByRequestId = histories
            .GroupBy(h => stepIdToRequestId[h.ResourceRequestApprovalStepId])
            .ToDictionary(g => g.Key, g => g.Select(h => h.ActionAt).ToList());

        var overallDurations = new List<double>();
        var openToApprovalDurations = new List<double>();
        var approvalToScreeningDurations = new List<double>();
        var screeningToImplDurations = new List<double>();
        var implToAccomplishedDurations = new List<double>();

        foreach (var rr in requests)
        {
            var impl = rr.ResourceRequestImplementation;
            if (impl?.AccomplishedAt == null) continue;

            // Overall: request created → implementation accomplished
            overallDurations.Add((impl.AccomplishedAt.Value - rr.CreatedAt).TotalDays);

            if (actionsByRequestId.TryGetValue(rr.Id, out var actions) && actions.Any())
            {
                // Open → first approval action
                var firstAction = actions.Min();
                openToApprovalDurations.Add((firstAction - rr.CreatedAt).TotalDays);

                // Last approval action → implementation assigned (CreatedAt of impl)
                if (impl.CreatedAt != default(DateTime))
                {
                    var lastAction = actions.Max();
                    approvalToScreeningDurations.Add((impl.CreatedAt - lastAction).TotalDays);
                }
            }

            // Implementation assigned → accepted (start working)
            if (impl.CreatedAt != default(DateTime) && impl.AcceptedAt.HasValue)
                screeningToImplDurations.Add((impl.AcceptedAt.Value - impl.CreatedAt).TotalDays);

            // Accepted → accomplished
            if (impl.AcceptedAt.HasValue)
                implToAccomplishedDurations.Add((impl.AccomplishedAt.Value - impl.AcceptedAt.Value).TotalDays);
        }

        static double? Avg(List<double> list) =>
            list.Count > 0 ? Math.Round(list.Average(), 1) : null;

        return new DashboardAverageTimeDTO(
            requests.Count,
            overallDurations.Count > 0 ? Math.Round(overallDurations.Average(), 1) : null,
            Avg(openToApprovalDurations),
            Avg(approvalToScreeningDurations),
            Avg(screeningToImplDurations),
            Avg(implToAccomplishedDurations)
        );
    }, options);
}
```

- [ ] **Step 2: Build to verify**

```
dotnet build
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```
git add NAFServer/src/Application/Services/DashboardService.cs
git commit -m "feat: implement GetAverageTimeAsync with 8h cache in DashboardService"
```

---

## Task 6: Register Service + Add Controller Endpoints

**Files:**
- Modify: `NAFServer/Program.cs`
- Modify: `NAFServer/src/API/Controllers/AdminController.cs`

- [ ] **Step 1: Register DashboardService in Program.cs**

In `NAFServer/Program.cs`, add this line after the existing `builder.Services.AddScoped<IAdminService, AdminService>();` line:

```csharp
builder.Services.AddScoped<IDashboardService, DashboardService>();
```

Also add the using at the top of Program.cs if not already present (the existing service registrations don't use explicit using statements — they use global usings from the project file, so this should just work).

- [ ] **Step 2: Add IDashboardService to AdminController**

In `NAFServer/src/API/Controllers/AdminController.cs`, update the class to inject and use `IDashboardService`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Infrastructure.Persistence;
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
        private readonly IDashboardService _dashboardService;
        private readonly AppDbContext _context;

        public AdminController(
            IAdminService adminService,
            INAFService nafService,
            IDashboardService dashboardService,
            AppDbContext context)
        {
            _adminService = adminService;
            _nafService = nafService;
            _dashboardService = dashboardService;
            _context = context;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] int locationId)
        {
            return Ok(await _adminService.GetAllUsersInLocationAsync(locationId));
        }

        [HttpPost("users/{employeeId}")]
        public async Task<IActionResult> CreateUser(string employeeId, [FromBody] CreateUserDTO dto)
        {
            try
            {
                await _adminService.CreateUserAsync(employeeId, dto);
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
            [FromQuery] int? locationId = null,
            [FromQuery] string status = "all",
            [FromQuery][Range(1, int.MaxValue)] int page = 1)
        {
            return Ok(await _nafService.GetNAFsByLocationPagedAsync(locationId, status, page));
        }

        [HttpGet("resource-requests/for-screening")]
        public async Task<IActionResult> GetForScreening([FromQuery] int locationId)
        {
            return Ok(await _nafService.GetForScreeningAsync(locationId));
        }

        [HttpGet("resource-requests")]
        public async Task<IActionResult> GetAdminResourceRequests(
            [FromQuery] int locationId,
            [FromQuery] string progress = "all",
            [FromQuery][Range(1, int.MaxValue)] int page = 1)
        {
            return Ok(await _nafService.GetResourceRequestsByLocationPagedAsync(locationId, progress, page));
        }

        [HttpGet("dashboard/stats")]
        public async Task<IActionResult> GetDashboardStats([FromQuery] int? locationId)
        {
            return Ok(await _dashboardService.GetStatsAsync(locationId));
        }

        [HttpGet("dashboard/average-time")]
        public async Task<IActionResult> GetDashboardAverageTime([FromQuery] int? locationId)
        {
            return Ok(await _dashboardService.GetAverageTimeAsync(locationId));
        }

        [HttpGet("audit-trails")]
        public async Task<IActionResult> GetAuditTrails(
            [FromQuery] string? search,
            [FromQuery] string? entity,
            [FromQuery][Range(1, int.MaxValue)] int page = 1)
        {
            const int pageSize = 20;

            var query = _context.AuditTrails.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(a => a.Activity.Contains(search));

            if (!string.IsNullOrWhiteSpace(entity) && !entity.Equals("all", StringComparison.OrdinalIgnoreCase))
                query = query.Where(a => a.Entity == entity);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(a => a.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new { a.Id, a.Activity, a.Entity, a.Timestamp })
                .ToListAsync();

            return Ok(new
            {
                data = items,
                totalCount,
                pageSize,
                currentPage = page,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            });
        }
    }
}
```

- [ ] **Step 3: Build and run to verify endpoints are accessible**

```
dotnet build
dotnet run
```

Expected: Server starts on http://localhost:5186. In a browser or curl, `GET http://localhost:5186/api/admin/dashboard/stats` should return 401 (unauthorized, which means the route is registered correctly).

- [ ] **Step 4: Commit**

```
git add NAFServer/Program.cs
git add NAFServer/src/API/Controllers/AdminController.cs
git commit -m "feat: register DashboardService and add dashboard endpoints to AdminController"
```

---

## Task 7: Frontend — Progress Enum + ProgressBadge

**Files:**
- Modify: `NAFClient/src/shared/types/enum/progress.ts`
- Modify: `NAFClient/src/features/naf/components/progressBadge.tsx`

- [ ] **Step 1: Add DEACTIVATED to the frontend Progress enum**

In `NAFClient/src/shared/types/enum/progress.ts`, replace the file content with:

```typescript
export enum Progress {
  OPEN = 0,
  IN_PROGRESS = 1,
  FOR_SCREENING = 2,
  IMPLEMENTATION = 3,
  ACCOMPLISHED = 4,
  REJECTED = 5,
  CANCELLED = 6,
  DEACTIVATED = 7,
}
```

- [ ] **Step 2: Add DEACTIVATED to PROGRESS_CONFIG in ProgressBadge**

In `NAFClient/src/features/naf/components/progressBadge.tsx`, add the `DEACTIVATED` entry to `PROGRESS_CONFIG`:

```typescript
import { cn } from "@/shared/utils/utils";
import { Progress } from "@/shared/types/enum/progress";

export const PROGRESS_CONFIG: Record<
  Progress,
  { label: string; className: string }
> = {
  [Progress.OPEN]: {
    label: "Open",
    className: "text-amber-500 bg-amber-50 border-amber-200",
  },
  [Progress.IN_PROGRESS]: {
    label: "In Progress",
    className: "text-blue-600 bg-blue-50 border-blue-200",
  },
  [Progress.FOR_SCREENING]: {
    label: "For Screening",
    className: "text-purple-600 bg-purple-50 border-purple-200",
  },
  [Progress.REJECTED]: {
    label: "Rejected",
    className: "text-red-500 bg-red-50 border-red-200",
  },
  [Progress.IMPLEMENTATION]: {
    label: "Implementation",
    className: "text-teal-600 bg-teal-50 border-teal-200",
  },
  [Progress.ACCOMPLISHED]: {
    label: "Accomplished",
    className: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  [Progress.CANCELLED]: {
    label: "Cancelled",
    className: "text-gray-400 bg-gray-50 border-gray-200",
  },
  [Progress.DEACTIVATED]: {
    label: "Deactivated",
    className: "text-slate-400 bg-slate-50 border-slate-200",
  },
};

export function ProgressBadge({
  progress,
  className,
}: {
  progress: Progress;
  className?: string;
}) {
  const config = PROGRESS_CONFIG[progress] ?? {
    label: String(progress),
    className: "text-gray-500 bg-gray-50 border-gray-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run from `NAFClient/`:
```
npm run build
```
Expected: 0 TypeScript errors.

- [ ] **Step 4: Commit**

```
git add NAFClient/src/shared/types/enum/progress.ts
git add NAFClient/src/features/naf/components/progressBadge.tsx
git commit -m "feat: add DEACTIVATED to frontend Progress enum and ProgressBadge"
```

---

## Task 8: Frontend Types + API Methods

**Files:**
- Modify: `NAFClient/src/features/admin/types.ts`
- Modify: `NAFClient/src/features/admin/api.ts`

- [ ] **Step 1: Add new DTO types to types.ts**

In `NAFClient/src/features/admin/types.ts`, append the following to the end of the file:

```typescript
export interface ResourceAccessCountDTO {
  resourceId: number;
  resourceName: string;
  count: number;
}

export interface DashboardStatsDTO {
  recentByStatus: Record<string, AdminResourceRequestDTO[]>;
  beyondDeadlineCount: number;
  resourceAccessCounts: ResourceAccessCountDTO[];
}

export interface DashboardAverageTimeDTO {
  sampleCount: number;
  overallAvgDays: number | null;
  openToApprovalAvgDays: number | null;
  approvalToScreeningAvgDays: number | null;
  screeningToImplementationAvgDays: number | null;
  implementationToAccomplishedAvgDays: number | null;
}
```

- [ ] **Step 2: Add API methods to api.ts**

In `NAFClient/src/features/admin/api.ts`, update the imports and add two new methods. First, add `DashboardStatsDTO` and `DashboardAverageTimeDTO` to the import from `"./types"`:

```typescript
import type {
  AdminForScreeningItem,
  AdminResourceRequestDTO,
  CreateUserDTO,
  DashboardAverageTimeDTO,
  DashboardStatsDTO,
  ForImplementationItemDTO,
  LocationDTO,
  UserDTO,
  UserRoleDetailDTO,
} from "./types";
```

Then add these two methods to the `adminApi` object (after `getForScreening`):

```typescript
  getDashboardStats: (locationId: number | null) =>
    api
      .get<DashboardStatsDTO>("/admin/dashboard/stats", {
        params: locationId !== null ? { locationId } : {},
      })
      .then((r) => r.data),

  getDashboardAverageTime: (locationId: number | null) =>
    api
      .get<DashboardAverageTimeDTO>("/admin/dashboard/average-time", {
        params: locationId !== null ? { locationId } : {},
      })
      .then((r) => r.data),
```

- [ ] **Step 3: Verify TypeScript compiles**

```
npm run build
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```
git add NAFClient/src/features/admin/types.ts
git add NAFClient/src/features/admin/api.ts
git commit -m "feat: add dashboard types and API methods"
```

---

## Task 9: Frontend Hooks

**Files:**
- Create: `NAFClient/src/features/admin/hooks/useAdminDashboardStats.ts`
- Create: `NAFClient/src/features/admin/hooks/useAdminDashboardAverageTime.ts`

- [ ] **Step 1: Create useAdminDashboardStats**

```typescript
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api";

export function useAdminDashboardStats(locationId: number | null) {
  const query = useQuery({
    queryKey: ["admin", "dashboard", "stats", locationId],
    queryFn: () => adminApi.getDashboardStats(locationId),
  });
  return { query };
}
```

- [ ] **Step 2: Create useAdminDashboardAverageTime**

```typescript
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api";

export function useAdminDashboardAverageTime(locationId: number | null) {
  const query = useQuery({
    queryKey: ["admin", "dashboard", "average-time", locationId],
    queryFn: () => adminApi.getDashboardAverageTime(locationId),
  });
  return { query };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```
npm run build
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```
git add NAFClient/src/features/admin/hooks/useAdminDashboardStats.ts
git add NAFClient/src/features/admin/hooks/useAdminDashboardAverageTime.ts
git commit -m "feat: add dashboard React Query hooks"
```

---

## Task 10: Rewrite AdminHomePage

**Files:**
- Modify: `NAFClient/src/features/admin/pages/AdminHomePage.tsx`

- [ ] **Step 1: Rewrite AdminHomePage.tsx**

Replace the entire file with:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, AlertTriangle, Users } from "lucide-react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useAuth } from "@/features/auth/AuthContext";
import { useAdminLocations } from "../hooks/useAdminLocations";
import { useAdminDashboardStats } from "../hooks/useAdminDashboardStats";
import { useAdminDashboardAverageTime } from "../hooks/useAdminDashboardAverageTime";
import { Progress } from "@/shared/types/enum/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_SITES_VALUE = "__all__";

const STATUS_TABS = [
  { label: "Open", value: Progress.OPEN, key: "OPEN" },
  { label: "In Progress", value: Progress.IN_PROGRESS, key: "IN_PROGRESS" },
  { label: "For Screening", value: Progress.FOR_SCREENING, key: "FOR_SCREENING" },
  { label: "Implementation", value: Progress.IMPLEMENTATION, key: "IMPLEMENTATION" },
  { label: "Accomplished", value: Progress.ACCOMPLISHED, key: "ACCOMPLISHED" },
  { label: "Rejected", value: Progress.REJECTED, key: "REJECTED" },
  { label: "Cancelled", value: Progress.CANCELLED, key: "CANCELLED" },
  { label: "Deactivated", value: Progress.DEACTIVATED, key: "DEACTIVATED" },
] as const;

export default function AdminHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [locationId, setLocationId] = useState<number | null>(
    user?.locationId ?? null,
  );
  const [activeStatus, setActiveStatus] = useState<Progress>(Progress.OPEN);

  const { locationsQuery } = useAdminLocations();
  const { query: statsQuery } = useAdminDashboardStats(locationId);
  const { query: avgTimeQuery } = useAdminDashboardAverageTime(locationId);

  const stats = statsQuery.data;
  const avgTime = avgTimeQuery.data;

  const selectValue =
    locationId === null ? ALL_SITES_VALUE : String(locationId);

  const handleLocationChange = (value: string) => {
    setLocationId(value === ALL_SITES_VALUE ? null : Number(value));
  };

  const activeTab = STATUS_TABS.find((t) => t.value === activeStatus);
  const activeRequests = activeTab
    ? (stats?.recentByStatus[activeTab.key] ?? [])
    : [];

  const formatDays = (days: number | null | undefined) => {
    if (days == null) return "N/A";
    return `${days.toFixed(1)}d`;
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-amber-500">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Welcome, {user?.name}.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="shrink-0">Site:</span>
            <Select value={selectValue} onValueChange={handleLocationChange}>
              <SelectTrigger className="w-48 h-8 text-sm">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SITES_VALUE}>All Sites</SelectItem>
                {locationsQuery.data?.map((loc) => (
                  <SelectItem key={loc.id} value={String(loc.id)}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stat cards row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Beyond Deadline */}
          <button
            onClick={() => navigate("/admin/resource-requests")}
            className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-5 text-left hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
          >
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Beyond Deadline</span>
            </div>
            <p className="text-4xl font-bold text-red-600 dark:text-red-400">
              {statsQuery.isLoading ? "..." : (stats?.beyondDeadlineCount ?? 0)}
            </p>
            <p className="text-xs text-red-500/70 mt-1">
              active requests past date needed · click to view
            </p>
          </button>

          {/* Resource Access Counts */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">
                Employee Access by Resource
              </span>
            </div>
            {statsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : !stats?.resourceAccessCounts.length ? (
              <p className="text-sm text-muted-foreground">
                No accomplished requests yet.
              </p>
            ) : (
              <div className="space-y-2">
                {stats.resourceAccessCounts.map((item) => (
                  <div
                    key={item.resourceId}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{item.resourceName}</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Average Time Card */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Average Time to Accomplish
            </span>
          </div>
          {avgTimeQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !avgTime?.sampleCount ? (
            <p className="text-sm text-muted-foreground">
              No accomplished requests yet.
            </p>
          ) : (
            <>
              <p className="text-4xl font-bold text-amber-500 mb-1">
                {formatDays(avgTime.overallAvgDays)}
              </p>
              <p className="text-xs text-muted-foreground mb-5">
                Based on {avgTime.sampleCount} accomplished requests · refreshes
                every 8 hours
              </p>
              <div className="space-y-0">
                {[
                  {
                    label: "Open → First Approval Action",
                    value: avgTime.openToApprovalAvgDays,
                  },
                  {
                    label: "Approval → Screening / Implementation",
                    value: avgTime.approvalToScreeningAvgDays,
                  },
                  {
                    label: "Screening → Implementation Start",
                    value: avgTime.screeningToImplementationAvgDays,
                  },
                  {
                    label: "Implementation → Accomplished",
                    value: avgTime.implementationToAccomplishedAvgDays,
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {label}
                    </span>
                    <span className="text-sm font-medium tabular-nums">
                      {formatDays(value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recent Requests by Status */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">Recent Requests by Status</h2>
          </div>

          <div className="flex gap-1.5 flex-wrap px-5 py-3 border-b border-border">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveStatus(tab.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeStatus === tab.value
                    ? "bg-amber-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {statsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Loading...
              </p>
            ) : activeRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No recent requests.
              </p>
            ) : (
              <div className="space-y-1">
                {activeRequests.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => navigate(`/admin/NAF/${req.nafId}`)}
                    className="w-full flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="flex-1 text-sm font-medium truncate">
                      {req.employeeName}
                    </span>
                    <span className="text-sm text-muted-foreground truncate max-w-[140px]">
                      {req.resourceName}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDate(req.dateNeeded)}
                    </span>
                    <span className="text-xs font-mono font-bold shrink-0">
                      {req.nafReference}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
npm run build
```
Expected: 0 errors.

- [ ] **Step 3: Start the dev server and verify the dashboard loads**

Start backend (`dotnet run` in `NAFServer/`) and frontend (`npm run dev` in `NAFClient/`), then navigate to `http://localhost:5173/admin`.

Verify:
- Dashboard title shows "Dashboard"
- Location dropdown works (switching locations re-fetches both widgets)
- Beyond Deadline card shows a count; clicking it navigates to `/admin/resource-requests`
- Resource access table shows resources ordered by employee count
- Average time card shows overall days or "No accomplished requests yet"
- Recent Requests tabs switch between statuses; rows are clickable and navigate to NAF detail

- [ ] **Step 4: Commit**

```
git add NAFClient/src/features/admin/pages/AdminHomePage.tsx
git commit -m "feat: rewrite AdminHomePage as full dashboard with stats, avg time, and recent requests"
```
