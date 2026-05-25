# Employee & Department View Restructure — Design Spec

**Date:** 2026-05-25
**Status:** Approved

---

## Overview

Restructure the NAF system's employee and department data layer so that all employee and department information is sourced exclusively from Microsoft SQL Server views (`vw_Employees`, `vw_Departments`). All view data is eagerly loaded into `IMemoryCache` on startup and refreshed on a background timer. The `UserLocation`, `UserDepartment`, `Location`, and `Department` app-DB concepts are removed entirely. NAF location becomes a string field derived from the creating employee's `Location` at creation time.

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

### `NAF` (updated)

- Remove `LocationId` (int, FK to `Location`)
- Add `Location` (string?) — set at creation time from `employee.Location`

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

## What Gets Removed

### Entities (+ all associated repos, services, controllers, mappers, DTOs)

| Entity | Files removed |
|---|---|
| `Location` | Entity, `LocationRepository`, `LocationService`, `LocationMapper`, `LocationDTO` |
| `UserLocation` | Entity, `UserLocationRepository`, `UserLocationService`, `UserLocationController`, `UserLocationMapper`, `UserLocationDTO` |
| `Department` (app table) | Entity, `DepartmentRepository`, `DepartmentService`, `DepartmentsController`, `DepartmentMapper`, `DepartmentDTO`, `DepartmentDetailDTO`, `CreateDepartmentDTO` |
| `UserDepartment` | Entity, `UserDepartmentRepository`, `UserDepartmentService`, `UserDepartmentController`, `UserDepartmentMapper`, `UserDepartmentDTO` |
| `DepartmentEmployee` | Entity, `DepartmentEmployeeRepository`, `DepartmentEmployeeService`, `DepartmentEmployeeDTO` |

### DB Tables Dropped (via migration)

- `Locations`
- `Departments`
- `UserLocations`
- `UserDepartments`
- `DepartmentEmployees`

### NAF Table Migration

- Drop column `LocationId` (int) + FK constraint
- Add column `Location` (nvarchar, nullable)

---

## AppDbContext Changes

- Add `DbSet<Employee> Employees` configured as `HasNoKey().ToView("vw_Employees")`
- Add `DbSet<DepartmentView> Departments` configured as `HasNoKey().ToView("vw_Departments")`
- Remove `DbSet`s: `Locations`, `UserLocations`, `UserDepartments`, `DepartmentEmployees`, and the existing app `Departments`
- Remove `NAF → Location` relationship configuration
- Add `NAF.Location` string column configuration

---

## Service Layer Changes (Server)

| Service | Change |
|---|---|
| `EmployeeRepository` | Fully rewritten — all methods read from `"employees:all"` cache |
| `IEmployeeRepository` | Add `GetByFullNameAsync`, `GetSubordinatesAsync`, `GetByDepartmentAsync`. Remove per-key caching methods. |
| `NAFService` | On NAF creation: `naf.Location = employee.Location` (no LocationId lookup) |
| `DashboardService` | Update any department/location queries to use employee cache |
| `EmployeeCacheHostedService` | New — startup loader + 6-hour background refresh |

---

## API Changes (Server)

| Endpoint | Change |
|---|---|
| `POST api/admin/cache/refresh` | New — triggers immediate employee + department cache reload |
| `GET api/admin/departments/**` | Removed |
| `GET/POST/DELETE api/user-locations/**` | Removed |
| `GET/POST/DELETE api/user-departments/**` | Removed |
| `GET api/employees/search/{match}` | Unchanged — now queries cache |

---

## Client Side Changes

### Types

| File | Change |
|---|---|
| `types/api/naf.ts` | Replace `locationId: number` with `location: string` |
| `types/api/employee.ts` | Replace `departmentHeadId` with `departmentHead: string` (full name). Remove `hiredDate`, `regularizedDate`, `separatedDate`. |

### Removed Features

- Department management pages, hooks, and API service calls (`api/admin/departments/**`)
- Location management pages, hooks, and API service calls (`api/user-locations/**`, `api/user-departments/**`)
- Location picker from NAF creation flow — location is set automatically server-side

### Modified Features

| Feature | Change |
|---|---|
| NAF list/detail views | Display `location` as plain string (no ID resolution needed) |
| NAF creation dialog | Remove location selection step |
| Admin home/dashboard | Remove department/location management cards |
| Employee display | Show `departmentHead` as full name string directly |

### New Features

- Admin cache refresh button → calls `POST api/admin/cache/refresh`

---

## Assumptions & Constraints

- `DepartmentHead` full names are unique enough across the employee dataset — no collision handling needed
- `vw_Employees` and `vw_Departments` exist in the SQL Server database before the app starts; the app does not create or manage them
- Existing NAF records with `LocationId` will have their `Location` field set to `NULL` after migration — acceptable as historical data
- Employee data volume: 5,000–10,000 rows — fits comfortably in memory (~3 MB)
- Cache is process-local (`IMemoryCache`) — sufficient for single-instance deployment
