# Admin Roles Revamp — Design Spec

**Date:** 2026-04-29  
**Scope:** Fix broken user role management on the admin side + UI improvements

---

## Problem Summary

Three bugs make the current Roles page non-functional:

1. **Roles display as numbers** — `UserDTO.Roles` is typed as `List<Roles>` (C# enum). Without a global `JsonStringEnumConverter`, ASP.NET Core serializes enum values as integers (`[0, 2]` instead of `["REQUESTOR_APPROVER", "ADMIN"]`). The frontend renders these integers directly.

2. **404 on form submit** — `AdminService.AddUserAsync` unconditionally runs `new User(dto.EmployeeId)` and saves. Since the seeder creates a `User` record for every employee, submitting an existing employee ID causes a DB unique constraint violation. If it somehow gets past that, `AddUserCurrentLocation` throws `KeyNotFoundException("User is already in this location")`, which the controller converts to a 404.

3. **Frontend role list has `TECHNICAL_TEAM`** — The frontend `ROLES` constant includes `TECHNICAL_TEAM`, which does not exist in the backend `Roles` enum (`REQUESTOR_APPROVER`, `MANAGEMENT`, `ADMIN`, `HR`). Submitting it causes `Enum.TryParse` to fail → 400 BadRequest.

Additionally, the UI has several usability gaps: no feedback when looking up an employee ID, roles are indistinct visually, role removal is instant with no confirmation, and there is no way to search the user list.

---

## Approach

**Dedicated "assign role to employee" endpoint (Approach B).**

The current `POST /admin/users` is replaced by `POST /admin/users/{employeeId}/roles`. This makes the intent explicit in the URL and separates user creation from role assignment. The service method uses an upsert pattern: find existing user by employee ID, or create one if not found. All callers are the roles form — nothing else used the old endpoint.

---

## Architecture

### Backend

**New endpoint:** `POST /admin/users/{employeeId}/roles`  
**Controller:** `AdminController`  
**New DTO:** `AssignRoleDTO(string Role, int LocationId)`  
**New service method:** `AdminService.AssignRoleToEmployeeAsync(string employeeId, AssignRoleDTO dto)`

**Service logic (in order):**
1. `Enum.TryParse(dto.Role)` → throw `ArgumentException` if invalid (→ 400)
2. `_roleRepository.GetByNameAsync(role)` → throw `KeyNotFoundException` if not seeded (→ 404)
3. `_userRepository.GetUserByEmployeeId(employeeId)` → if `KeyNotFoundException`, create `new User(employeeId)` and save
4. `_userLocationRepository.AddUserCurrentLocation(user.Id, dto.LocationId)` → catch `KeyNotFoundException("already in this location")` silently
5. `_userRoleRepository.AddUserRoleAsync(user.Id, roleEntity.Id)` → repository already handles reactivating an inactive role

**Enum serialization fix:** Add `JsonStringEnumConverter` globally in `Program.cs` (`services.AddControllers().AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()))`). This alone fixes the role-as-numbers bug.

**`UserDTO.cs`:** Change `List<Roles> Roles` → `List<string> Roles`. Update `AdminService.GetAllUsersInLocationAsync` mapping from `.Select(r => r.Role.Name)` to `.Select(r => r.Role.Name.ToString())`.

**Old `POST /admin/users` endpoint:** Remove.

### Frontend

**`types.ts`:**
- Add `AssignRoleDTO { role: string; locationId: number }`
- Remove `AddUserDTO`

**`api.ts`:**
- Replace `addUser` with `assignRole(employeeId: string, data: AssignRoleDTO)`
- URL: `POST /admin/users/${employeeId}/roles`

**`useAdminUsers.ts`:**
- Update `addUserMutation` to call `adminApi.assignRole(employeeId, data)` where `employeeId` is split out of the payload

**`RolesPage.tsx`:**
- Fix `ROLES` constant: `["ADMIN", "MANAGEMENT", "REQUESTOR_APPROVER", "HR"]`
- Update form state — `employeeId` is kept as a separate field, not part of `AssignRoleDTO`
- All four UI improvements (see UI section below)

---

## UI Improvements

### 1. Role-colored badges

Each role gets a distinct color class:

| Role | Style |
|---|---|
| `ADMIN` | amber background, amber text |
| `MANAGEMENT` | blue background, blue text |
| `HR` | green background, green text |
| `REQUESTOR_APPROVER` | slate background, slate text |

Implemented as a `ROLE_COLORS` map in `RolesPage.tsx`. Badges use these Tailwind classes instead of ShadCN's generic `variant="secondary"`.

### 2. Employee lookup preview

On `onBlur` of the employee ID field, fire a GET to the existing employee search/lookup endpoint. Display the resolved name and department below the field. States:
- **Loading:** small spinner inline
- **Found:** employee name + department in muted text
- **Not found:** "Employee not found" error text in red
- **Empty:** nothing shown

Uses the existing `searchEmployees(employeeId)` function (`GET /employees/search/{match}` in `employeeService.ts`). After the call, find the exact match with `results.find(e => e.id === employeeId)`. Implemented as local `useState` + a `useEffect` that fires on employee ID change (debounced ~400ms). Clears when the field is emptied.

### 3. Inline role removal confirmation

Clicking ✕ does not immediately fire the mutation. Instead it sets a local `pendingRemove` state to `{ userId, roleName }`. The badge row for that role swaps to show:

```
[ADMIN badge]  Remove?  [Yes]  [No]
```

Clicking **Yes** fires `removeRoleMutation`. Clicking **No** clears `pendingRemove`. Implemented as a conditional render within the card — no dialog, no extra library.

### 4. Client-side search/filter

A text `<Input placeholder="Search by name or ID…" />` above the user list. Filters the already-loaded `users` array:

```ts
const filtered = users.filter(u =>
  `${u.firstName} ${u.lastName} ${u.employeeId}`
    .toLowerCase().includes(search.toLowerCase())
);
```

No debounce needed — local array operation. Search state is a simple `useState<string>("")`.

---

## Files Changed

| File | Change |
|---|---|
| `NAFServer/Program.cs` | Add global `JsonStringEnumConverter` |
| `NAFServer/src/Application/DTOs/User/UserDTO.cs` | `List<Roles>` → `List<string>` |
| `NAFServer/src/Application/DTOs/Admin/AddUserDTO.cs` | Remove file (replaced by `AssignRoleDTO`) |
| `NAFServer/src/Application/DTOs/Admin/AssignRoleDTO.cs` | New file |
| `NAFServer/src/Application/Interfaces/IAdminService.cs` | Replace `AddUserAsync` with `AssignRoleToEmployeeAsync` |
| `NAFServer/src/Application/Services/AdminService.cs` | Implement `AssignRoleToEmployeeAsync`, remove `AddUserAsync` |
| `NAFServer/src/API/Controllers/AdminController.cs` | Replace `AddUser` action with `AssignRoleToEmployee` |
| `NAFClient/src/features/admin/types.ts` | Add `AssignRoleDTO`, remove `AddUserDTO` |
| `NAFClient/src/features/admin/api.ts` | Replace `addUser` with `assignRole` |
| `NAFClient/src/features/admin/hooks/useAdminUsers.ts` | Update mutation to use `assignRole` |
| `NAFClient/src/features/admin/pages/RolesPage.tsx` | Fix `ROLES`, all four UI improvements |

---

## Out of Scope

- Role history view (existing `/user-roles/{userId}/history` endpoint is untouched)
- Department assignment on the roles form
- Pagination of the user list
- Any changes to other admin pages
