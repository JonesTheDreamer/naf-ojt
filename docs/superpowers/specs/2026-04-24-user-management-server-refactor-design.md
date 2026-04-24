# User Management Server Refactor — Design Spec

**Date:** 2026-04-24  
**Scope:** Server-side only. Fix broken implementations, create missing services/controllers for user location, department, and role management. Prepare the backend for client-side consumption.

---

## Context

The following entities were modified: `Employee`, `User`, `Department`, `Role`, `Location`, `UserDepartment`, `UserRole`, `UserLocation`.

Key changes already made:
- Employee data now comes from the SQL view `vw_EmployeeLinkPeopleCore`
- `UserRole`, `UserLocation`, `UserDepartment` are normalized join tables that support audit history (DateAdded, DateRemoved, IsActive)
- Business rules: user can be in **one department**, **one location**, and **multiple roles**

The implementation is incomplete and has several bugs preventing compilation and correct runtime behavior.

---

## Section 1: Fixes to Existing Code

### EmployeeRepository
- Remove all stored procedure calls (`sp_GetEmployeeDetails`, `sp_GetSubordinates`, `sp_SearchEmployee`)
- Configure `AppDbContext` to map `Employee` entity to the view: `modelBuilder.Entity<Employee>().ToView("vw_EmployeeLinkPeopleCore")`
- Rewrite `GetByIdAsync`, `GetEmployeeSubordinates`, and `SearchEmployee` as EF Core LINQ queries against `_context.Employees`
- The entity is read-only (view), so no inserts/updates/deletes

### AuthService
- `GetCurrentUserAsync(string employeeId)`:
  - Replace non-existent `_userRepository.GetRolesByEmployeeIdAsync()` call with:
    1. `_userRepository.GetUserByEmployeeId(employeeId)` to resolve `userId`
    2. `_userRoleRepository.GetUserActiveRolesAsync(userId)` to get active roles
  - Fix property name mismatches: `r.date_removed` → `r.DateRemoved`, `r.role` → `r.Role`
- `ValidateRoleAsync(string employeeId, Roles role)`:
  - Resolve `userId` via `GetUserByEmployeeId`
  - Resolve `roleId` via new `IRoleRepository.GetByNameAsync(role)`
  - Call `UserHasRoleAsync(userId, roleId)`

### AdminService
- `GetAllUsersInLocationAsync(int locationId)`: implement empty body
  1. Get `UserLocation` records for the location via `IUserLocationRepository.GetUserLocationsByLocationIdAsync(locationId)`
  2. For each user, fetch active roles via `IUserRoleRepository.GetUserActiveRolesAsync(userId)`
  3. Map results to `List<UserWithRolesDTO>`
- `AddUserAsync(AddUserDTO dto)`:
  1. Create and save `User` entity
  2. Assign initial location using `IUserLocationRepository.AddUserCurrentLocation(userId, dto.LocationId)`
  3. Assign initial role using `IUserRoleRepository.AddUserRoleAsync(userId, roleId)` — resolve `roleId` from `dto.Role` string via `IRoleRepository`

### UserRoleRepository
- `AddUserRoleAsync`: change `_context.UserLocations` → `_context.UserRoles`
- `GetUserRolesAsync`: fix error message from "No user locations found" → "No user roles found"
- Remove stale TODO comment

### AdminController
- `GetUsers`: change to accept `[FromQuery] int locationId`, pass to `GetAllUsersInLocationAsync(locationId)`
- Remove `GetLocations`, `AssignLocation`, `RemoveRole` — these move to dedicated controllers

### AppDbContext
- Add `modelBuilder.Entity<Employee>().ToView("vw_EmployeeLinkPeopleCore")`
- Uncomment and fix relationship configurations for `User → Employee`, `User → UserRoles`, `User → UserLocations`, `User → UserDepartments`

---

## Section 2: New Services

All interfaces go in `Application/Interfaces/`, implementations in `Application/Services/`.

### `IUserLocationService` / `UserLocationService`
Dependencies: `IUserLocationRepository`, `ILocationRepository`

