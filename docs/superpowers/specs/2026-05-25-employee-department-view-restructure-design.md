# Employee & Department View Restructure — Design Spec

**Date:** 2026-05-25
**Status:** Approved

---

## Overview

Restructure the NAF system's employee and department data layer so that all employee and department information is sourced exclusively from Microsoft SQL Server views (`vw_Employees`, `vw_Departments`). All view data is eagerly loaded into `IMemoryCache` on startup and refreshed on a background timer. The `UserLocation`, `UserDepartment`, and `Department` app-DB concepts are removed entirely.

`Location` is **kept** but repurposed: it no longer tracks user-to-location assignment; instead it serves as a configuration entity controlling NAF date rules per location. A new `ResourceRequestAllowance` entity defines the minimum days required between today and `DateNeeded` for a given resource × location combination. Each `Location` also carries an `AllowWeekendDateNeeded` flag that controls whether weekend dates are valid for `DateNeeded`.

NAF retains `LocationId` as a FK to `Location`, populated at creation by matching the creating employee's `Location` string (from the view) to `Location.Name` in the app DB.

---

## SQL Server Views

Two views are provided by the HR system. The application does not own or migrate these views — they are created and maintained manually in SQL Server.

### `vw_Employees`

```sql
SELECT
    E.EmployeeNumber,
    E.FirstName,
    E.MiddleName,
    E.LastName,
    E.FullName,
    E.Status,
    E.PositionDesc AS Position,
    CASE
        WHEN E.LocationDesc LIKE '%MAKATI%'  THEN 'MAKATI'
        WHEN E.LocationDesc LIKE '%ANTIQUE%' THEN 'ANTIQUE'
        WHEN E.LocationDesc LIKE '%CALACA%'  THEN 'CALACA'
        ELSE E.LocationDesc
    END AS Location,
    E.SupervisorId,
    E.DepartmentDesc,
    E.DepartmentCode,
    E.DepartmentHead,   -- full name string, not an ID
    E.CompanyCode AS Company
FROM ...
```

### `vw_Departments`

```sql
SELECT DISTINCT
    E.DepartmentCode AS Id,
    E.DepartmentDesc,
    E.DepartmentHead   -- full name string, not an ID
FROM ...
```

`DepartmentHead` in both views is the department head's **full name**. Resolving to an employee ID is done by looking up `FullName` in the cached employee list.

---

## Entity Changes (Server)

### `Employee` (updated)

Becomes a **keyless EF Core entity** mapped to `vw_Employees`. No migrations track it.

| Property | Type | Maps to |
|---|---|---|
| `Id` | `string` | `EmployeeNumber` |
| `FirstName` | `string` | `FirstName` |
| `MiddleName` | `string?` | `MiddleName` |
| `LastName` | `string` | `LastName` |
| `FullName` | `string` | `FullName` |
| `Status` | `string` | `Status` |
| `Position` | `string?` | `Position` |
| `Location` | `string?` | `Location` (normalized by CASE) |
| `SupervisorId` | `string?` | `SupervisorId` |
| `DepartmentId` | `string` | `DepartmentCode` |
| `DepartmentDesc` | `string` | `DepartmentDesc` |
| `DepartmentHead` | `string` | `DepartmentHead` (full name) |
| `Company` | `string` | `Company` |

Removed properties: `DepartmentHeadId`, `HiredDate`, `RegularizedDate`, `SeparatedDate`.

### `DepartmentView` (new)

New keyless EF Core entity mapped to `vw_Departments`.

| Property | Type | Maps to |
|---|---|---|
| `Id` | `string` | `DepartmentCode` |
| `DepartmentDesc` | `string` | `DepartmentDesc` |
| `DepartmentHead` | `string` | `DepartmentHead` (full name) |

### `Location` (updated — repurposed)

Stays as an app-DB entity. Loses all user-assignment associations. Gains `AllowWeekendDateNeeded`.

| Property | Type | Notes |
|---|---|---|
| `Id` | `int` | PK |
| `Name` | `string` | Must match normalized location strings from `vw_Employees` (e.g. `"MAKATI"`, `"ANTIQUE"`, `"CALACA"`) |
| `IsActive` | `bool` | |
| `AllowWeekendDateNeeded` | `bool` | If `false`, `DateNeeded` on Saturday or Sunday is rejected |

Navigation properties removed: `Users`, `NAFs` (NAF still references Location via `LocationId` FK — not a nav property that needs removal, just the old collection on Location).

### `ResourceRequestAllowance` (new)

Defines the minimum lead days for a resource × location combination.

