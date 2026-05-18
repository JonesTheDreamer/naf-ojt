# Admin Dashboard Design

**Date:** 2026-05-18
**Feature:** Admin Dashboard — Resource Request Stats, Average Time, Beyond Deadline, Resource Access Counts

---

## Overview

Replace the current minimal `AdminHomePage` (which only shows a total user count) with a full-featured dashboard. All widgets respond to a location toggle (user's location or all locations). Two backend endpoints power the page: a live stats endpoint and a cached average-time endpoint.

---

## Domain Change

### Add `DEACTIVATED` to `Progress` enum

Add `DEACTIVATED = 7` to `NAFServer/src/Domain/Enums/Progress.cs`.

- When a `ResourceRequest` has `IsActive = false`, its `Progress` is set to `DEACTIVATED`.
- Requires an EF Core migration.
- The frontend `Progress` enum/type gets a matching `DEACTIVATED = 7` entry.
- `ProgressBadge` component gets a new style variant for `DEACTIVATED` (gray or muted tone).

---

## Backend

### New Service: `DashboardService`

**File:** `NAFServer/src/Application/Services/DashboardService.cs`
**Interface:** `NAFServer/src/Application/Interfaces/IDashboardService.cs`

Injected into `AdminController`. Keeps dashboard logic out of the already-large `NAFService`.

---

### Endpoint 1 — Live Stats

```
GET /admin/dashboard/stats?locationId={int?}
```

- `locationId` is optional. `null` = all locations (consistent with the NAF list pattern).
- No caching — returns live data.
- Calls `IDashboardService.GetStatsAsync(int? locationId)`.

**`GetStatsAsync` logic:**

1. **Recent requests by status** — for each of the 8 `Progress` values (`OPEN`, `IN_PROGRESS`, `FOR_SCREENING`, `IMPLEMENTATION`, `ACCOMPLISHED`, `REJECTED`, `CANCELLED`, `DEACTIVATED`): query `ResourceRequests` filtered by location (if provided) and progress, order by `CreatedAt` descending, take 5. Map each to `AdminResourceRequestDTO` (reuse existing employee name lookup via `IEmployeeRepository`).

2. **Beyond deadline count** — count `ResourceRequests` where `DateNeeded != null && DateNeeded != default(DateTime) && DateNeeded < DateTime.Today`, filtered by location.

3. **Resource access counts** — query `ResourceRequests` where `Progress == ACCOMPLISHED`, include `NAF` and `Resource`. Group by `ResourceId`. For each group, count distinct `NAF.EmployeeId` values. Return `{ resourceId, resourceName, count }[]` ordered by `count` descending.

**Response DTO:** `DashboardStatsDTO`

```csharp
public record DashboardStatsDTO(
    Dictionary<string, List<AdminResourceRequestDTO>> RecentByStatus,
    int BeyondDeadlineCount,
    List<ResourceAccessCountDTO> ResourceAccessCounts
);

public record ResourceAccessCountDTO(
    Guid ResourceId,
    string ResourceName,
    int Count
);
```

---

### Endpoint 2 — Average Time (Cached)

```
GET /admin/dashboard/average-time?locationId={int?}
```

- `locationId` is optional. `null` = all locations.
- Cached **8 hours** via `CacheService` (existing `IMemoryCache` wrapper).
- Cache key: `"dashboard:avg-time:{locationId ?? "all"}"`.
- Calls `IDashboardService.GetAverageTimeAsync(int? locationId)`.

**`GetAverageTimeAsync` logic:**

Query all accomplished `ResourceRequests` (where `Progress == ACCOMPLISHED`) filtered by location, with:
- `Include(rr => rr.Implementation)` where `Implementation.AccomplishedAt != null`
- `Include(rr => rr.ResourceRequestsApprovalSteps).ThenInclude(s => s.Histories)`

For each request, derive phase durations:

| Phase | From | To |
|---|---|---|
| `openToApproval` | `ResourceRequest.CreatedAt` | earliest `ApprovalStepHistory.CreatedAt` |
| `approvalToScreening` | latest `ApprovalStepHistory.CreatedAt` | `Implementation.CreatedAt` (only for requests that had `FOR_SCREENING`) |
| `screeningToImplementation` | `Implementation.CreatedAt` | `Implementation.AcceptedAt` |
| `implementationToAccomplished` | `Implementation.AcceptedAt` | `Implementation.AccomplishedAt` |

- A phase is included in its average only when both timestamps are available for that request.
- Phases not applicable to a given request (e.g., no screening path) are excluded from that request's contribution.
- `null` is returned for a phase average if no requests have both timestamps for that phase.
- Overall average: `ResourceRequest.CreatedAt` → `Implementation.AccomplishedAt`.
- All averages expressed in **days** (double, rounded to 1 decimal).

**Response DTO:** `DashboardAverageTimeDTO`

```csharp
public record DashboardAverageTimeDTO(
    int SampleCount,
    double? OverallAvgDays,
    double? OpenToApprovalAvgDays,
    double? ApprovalToScreeningAvgDays,
    double? ScreeningToImplementationAvgDays,
    double? ImplementationToAccomplishedAvgDays
);
```

---

### New DTOs location

`NAFServer/src/Application/DTOs/Admin/DashboardStatsDTO.cs`
`NAFServer/src/Application/DTOs/Admin/DashboardAverageTimeDTO.cs`
`NAFServer/src/Application/DTOs/Admin/ResourceAccessCountDTO.cs`

---

### Controller changes

Add to `AdminController.cs`:

```csharp
[HttpGet("dashboard/stats")]
public async Task<IActionResult> GetDashboardStats([FromQuery] int? locationId)
    => Ok(await _dashboardService.GetStatsAsync(locationId));

[HttpGet("dashboard/average-time")]
public async Task<IActionResult> GetDashboardAverageTime([FromQuery] int? locationId)
    => Ok(await _dashboardService.GetAverageTimeAsync(locationId));
```

---

## Frontend

### Location Toggle

Reuse the `useAdminLocations` hook (same pattern as `AdminNAFListPage`). State: `locationId: number | null`. Default to `user.locationId`. Dropdown options: "All Locations" (null) + each location by name.

All four widgets read from this shared `locationId` state.

---

### New hooks (`NAFClient/src/features/admin/hooks/`)

- `useAdminDashboardStats(locationId: number | null)` — React Query key `["admin", "dashboard", "stats", locationId]`, calls `adminApi.getDashboardStats(locationId)`
- `useAdminDashboardAverageTime(locationId: number | null)` — React Query key `["admin", "dashboard", "average-time", locationId]`, calls `adminApi.getDashboardAverageTime(locationId)`

### New API methods (`NAFClient/src/features/admin/api.ts`)

```ts
getDashboardStats: (locationId: number | null) =>
  api.get<DashboardStatsDTO>("/admin/dashboard/stats", { params: { locationId } }).then(r => r.data),

getDashboardAverageTime: (locationId: number | null) =>
  api.get<DashboardAverageTimeDTO>("/admin/dashboard/average-time", { params: { locationId } }).then(r => r.data),
```

### New types (`NAFClient/src/features/admin/types.ts`)

```ts
interface DashboardStatsDTO {
  recentByStatus: Record<string, AdminResourceRequestDTO[]>;
  beyondDeadlineCount: number;
  resourceAccessCounts: ResourceAccessCountDTO[];
}

interface ResourceAccessCountDTO {
  resourceId: string;
  resourceName: string;
  count: number;
}

interface DashboardAverageTimeDTO {
  sampleCount: number;
  overallAvgDays: number | null;
  openToApprovalAvgDays: number | null;
  approvalToScreeningAvgDays: number | null;
  screeningToImplementationAvgDays: number | null;
  implementationToAccomplishedAvgDays: number | null;
}
```

---

### Page Layout — `AdminHomePage.tsx`

Top to bottom:

**1. Header row**
- Title: "Dashboard" (amber-500, same style as other admin pages)
- Location dropdown (right-aligned or below title): "All Locations" + individual locations

**2. Top stat cards (2 columns)**

| Card | Content | Click behavior |
|---|---|---|
| Beyond Deadline | Large count number, red accent | Navigate to `/admin/resource-requests` |
| Resource Access | Table: Resource Name \| Employee Count, ordered by count desc | No click |

**3. Average Time card (full width)**
- Prominent overall avg in days (or "No data" if null)
- Sub-label: "Based on {sampleCount} accomplished requests · refreshes every 8 hours"
- 4 phase rows (label + value):
  - Open → First Approval Action
  - Approval → Screening
  - Screening → Implementation
  - Implementation → Accomplished
- Each phase shows the avg in days or "N/A" if null

**4. Recent Requests by Status (full width)**
- Tab switcher: 8 tabs, one per `Progress` value (same pill style as the resource requests page)
- Active tab shows a list of up to 5 rows: Employee Name | Resource | Date Needed | NAF Reference
- Each row clickable → `navigate(/admin/NAF/${nafId})`
- Empty state: "No recent requests" if the status has 0 results

---

### `ProgressBadge` update

Add a `DEACTIVATED` case with a gray/muted style, consistent with the existing badge variants.

---

## Files Changed

| File | Change |
|---|---|
| `NAFServer/src/Domain/Enums/Progress.cs` | Add `DEACTIVATED = 7` |
| `NAFServer/src/Application/Interfaces/IDashboardService.cs` | New interface |
| `NAFServer/src/Application/Services/DashboardService.cs` | New service |
| `NAFServer/src/Application/DTOs/Admin/DashboardStatsDTO.cs` | New DTO |
| `NAFServer/src/Application/DTOs/Admin/DashboardAverageTimeDTO.cs` | New DTO |
| `NAFServer/src/Application/DTOs/Admin/ResourceAccessCountDTO.cs` | New DTO |
| `NAFServer/src/API/Controllers/AdminController.cs` | Add 2 endpoints, inject `IDashboardService` |
| `NAFServer/src/Infrastructure/DI` or `Program.cs` | Register `DashboardService` |
| EF Migration | For `DEACTIVATED` enum value (if stored as int, no schema change needed) |
| `NAFClient/src/features/admin/types.ts` | Add 3 new types, add `DEACTIVATED` to Progress |
| `NAFClient/src/features/admin/api.ts` | Add 2 API methods |
| `NAFClient/src/features/admin/hooks/useAdminDashboardStats.ts` | New hook |
| `NAFClient/src/features/admin/hooks/useAdminDashboardAverageTime.ts` | New hook |
| `NAFClient/src/features/admin/pages/AdminHomePage.tsx` | Full rewrite |
| `NAFClient/src/shared/components/ProgressBadge.tsx` (or equivalent) | Add `DEACTIVATED` style |
