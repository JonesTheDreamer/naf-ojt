# Authentication Design

**Date:** 2026-04-09  
**Feature:** Role-based JWT authentication with httpOnly cookies

---

## Overview

Add authentication to the NAF system with three login-affecting roles: `ADMIN`, `TECHNICAL_TEAM`, and `REQUESTOR_APPROVER`. Each role has a dedicated login route and is redirected to its own dashboard with role-specific sidebar navigation and pages. JWT tokens are stored as httpOnly cookies. The frontend retrieves auth state via a `/api/auth/me` endpoint on app load.

---

## Roles

| Role | Login Route | Dashboard |
|---|---|---|
| `REQUESTOR_APPROVER` | `/login/requestor-approver` | `/NAF` |
| `ADMIN` | `/login/admin` | `/admin` |
| `TECHNICAL_TEAM` | `/login/technical-team` | `/technical-team` |

`TECHNICAL_HEAD` is a role in the system but does not affect authentication and has no dedicated login or dashboard.

---

## Backend

### JWT Configuration

Add to `appsettings.json`:
```json
"JwtSettings": {
  "Key": "<secret>",
  "Issuer": "NAFServer",
  "ExpireMinutes": 480
}
```

JWT claims: `NameIdentifier` = `employeeId` (string), `Role` = role enum value.

Cookie settings: httpOnly, SameSite=Lax, Secure in production, path `/`.

### Auth Endpoints — `AuthController` (`/api/auth`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login/admin` | Login for ADMIN role |
| `POST` | `/api/auth/login/technical-team` | Login for TECHNICAL_TEAM role |
| `POST` | `/api/auth/login/requestor-approver` | Login for REQUESTOR_APPROVER role |
| `GET` | `/api/auth/me` | Returns `{ employeeId, role, name }` — `employeeId` and `role` from JWT claims, `name` fetched from employee stored procedure (`sp_GetEmployeeDetails`) |
| `POST` | `/api/auth/logout` | Clears the auth cookie |

**Login request body:** `{ "employeeId": "string" }`

**Login flow:**
1. Receive `employeeId` and target role (inferred from endpoint)
2. Query `UserRoles` where `userId == employeeId && role == targetRole && date_removed == null`
3. If no match → `401 Unauthorized`
4. If match → generate JWT → set as httpOnly cookie → return `200 OK` with `{ employeeId, role }`

### Admin Endpoints — `AdminController` (`/api/admin`) — `[Authorize(Roles = "ADMIN")]`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/users` | All users with their active and inactive roles |
| `POST` | `/api/admin/users` | Add employee to system: `{ employeeId, role, location }` |
| `PATCH` | `/api/admin/users/{employeeId}/roles/{role}/remove` | Soft-delete a role (set `date_removed` to now) |
| `GET` | `/api/admin/locations` | List distinct locations from Users table |
| `POST` | `/api/admin/locations/assign` | Assign employee to location: `{ employeeId, location }` |

### Implementation Endpoints — updates to `ImplementationController`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/implementations/my-tasks` | `ResourceRequestImplementation` records for logged-in employee |
| `GET` | `/api/implementations/for-implementations` | `ResourceRequest` records in implementation-ready progress states |
| `POST` | `/api/implementations/{resourceRequestId}/assign` | Self-assign: creates `ResourceRequestImplementation` for logged-in employee |

### CurrentUserService Update

Change `UserId` (Guid) to `EmployeeId` (string) — reads `NameIdentifier` claim directly without `Guid.Parse`. This is used by all controllers that need the logged-in employee's identity.

### CORS Update

Add `.AllowCredentials()` to the `"Frontend"` CORS policy (required for cookies cross-origin). `AllowAnyOrigin` cannot be used with `AllowCredentials` — keep `WithOrigins("http://localhost:5173")`.

### Program.cs Updates

- Register JWT authentication middleware (`AddAuthentication`, `AddJwtBearer`)
- Call `app.UseAuthentication()` before `app.UseAuthorization()`
- Add `[Authorize]` to all existing controllers

---

## Frontend

### Auth Context

`src/features/auth/AuthContext.tsx` — React context providing:
```ts
{
  employeeId: string;
  role: "ADMIN" | "TECHNICAL_TEAM" | "REQUESTOR_APPROVER";
  name: string;
  isLoading: boolean;
}
```

On app load, calls `GET /api/auth/me`. If the call fails (no cookie / expired), user is treated as unauthenticated and redirected to the appropriate login page.

### Protected Routes

`ProtectedRoute` component wraps routes and checks:
1. If loading → show spinner
2. If unauthenticated → redirect to login page matching the route's required role
3. If wrong role → redirect to the user's own dashboard