| Property | Type | Notes |
|---|---|---|
| `Id` | `int` | PK |
| `ResourceId` | `int` | FK to `Resource` |
| `LocationId` | `int` | FK to `Location` |
| `AllowanceDays` | `int` | Minimum days from today to `DateNeeded` (inclusive) |

Unique constraint on `(ResourceId, LocationId)` — one allowance record per resource per location.

Navigation properties: `Resource`, `Location`.

### `NAF` (unchanged structure)

`LocationId` (int, FK to `Location`) is **kept**. At NAF creation time, `LocationId` is resolved by matching `employee.Location` (string from view) against `Location.Name` in the app DB. If no match is found, NAF creation fails with a validation error.

### `User` (updated)

- Remove `UserLocations` navigation property
- Remove `UserDepartments` navigation property

---

## Cache Strategy

### Startup Loading

`EmployeeCacheHostedService` implements `IHostedService` and runs on application startup. It:

1. Queries `vw_Employees` via EF Core → stores result as `List<Employee>` under cache key `"employees:all"` with no expiry
2. Queries `vw_Departments` via EF Core → stores result as `List<DepartmentView>` under cache key `"departments:all"` with no expiry
3. Starts a background timer that calls `RefreshAsync()` every **6 hours**

`RefreshAsync()` re-queries both views and overwrites the cache entries atomically (set new value, no remove-then-set gap).

### EmployeeRepository Methods (all query from cache)

| Method | Logic |
|---|---|
| `GetByIdAsync(string id)` | `FirstOrDefault(e => e.Id == id)` |
| `GetByFullNameAsync(string fullName)` | `FirstOrDefault(e => e.FullName == fullName)` |
| `GetSubordinatesAsync(string id)` | Resolve target employee's `FullName` from cache, then `Where(e => e.SupervisorId == id \|\| e.DepartmentHead == targetFullName)` |
| `SearchAsync(string match)` | Filter active employees by `Id`, `LastName`, `FirstName`, `MiddleName` containing `match` |
| `GetByDepartmentAsync(string deptId)` | `Where(e => e.DepartmentId == deptId)` |

### Admin Cache Refresh Endpoint

`POST api/admin/cache/refresh` — calls `RefreshAsync()` immediately. Returns `204 No Content` on success.

---

## ResourceRequest DateNeeded Validation

When a resource request is created, the server validates `DateNeeded` against the allowance rules for the NAF's location and the requested resource:

1. Look up `ResourceRequestAllowance` where `ResourceId == request.ResourceId AND LocationId == naf.LocationId`.
2. If a record exists: `DateNeeded` must be `>= today + AllowanceDays` (calendar days). If not, return `400` with a descriptive message.
3. Look up the `Location` record for `naf.LocationId`.
4. If `!location.AllowWeekendDateNeeded` and `DateNeeded` falls on Saturday or Sunday: return `400`.
5. If no `ResourceRequestAllowance` exists for the resource × location combination, no minimum-days constraint is applied (only the weekend rule from `Location` still applies).

---

## What Gets Removed

### Entities (+ all associated repos, services, controllers, mappers, DTOs)

| Entity | Files removed |
|---|---|
| `UserLocation` | Entity, `UserLocationRepository`, `UserLocationService`, `UserLocationController`, `UserLocationMapper`, `UserLocationDTO` |
| `Department` (app table) | Entity, `DepartmentRepository`, `DepartmentService`, `DepartmentsController`, `DepartmentMapper`, `DepartmentDTO`, `DepartmentDetailDTO`, `CreateDepartmentDTO` |
| `UserDepartment` | Entity, `UserDepartmentRepository`, `UserDepartmentService`, `UserDepartmentController`, `UserDepartmentMapper`, `UserDepartmentDTO` |
| `DepartmentEmployee` | Entity, `DepartmentEmployeeRepository`, `DepartmentEmployeeService`, `DepartmentEmployeeDTO` |

### DB Tables Dropped (via migration)

- `Departments`
- `UserLocations`
- `UserDepartments`
- `DepartmentEmployees`

### DB Tables Added (via migration)

- `ResourceRequestAllowances` — with FK constraints to `Resources` and `Locations`, unique index on `(ResourceId, LocationId)`

### Location Table Migration

- Add column `AllowWeekendDateNeeded` (bit, not null, default `1`)

---

## AppDbContext Changes

- Add `DbSet<Employee> Employees` configured as `HasNoKey().ToView("vw_Employees")`
- Add `DbSet<DepartmentView> DepartmentViews` configured as `HasNoKey().ToView("vw_Departments")`
- Add `DbSet<ResourceRequestAllowance> ResourceRequestAllowances`
- Remove `DbSet`s: `UserLocations`, `UserDepartments`, `DepartmentEmployees`, and the existing app `Departments`
- Remove `NAF → Location` collection navigation if present on `Location`
- Keep `NAF → Location` FK relationship (`NAF.LocationId`)
- Configure `ResourceRequestAllowance` unique index on `(ResourceId, LocationId)`