| Method | Description |
|---|---|
| `GetAllLocationsAsync()` → `List<LocationDTO>` | All locations |
| `GetUserActiveLocationAsync(int userId)` → `UserLocationDTO` | Current location |
| `GetUserLocationHistoryAsync(int userId)` → `List<UserLocationDTO>` | Full audit history |
| `AssignLocationAsync(int userId, int locationId)` | Deactivate current via `RemoveUserFromLocation`, add new via `AddUserCurrentLocation` |
| `RemoveUserFromLocationAsync(int userId, int locationId)` | Deactivate the record |

### `IUserDepartmentService` / `UserDepartmentService`
Dependencies: `IUserDepartmentRepository`

| Method | Description |
|---|---|
| `GetUserActiveDepartmentAsync(int userId)` → `UserDepartmentDTO` | Current department |
| `GetUserDepartmentHistoryAsync(int userId)` → `List<UserDepartmentDTO>` | Full audit history |
| `AssignDepartmentAsync(int userId, int departmentId)` | Deactivate current, add new |
| `RemoveUserFromDepartmentAsync(int userId, int departmentId)` | Deactivate the record |

### `IUserRoleService` / `UserRoleService`
Dependencies: `IUserRoleRepository`

| Method | Description |
|---|---|
| `GetUserActiveRolesAsync(int userId)` → `List<UserRoleDTO>` | All active roles |
| `GetUserRoleHistoryAsync(int userId)` → `List<UserRoleDTO>` | Full audit history |
| `AssignRoleAsync(int userId, int roleId)` | Add new role record |
| `RemoveRoleAsync(int userId, int roleId)` | Deactivate the role record |

---

## Section 3: New Controllers

All controllers under `API/Controllers/`. Auth attributes follow existing patterns.

### `UserLocationController` — `/api/user-locations`
| Method | Route | Action |
|---|---|---|
| GET | `/` | `GetAllLocationsAsync()` |
| GET | `/{userId}/active` | `GetUserActiveLocationAsync(userId)` |
| GET | `/{userId}/history` | `GetUserLocationHistoryAsync(userId)` |
| POST | `/{userId}/assign` | `AssignLocationAsync(userId, [FromBody] int locationId)` |
| DELETE | `/{userId}/remove/{locationId}` | `RemoveUserFromLocationAsync(userId, locationId)` |

### `UserDepartmentController` — `/api/user-departments`
| Method | Route | Action |
|---|---|---|
| GET | `/{userId}/active` | `GetUserActiveDepartmentAsync(userId)` |
| GET | `/{userId}/history` | `GetUserDepartmentHistoryAsync(userId)` |
| POST | `/{userId}/assign` | `AssignDepartmentAsync(userId, [FromBody] int departmentId)` |
| DELETE | `/{userId}/remove/{departmentId}` | `RemoveUserFromDepartmentAsync(userId, departmentId)` |

### `UserRoleController` — `/api/user-roles`
| Method | Route | Action |
|---|---|---|
| GET | `/{userId}/active` | `GetUserActiveRolesAsync(userId)` |
| GET | `/{userId}/history` | `GetUserRoleHistoryAsync(userId)` |
| POST | `/{userId}/assign` | `AssignRoleAsync(userId, [FromBody] int roleId)` |
| DELETE | `/{userId}/remove/{roleId}` | `RemoveRoleAsync(userId, roleId)` |

### `AdminController` (after cleanup) — `/api/admin`
| Method | Route | Action |
|---|---|---|
| GET | `/users?locationId={id}` | `GetAllUsersInLocationAsync(locationId)` |
| POST | `/users` | `AddUserAsync(dto)` |

---

## Section 4: Supporting Infrastructure

### New `IRoleRepository` / `RoleRepository`
Location: `Domain/Interface/Repository/` and `Infrastructure/Persistence/Repositories/`

| Method | Description |
|---|---|
| `GetByNameAsync(Roles role)` → `Role?` | Resolve enum to entity (used by AuthService, AdminService) |
| `GetAllAsync()` → `List<Role>` | All roles |

### DI Registration (`Program.cs`)
Add scoped registrations:
- `IUserLocationService` → `UserLocationService`
- `IUserDepartmentService` → `UserDepartmentService`
- `IUserRoleService` → `UserRoleService`
- `IRoleRepository` → `RoleRepository`

---

## What's Out of Scope
- Database migrations (handled separately by the developer)
- Client-side implementation
- Seeding of `Role` and `Location` tables