### Route Structure

```
/login/admin                     → AdminLoginPage          (public)
/login/technical-team            → TechTeamLoginPage       (public)
/login/requestor-approver        → RequestorLoginPage      (public)

/NAF                             → ViewAllNAF              (REQUESTOR_APPROVER)
/NAF/:nafId                      → ViewNAFDetail           (REQUESTOR_APPROVER)

/admin                           → AdminHomePage           (ADMIN)
/admin/roles                     → RolesPage               (ADMIN)
/admin/locations                 → LocationsPage           (ADMIN)

/technical-team                  → TechTeamHomePage        (TECHNICAL_TEAM)
/technical-team/my-tasks         → MyTasksPage             (TECHNICAL_TEAM)
/technical-team/for-implementations → ForImplementationsPage (TECHNICAL_TEAM)
```

**Note:** `:employeeId` is removed from all NAF routes. Pages get `employeeId` from the auth context instead.

### Login Pages

Three minimal pages — each has an employee ID text input and a submit button. On submit, POST to the role-specific endpoint. On success, redirect to the role's dashboard. On failure, show an inline error message.

### Sidebars by Role

**REQUESTOR_APPROVER:** NAF Directory → `/NAF`

**ADMIN:** Home → `/admin`, Roles → `/admin/roles`, Locations → `/admin/locations`

**TECHNICAL_TEAM:** Home → `/technical-team`, My Tasks → `/technical-team/my-tasks`, For Implementations → `/technical-team/for-implementations`

---

## Page Functionality

### REQUESTOR_APPROVER — ViewAllNAF / ViewNAFDetail

No route changes other than removing `:employeeId` from the path. `employeeId` is sourced from auth context.

### ADMIN — Roles Page (`/admin/roles`)

- Table of all `Users` with their `UserRoles` (employee ID, fetched name, role, date added, date removed)
- Active roles and soft-deleted roles shown (inactive rows grayed out)
- **Add employee:** form with `employeeId` + role dropdown + location → `POST /api/admin/users`
- **Remove role:** button per active row → `PATCH /api/admin/users/{employeeId}/roles/{role}/remove` (sets `date_removed` to now, does not delete the record)

### ADMIN — Locations Page (`/admin/locations`)

- List of existing distinct locations from the Users table
- **Add new location:** text input creates a location entry
- **Assign employee to location:** pick employee by ID + pick location → `POST /api/admin/locations/assign`

### TECHNICAL_TEAM — My Tasks (`/technical-team/my-tasks`)

- Lists `ResourceRequestImplementation` records where `EmployeeId` = logged-in `employeeId`
- Displays: resource name, NAF info, progress status

### TECHNICAL_TEAM — For Implementations (`/technical-team/for-implementations`)

- Lists `ResourceRequest` records with `Progress == IMPLEMENTATION`
- Each row has an **"Assign to Me"** button → `POST /api/implementations/{resourceRequestId}/assign`
- Creates a `ResourceRequestImplementation` record linking the logged-in employee to the resource request

---

## File Structure (new files)

### Backend
```
NAFServer/src/
  API/Controllers/AuthController.cs
  API/Controllers/AdminController.cs
  Application/Interfaces/IAuthService.cs
  Application/Interfaces/IAdminService.cs
  Application/Services/AuthService.cs
  Application/Services/AdminService.cs
  Application/DTOs/Auth/LoginRequestDTO.cs
  Application/DTOs/Auth/AuthUserDTO.cs
  Application/DTOs/Admin/UserWithRolesDTO.cs
  Application/DTOs/Admin/AddUserDTO.cs
  Application/DTOs/Admin/AssignLocationDTO.cs
  Domain/Interface/Repository/IUserRepository.cs
  Infrastructure/Persistence/Repositories/UserRepository.cs
```

### Frontend
```
NAFClient/src/
  features/auth/
    AuthContext.tsx
    useAuth.ts
    ProtectedRoute.tsx
    pages/
      AdminLoginPage.tsx
      TechTeamLoginPage.tsx
      RequestorLoginPage.tsx
  features/admin/
    pages/
      AdminHomePage.tsx
      RolesPage.tsx
      LocationsPage.tsx
    hooks/
      useAdminUsers.ts
      useAdminLocations.ts
    services/ (or via EntityAPI)
  features/technical-team/
    pages/
      TechTeamHomePage.tsx
      MyTasksPage.tsx
      ForImplementationsPage.tsx
    hooks/
      useMyTasks.ts
      useForImplementations.ts
  components/layout/
    AdminLayout.tsx
    TechTeamLayout.tsx
    RequestorLayout.tsx
```
