# Department Management — Design Spec

**Date:** 2026-05-13
**Feature:** Admin Department Management
**Status:** Approved

---

## Overview

Add a department management section to the admin panel. Admins can view all departments (filtered by location), create departments, view department details, manage department membership (add/remove HR employees), view or create NAFs for department employees, change department heads, and set departments inactive.

---

## Background & Constraints

- **Employee data** comes from stored procedures querying an external HR database (`[192.168.70.49].[PCV5_DMCI].[HRDEV]`). The `EmployeeRepository` will remain on stored procedures for now. Commented-out code will be added to show how it will query a SQL view in the future when transitioning to a local employee DB.
- **Department entity** already exists with `DepartmentRepository` and `DepartmentService`, but `CreateDepartmentAsync` is not yet implemented.
- **`UserDepartment`** table tracks app Users (people with accounts) assigned to departments — kept as-is, separate concern.
- **`DepartmentEmployee`** is a new table tracking HR employees assigned to departments for NAF management purposes. An employee does not need an app account to be in this table.

---

## Backend Design

### New Entity: `DepartmentEmployee`

```
DepartmentEmployee
  Id           int (PK)
  DepartmentId int (FK → Department)
  EmployeeId   string
  IsActive     bool
  DateAdded    DateTime
  DateRemoved  DateTime?
```

Mirrors the pattern of the existing `UserDepartment` entity.

### New Controller: `DepartmentsController`

Path: `/api/admin/departments`
Auth: ADMIN role required

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all departments. Optional `?locationId=` filter. |
| GET | `/:id` | Get department detail (includes head's full name and position). |
| POST | `/` | Create a new department. Implements the currently stubbed `DepartmentService.CreateDepartmentAsync`. |
| PUT | `/:id/head` | Change the department head (employee ID in body). |
| PUT | `/:id/inactive` | Set department to inactive. |
| GET | `/:id/employees` | Get all employees assigned to this department (from `DepartmentEmployee` table, enriched with SP details). |
| POST | `/:id/employees` | Add an HR employee to the department (store in `DepartmentEmployee`). |
| DELETE | `/:id/employees/:employeeId` | Remove an employee from the department (soft delete — set `IsActive = false`, record `DateRemoved`). |

### DTOs

**`DepartmentDetailDTO`** — extends `DepartmentDTO` with:
- `DepartmentHeadName` (string) — full name of the department head from SP
- `DepartmentHeadPosition` (string)

**`DepartmentEmployeeDTO`**:
- `EmployeeId`, `FirstName`, `MiddleName`, `LastName`, `Position`
- `NafId` (Guid?, nullable) — populated by checking the NAF table for this employee
- `NafReference` (string?, nullable)
- `NafProgress` (string?, nullable) — progress status of the NAF

**`AddDepartmentEmployeeDTO`**:
- `EmployeeId` (string)

**`CreateDepartmentDTO`** (already exists):
- `Code`, `Name`, `DepartmentHeadId`, `LocationId`

### Service Changes

- `DepartmentService.CreateDepartmentAsync` — implement the currently stubbed method.
- New `DepartmentEmployeeService` with methods:
  - `GetDepartmentEmployeesAsync(departmentId)` — fetches `DepartmentEmployee` records, enriches each with SP employee details and NAF lookup.
  - `AddEmployeeToDepartmentAsync(departmentId, employeeId)`
  - `RemoveEmployeeFromDepartmentAsync(departmentId, employeeId)`

### EmployeeRepository — Transition Comment

In `EmployeeRepository`, after the existing SP-based methods, add a commented block:

```csharp
// FUTURE: When transitioning from stored procedures to local DB view,
// replace SP calls with EF queries against the vw_DepartmentEmployees view.
// Example:
// public async Task<List<Employee>> GetByDepartmentAsync(string departmentCode)
// {
//     return await _context.Employees
//         .FromSqlRaw("SELECT * FROM vw_DepartmentEmployees WHERE DepartmentCode = {0}", departmentCode)
//         .ToListAsync();
// }
```

---

## Frontend Design

### Routes

| Route | Page |
|-------|------|
| `/admin/departments` | `DepartmentListPage` |
| `/admin/departments/:departmentId` | `DepartmentDetailPage` |

Added to `routesEnum.ts` as `ADMIN_DEPARTMENTS` and `ADMIN_DEPARTMENT_DETAIL`.

### Department List Page

- **Location filter dropdown** — "All Locations" + each location, same pattern as Users and NAFs pages.
- **Data table columns:** Name, Code, Location, Department Head, Status (Active/Inactive badge).
- **"Add Department" button** → opens `AddDepartmentDialog`:
  - Fields: Name, Code, Location (dropdown), Department Head (employee search input — same pattern as existing "Add User" dialog).
  - On submit → `POST /api/admin/departments`.

### Department Detail Page

**Header section:**
- Department name, code, location, status badge (Active / Inactive).
- "Change Department Head" button → `ChangeDepartmentHeadDialog` (employee search → `PUT /:id/head`).
- "Set Inactive" button → confirmation dialog → `PUT /:id/inactive`. Hidden if already inactive. Only sets the department's `IsActive` flag — does not remove `DepartmentEmployee` assignments.

**Employee section:**
- "Add Employee" button → `AddDepartmentEmployeeDialog` (employee search → `POST /:id/employees`).
- Employee table columns: Name, Employee ID, Position, NAF Status, Actions.
  - If `nafId` is non-null → "View NAF" button → navigates to `/admin/NAF/:nafId`.
  - If `nafId` is null → "Create NAF" button → opens existing `createNAFDialog` pre-filled with employee.
- "Remove" action per row → confirmation dialog → `DELETE /:id/employees/:employeeId`.

### Frontend File Structure

```
NAFClient/src/features/admin/departments/
  pages/
    DepartmentListPage.tsx
    DepartmentDetailPage.tsx
  components/
    AddDepartmentDialog.tsx
    ChangeDepartmentHeadDialog.tsx
    AddDepartmentEmployeeDialog.tsx
    DepartmentEmployeeTable.tsx
  hooks/
    useDepartments.ts        — React Query: list, detail, create, set inactive, change head
    useDepartmentEmployees.ts — React Query: list employees, add, remove
  api.ts                     — Axios calls to /api/admin/departments
```

### Admin Sidebar

Add "Departments" nav item to `AdminLayout.tsx` linking to `/admin/departments`.

---

## Data Flow Summary

1. Admin views `/admin/departments` → frontend calls `GET /api/admin/departments?locationId=` → returns list of departments from local DB.
2. Admin opens department detail → `GET /api/admin/departments/:id/employees` → backend queries `DepartmentEmployee` table for employee IDs → fetches each employee's details via `sp_GetEmployeeDetails` (cached 4hr) → checks NAF table for each employee → returns `DepartmentEmployeeDTO[]`.
3. Admin adds employee → employee search hits `/api/employees/search/{match}` (existing SP) → admin selects → `POST /api/admin/departments/:id/employees` stores `DepartmentEmployee` record.
4. Admin views/creates NAF → reuses existing NAF detail page and `createNAFDialog`.

---

## What Is Not In Scope

- Location management (create/edit locations) — separate concern.
- Role or access control changes per department.
- Syncing local department membership with HR department assignments.
- Bulk import of department employees.
