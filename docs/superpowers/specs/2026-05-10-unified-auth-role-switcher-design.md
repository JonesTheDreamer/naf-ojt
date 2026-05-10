# Unified Auth & Role Switcher Design

**Date:** 2026-05-10  
**Status:** Approved

## Overview

Replace the three separate login pages and endpoints with a single login flow. Upon login, the backend returns all active roles assigned to the employee. The sidebar exposes a role switcher when an employee has more than one role. Switching roles re-issues a JWT with the selected role and re-renders the UI accordingly.

---

## Scope

In-scope roles: `ADMIN`, `REQUESTOR_APPROVER`  
Out-of-scope: `MANAGEMENT`, `HR` (no pages built yet)

---

## Backend

### Removed Endpoints
- `POST /auth/login/admin`
- `POST /auth/login/technical-team`
- `POST /auth/login/requestor-approver`

### New Endpoints

#### `POST /auth/login`
- **Request:** `{ employeeId: string }`
- **Logic:**
  1. Validate the employee exists (via `IEmployeeRepository`)
  2. Fetch all roles assigned to the employee
  3. Filter to in-scope roles (`ADMIN`, `REQUESTOR_APPROVER`)
  4. Return 401 if no in-scope roles found
  5. Sort roles by priority: `ADMIN` > `REQUESTOR_APPROVER`
  6. Auto-select the highest-priority role as `activeRole`
  7. Issue JWT with `activeRole` embedded as `ClaimTypes.Role`
  8. Set `auth_token` HttpOnly cookie (8-hour expiry)
- **Response:** `AuthUserDTO` (see Data Shapes below)

#### `POST /auth/select-role`
- **Auth:** Required (reads `employeeId` from existing JWT)
- **Request:** `{ role: string }`
- **Logic:**
  1. Parse `employeeId` from JWT claims
  2. Validate the employee has the requested role
  3. Return 403 if not
  4. Issue new JWT with the selected role
  5. Re-set `auth_token` cookie
- **Response:** `AuthUserDTO`

#### `GET /auth/me` (unchanged endpoint, updated response)
- Fetches all roles for the employee and includes them in the response

### Data Shapes

**`AuthUserDTO`** (updated):
```csharp
public record AuthUserDTO(
    string EmployeeId,
    string ActiveRole,       // was: Role
    string[] Roles,          // new: all in-scope roles assigned
    string Name,
    int LocationId,
    string Location
);
```

### `AuthService` Changes
- Remove: `ValidateRoleAsync`, `GenerateTokenAsync` (or make private helpers)
- Add: `Task<AuthUserDTO> LoginAsync(string employeeId)`
- Add: `Task<AuthUserDTO> SelectRoleAsync(string employeeId, Roles role)`
- Update: `GetCurrentUserAsync` fetches all roles and populates `Roles[]`

---

## Frontend

### Removed Files
- `src/features/auth/pages/AdminLoginPage.tsx`
- `src/features/auth/pages/RequestorLoginPage.tsx`
- `src/features/auth/pages/TechTeamLoginPage.tsx`
- `src/shared/components/layout/RequestorLayout.tsx`
- `src/shared/components/layout/TechTeamLayout.tsx`

### New / Updated Files

#### `AuthUser` type (`src/shared/types/api/auth.ts`)
```ts
export interface AuthUser {
  employeeId: string;
  activeRole: string;   // was: role
  roles: string[];      // new
  name: string;
  locationId: number;
  location: string;
}
```

#### `authApi` (`src/features/auth/api.ts`)
```ts
export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthUser>("/auth/login", data).then(r => r.data),

  selectRole: (role: string) =>
    api.post<AuthUser>("/auth/select-role", { role }).then(r => r.data),

  me: () => api.get<AuthUser>("/auth/me").then(r => r.data),

  logout: () => api.post("/auth/logout").then(r => r.data),
};
```

#### `AuthContext` (`src/features/auth/AuthContext.tsx`)
- Add `selectRole(role: string): Promise<void>` to context value
- Implementation: calls `authApi.selectRole(role)`, updates `user` in state

#### `LoginPage` (`src/features/auth/pages/LoginPage.tsx`)
- Single employee ID form
- Calls `authApi.login({ employeeId })`
- On success: navigate to active role's home page
  - `ADMIN` → `/admin`
  - `REQUESTOR_APPROVER` → `/NAF`
- Route: `/login`

#### `AppLayout` (`src/shared/components/layout/AppLayout.tsx`)
- Replaces `RequestorLayout` and `TechTeamLayout`
- Derives `navItems` from `user.activeRole`:
  - `REQUESTOR_APPROVER`: `[{ label: "NAF Directory", href: "/NAF" }]`
  - `ADMIN`: `[Home, Users, NAFs, For Implementations, Resources]`
- Passes `navItems` and user info to `Sidebar`

#### `Sidebar` (`src/shared/components/layout/Sidebar.tsx`)
- New `roles` and `activeRole` props
- When `roles.length > 1`: render a role switcher section above the nav items
  - Labelled pills for each role (e.g. "Admin", "Requestor")
  - Active role pill is highlighted
  - Clicking a different pill calls `selectRole()` from context, then navigates to the new role's home page
- When `roles.length === 1`: no switcher rendered

#### `ProtectedRoute` (`src/features/auth/ProtectedRoute.tsx`)
- `user.role` → `user.activeRole`
- `loginPath` prop removed or always defaults to `/login`

#### `AppRouter` (`src/app/router.tsx`)
- Replace two login routes with single `<Route path="/login" element={<LoginPage />} />`
- All `ProtectedRoute` instances: `loginPath="/login"`
- Remove `TechTeamLoginPage` import and route

### Navigation After Role Switch

| Selected Role        | Redirect To  |
|----------------------|--------------|
| `ADMIN`              | `/admin`     |
| `REQUESTOR_APPROVER` | `/NAF`       |

---

## Role Priority (Auto-Select on Login)

When multiple roles exist, the backend selects the default in this order:

1. `ADMIN`
2. `REQUESTOR_APPROVER`

---

## Out of Scope

- `MANAGEMENT` and `HR` roles — no pages exist; these roles are ignored during login validation and not returned in the roles list
- Password/credential-based auth — employee ID only, unchanged
- Remember last selected role across sessions