---

## Service Layer Changes (Server)

| Service | Change |
|---|---|
| `EmployeeRepository` | Fully rewritten — all methods read from `"employees:all"` cache |
| `IEmployeeRepository` | Add `GetByFullNameAsync`, `GetSubordinatesAsync`, `GetByDepartmentAsync`. Remove per-key caching methods. |
| `NAFService` | On NAF creation: resolve `employee.Location` string to `Location.Name` to get `LocationId`. Fail if no matching Location found. |
| `ResourceRequestService` | On resource request creation: run `DateNeeded` validation against `ResourceRequestAllowance` + `Location.AllowWeekendDateNeeded`. |
| `DashboardService` | Update any department/location queries to use employee cache |
| `EmployeeCacheHostedService` | New — startup loader + 6-hour background refresh |
| `ResourceRequestAllowanceService` | New — CRUD for allowance records |
| `LocationService` | Updated — remove user-assignment methods, add `AllowWeekendDateNeeded` management |

---

## API Changes (Server)

| Endpoint | Change |
|---|---|
| `POST api/admin/cache/refresh` | New — triggers immediate employee + department cache reload |
| `GET api/admin/locations` | Kept — returns locations with `AllowWeekendDateNeeded` |
| `PUT api/admin/locations/{id}` | Updated — allows editing `AllowWeekendDateNeeded` |
| `GET api/admin/resource-allowances` | New — list all allowance records |
| `POST api/admin/resource-allowances` | New — create allowance (resource × location × days) |
| `PUT api/admin/resource-allowances/{id}` | New — update allowance days |
| `DELETE api/admin/resource-allowances/{id}` | New — remove allowance |
| `GET api/admin/departments/**` | Removed |
| `GET/POST/DELETE api/user-locations/**` | Removed |
| `GET/POST/DELETE api/user-departments/**` | Removed |
| `GET api/employees/search/{match}` | Unchanged — now queries cache |

---

## Client Side Changes

### Types

| File | Change |
|---|---|
| `types/api/naf.ts` | `locationId` stays — no change needed |
| `types/api/employee.ts` | Replace `departmentHeadId` with `departmentHead: string` (full name). Remove `hiredDate`, `regularizedDate`, `separatedDate`. |
| `types/api/location.ts` | Add `allowWeekendDateNeeded: boolean` |
| `types/api/resourceRequestAllowance.ts` | New — `{ id, resourceId, locationId, allowanceDays }` |

### Removed Features

- Department management pages, hooks, and API service calls (`api/admin/departments/**`)
- User-location / user-department assignment pages and API calls (`api/user-locations/**`, `api/user-departments/**`)
- Location picker from NAF creation flow — `LocationId` is resolved automatically server-side from the employee's location

### Modified Features

| Feature | Change |
|---|---|
| NAF creation dialog | Remove location selection step |
| Admin home/dashboard | Remove department/location management cards |
| Employee display | Show `departmentHead` as full name string directly |
| Resource request form | Date picker disables dates that fail allowance rules: dates before `today + allowanceDays`, and weekends if `!location.AllowWeekendDateNeeded` |

### New Features

| Feature | Notes |
|---|---|
| Admin cache refresh button | Calls `POST api/admin/cache/refresh` |
| Admin location edit | Toggle `AllowWeekendDateNeeded` per location |
| Admin resource allowance management | CRUD for `ResourceRequestAllowance` — pick resource, pick location, set minimum days |
| Date picker constraint in resource request form | Fetches allowance for the NAF's location + resource on form open; disables invalid dates client-side before submission |

---

## Assumptions & Constraints

- `DepartmentHead` full names are unique enough across the employee dataset — no collision handling needed
- `vw_Employees` and `vw_Departments` exist in the SQL Server database before the app starts; the app does not create or manage them
- `Location.Name` values in the app DB must be kept in sync with the normalized location strings produced by `vw_Employees` (e.g. `"MAKATI"`, `"ANTIQUE"`, `"CALACA"`) — this is a seeding/admin responsibility
- If no `ResourceRequestAllowance` exists for a resource × location pair, only the weekend rule applies
- Existing NAF records retain their `LocationId` — no data migration needed
- Employee data volume: 5,000–10,000 rows — fits comfortably in memory (~3 MB)
- Cache is process-local (`IMemoryCache`) — sufficient for single-instance deployment
