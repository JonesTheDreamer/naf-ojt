# Unified Auth & Role Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace three separate login pages/endpoints with a single unified login that returns all active roles, and add a role switcher to the sidebar.

**Architecture:** A new `POST /auth/login` endpoint validates the employee, collects all active in-scope roles, issues a JWT with the highest-priority role, and returns the full role list. A new `POST /auth/select-role` endpoint re-issues the JWT with a different role. The frontend sidebar reads the role list from `AuthContext` and renders pill-style switcher buttons when the user has more than one role.

**Tech Stack:** ASP.NET Core 8, EF Core, JWT (HttpOnly cookie), React 19, TypeScript, React Router v6, TanStack Query, Tailwind CSS v4

---

## File Map

### Backend — Modified
- `NAFServer/src/Application/DTOs/Auth/AuthUserDTO.cs` — add `Roles[]`, rename `Role` → `ActiveRole`
- `NAFServer/src/Application/Interfaces/IAuthService.cs` — add `LoginAsync`, `SelectRoleAsync`; remove `ValidateRoleAsync`
- `NAFServer/src/Application/Services/AuthService.cs` — implement new methods, extract `BuildAuthUserDTOAsync` helper
- `NAFServer/src/API/Controllers/AuthController.cs` — replace 3 login endpoints with `login` + `select-role`

### Backend — Created
- `NAFServer/src/Application/DTOs/Auth/SelectRoleRequestDTO.cs`

### Frontend — Modified
- `NAFClient/src/shared/types/api/auth.ts` — rename `role` → `activeRole`, add `roles: string[]`
- `NAFClient/src/features/auth/api.ts` — single `login()`, add `selectRole()`, remove old login methods
- `NAFClient/src/features/auth/AuthContext.tsx` — add `selectRole` to context
- `NAFClient/src/features/auth/ProtectedRoute.tsx` — `user.role` → `user.activeRole`, hardcode loginPath `/login`
- `NAFClient/src/shared/components/layout/Sidebar.tsx` — add role switcher section
- `NAFClient/src/app/routesEnum.ts` — rename `LOGIN_REQUESTOR` → `LOGIN`, remove `LOGIN_ADMIN`/`LOGIN_TECH`
- `NAFClient/src/app/router.tsx` — single login route, all `loginPath` → `/login`

### Frontend — Created
- `NAFClient/src/features/auth/pages/LoginPage.tsx` — unified login page

### Frontend — Deleted
- `NAFClient/src/features/auth/pages/AdminLoginPage.tsx`
- `NAFClient/src/features/auth/pages/TechTeamLoginPage.tsx`
- `NAFClient/src/features/auth/pages/RequestorLoginPage.tsx`
- `NAFClient/src/shared/components/layout/TechTeamLayout.tsx`

---

## Task 1: Update `AuthUserDTO`

**Files:**
- Modify: `NAFServer/src/Application/DTOs/Auth/AuthUserDTO.cs`

- [ ] **Step 1: Replace the record definition**

```csharp
namespace NAFServer.src.Application.DTOs.Auth
{
    public record AuthUserDTO(
        string EmployeeId,
        string ActiveRole,
        string[] Roles,
        string Name,
        int LocationId,
        string Location
    );
}
```

- [ ] **Step 2: Build to confirm no compile errors**

Run from `NAFServer/`:
```
dotnet build
```
Expected: `Build succeeded.`

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/Application/DTOs/Auth/AuthUserDTO.cs
git commit -m "feat(auth): add Roles[] and rename Role to ActiveRole in AuthUserDTO"
```

---

## Task 2: Create `SelectRoleRequestDTO`

**Files:**
- Create: `NAFServer/src/Application/DTOs/Auth/SelectRoleRequestDTO.cs`

- [ ] **Step 1: Create the file**

```csharp
namespace NAFServer.src.Application.DTOs.Auth
{
    public record SelectRoleRequestDTO(string Role);
}
```

- [ ] **Step 2: Build**

```
dotnet build
```
Expected: `Build succeeded.`

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/Application/DTOs/Auth/SelectRoleRequestDTO.cs
git commit -m "feat(auth): add SelectRoleRequestDTO"
```

---

## Task 3: Update `IAuthService`

**Files:**
- Modify: `NAFServer/src/Application/Interfaces/IAuthService.cs`

- [ ] **Step 1: Replace the interface**

```csharp
using NAFServer.src.Application.DTOs.Auth;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthUserDTO> LoginAsync(string employeeId);
        Task<AuthUserDTO> SelectRoleAsync(string employeeId, Roles role);
        Task<string> GenerateTokenAsync(string employeeId, Roles role);
        Task<AuthUserDTO> GetCurrentUserAsync(string employeeId, string role);
    }
}
```

- [ ] **Step 2: Build** (will fail — AuthService not updated yet; that's expected)

```
dotnet build
```
Expected: errors about `AuthService` not implementing `LoginAsync` / `SelectRoleAsync`. That is fine — proceed to Task 4.

---

## Task 4: Update `AuthService`

**Files:**
- Modify: `NAFServer/src/Application/Services/AuthService.cs`

- [ ] **Step 1: Replace the full file**

```csharp
using Microsoft.IdentityModel.Tokens;
using NAFServer.src.Application.DTOs.Auth;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace NAFServer.src.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IConfiguration _config;
        private readonly IUserRepository _userRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly IUserLocationRepository _userLocationRepository;

        private static readonly Roles[] InScopeRoles = [Roles.ADMIN, Roles.REQUESTOR_APPROVER];

        public AuthService(
            IConfiguration config,
            IUserRepository userRepository,
            IEmployeeRepository employeeRepository,
            IUserRoleRepository userRoleRepository,
            IRoleRepository roleRepository,
            IUserLocationRepository userLocationRepository)
        {
            _config = config;
            _userRepository = userRepository;
            _employeeRepository = employeeRepository;
            _userRoleRepository = userRoleRepository;
            _roleRepository = roleRepository;
            _userLocationRepository = userLocationRepository;
        }

        public async Task<AuthUserDTO> LoginAsync(string employeeId)
        {
            var user = await _userRepository.GetUserByEmployeeId(employeeId);

            List<UserRole> userRoles;
            try
            {
                userRoles = await _userRoleRepository.GetUserActiveRolesAsync(user.Id);
            }
            catch (KeyNotFoundException)
            {
                throw new UnauthorizedAccessException("No active roles assigned.");
            }

            var roles = userRoles
                .Where(ur => InScopeRoles.Contains(ur.Role.Name))
                .OrderBy(ur => Array.IndexOf(InScopeRoles, ur.Role.Name))
                .Select(ur => ur.Role.Name)
                .ToList();

            if (roles.Count == 0)
                throw new UnauthorizedAccessException("No in-scope roles assigned.");

            return await BuildAuthUserDTOAsync(employeeId, user, roles.First().ToString(), roles);
        }

        public async Task<AuthUserDTO> SelectRoleAsync(string employeeId, Roles role)
        {
            var user = await _userRepository.GetUserByEmployeeId(employeeId);
            var roleEntity = await _roleRepository.GetByNameAsync(role)
                ?? throw new KeyNotFoundException($"Role {role} not found.");

            var hasRole = await _userRoleRepository.UserHasRoleAsync(user.Id, roleEntity.Id);
            if (!hasRole)
                throw new UnauthorizedAccessException($"User does not have role {role}.");

            List<UserRole> userRoles;
            try
            {
                userRoles = await _userRoleRepository.GetUserActiveRolesAsync(user.Id);
            }
            catch (KeyNotFoundException)
            {
                userRoles = [];
            }

            var roles = userRoles
                .Where(ur => InScopeRoles.Contains(ur.Role.Name))
                .OrderBy(ur => Array.IndexOf(InScopeRoles, ur.Role.Name))
                .Select(ur => ur.Role.Name)
                .ToList();

            return await BuildAuthUserDTOAsync(employeeId, user, role.ToString(), roles);
        }

        public async Task<AuthUserDTO> GetCurrentUserAsync(string employeeId, string role)
        {
            var user = await _userRepository.GetUserByEmployeeId(employeeId);

            List<UserRole> userRoles;
            try
            {
                userRoles = await _userRoleRepository.GetUserActiveRolesAsync(user.Id);
            }
            catch (KeyNotFoundException)
            {
                userRoles = [];
            }

            var roles = userRoles
                .Where(ur => InScopeRoles.Contains(ur.Role.Name))
                .OrderBy(ur => Array.IndexOf(InScopeRoles, ur.Role.Name))
                .Select(ur => ur.Role.Name)
                .ToList();

            return await BuildAuthUserDTOAsync(employeeId, user, role, roles);
        }

        public Task<string> GenerateTokenAsync(string employeeId, Roles role)
        {
            var jwtSettings = _config.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expireMinutes = int.Parse(jwtSettings["ExpireMinutes"]!);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, employeeId),
                new Claim(ClaimTypes.Role, role.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expireMinutes),
                signingCredentials: creds
            );

            return Task.FromResult(new JwtSecurityTokenHandler().WriteToken(token));
        }

        private async Task<AuthUserDTO> BuildAuthUserDTOAsync(
            string employeeId,
            User user,
            string activeRole,
            List<Roles> roles)
        {
            var employee = await _employeeRepository.GetByIdAsync(employeeId)
                ?? throw new ApplicationException($"Employee record not found for '{employeeId}'. Contact your administrator.");

            int locationId = 0;
            string location = "";
            try
            {
                var userLocation = await _userLocationRepository.GetUserActiveLocation(user.Id);
                locationId = userLocation.LocationId;
                location = userLocation.Location?.Name ?? "";
            }
            catch (KeyNotFoundException) { }

            return new AuthUserDTO(
                employeeId,
                activeRole,
                roles.Select(r => r.ToString()).ToArray(),
                $"{employee.FirstName} {employee.LastName}",
                locationId,
                location
            );
        }
    }
}
```

- [ ] **Step 2: Build**

```
dotnet build
```
Expected: `Build succeeded.`

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/Application/Interfaces/IAuthService.cs NAFServer/src/Application/Services/AuthService.cs
git commit -m "feat(auth): implement LoginAsync and SelectRoleAsync in AuthService"
```

---

## Task 5: Update `AuthController`

**Files:**
- Modify: `NAFServer/src/API/Controllers/AuthController.cs`

- [ ] **Step 1: Replace the full file**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.Auth;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.API.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ICurrentUserService _currentUserService;

        public AuthController(IAuthService authService, ICurrentUserService currentUserService)
        {
            _authService = authService;
            _currentUserService = currentUserService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDTO request)
        {
            try
            {
                var dto = await _authService.LoginAsync(request.EmployeeId);
                var activeRole = Enum.Parse<Roles>(dto.ActiveRole);
                var token = await _authService.GenerateTokenAsync(request.EmployeeId, activeRole);
                SetAuthCookie(token);
                return Ok(dto);
            }
            catch (KeyNotFoundException)
            {
                return Unauthorized("Invalid employee ID.");
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
        }

        [HttpPost("select-role")]
        [Authorize]
        public async Task<IActionResult> SelectRole([FromBody] SelectRoleRequestDTO request)
        {
            if (!Enum.TryParse<Roles>(request.Role, out var role))
                return BadRequest("Invalid role.");

            try
            {
                var dto = await _authService.SelectRoleAsync(_currentUserService.EmployeeId, role);
                var token = await _authService.GenerateTokenAsync(_currentUserService.EmployeeId, role);
                SetAuthCookie(token);
                return Ok(dto);
            }
            catch (KeyNotFoundException)
            {
                return Unauthorized("Invalid employee ID.");
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var user = await _authService.GetCurrentUserAsync(
                _currentUserService.EmployeeId,
                _currentUserService.Role);
            return Ok(user);
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("auth_token");
            return Ok();
        }

        private void SetAuthCookie(string token)
        {
            Response.Cookies.Append("auth_token", token, new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddHours(8),
                Path = "/"
            });
        }
    }
}
```

- [ ] **Step 2: Build**

```
dotnet build
```
Expected: `Build succeeded.`

- [ ] **Step 3: Start the API and verify the login endpoint manually**

Run from `NAFServer/`:
```
dotnet run
```

In a separate terminal, POST to the login endpoint with a known employee ID that has at least one in-scope role:
```
curl -s -X POST http://localhost:5186/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"employeeId\": \"<YOUR_TEST_EMPLOYEE_ID>\"}" \
  -c cookies.txt | python -m json.tool
```

Expected response shape:
```json
{
  "employeeId": "...",
  "activeRole": "ADMIN",
  "roles": ["ADMIN", "REQUESTOR_APPROVER"],
  "name": "...",
  "locationId": 1,
  "location": "..."
}
```

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/API/Controllers/AuthController.cs
git commit -m "feat(auth): replace role-specific login endpoints with unified login and select-role"
```

---

## Task 6: Update Frontend Auth Types and API

**Files:**
- Modify: `NAFClient/src/shared/types/api/auth.ts`
- Modify: `NAFClient/src/features/auth/api.ts`

- [ ] **Step 1: Update `auth.ts`**

```typescript
export interface AuthUser {
  employeeId: string;
  activeRole: string;
  roles: string[];
  name: string;
  locationId: number;
  location: string;
}

export interface LoginRequest {
  employeeId: string;
}
```

- [ ] **Step 2: Update `api.ts`**

```typescript
import { api } from "@/shared/api/client";
import type { AuthUser, LoginRequest } from "@/shared/types/api/auth";

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthUser>("/auth/login", data).then((r) => r.data),

  selectRole: (role: string) =>
    api.post<AuthUser>("/auth/select-role", { role }).then((r) => r.data),

  me: () => api.get<AuthUser>("/auth/me").then((r) => r.data),

  logout: () => api.post("/auth/logout").then((r) => r.data),
};
```

- [ ] **Step 3: Build to surface all type errors from the `role` → `activeRole` rename**

Run from `NAFClient/`:
```
npm run build
```
Expected: TypeScript errors on every file that reads `user.role`. Note them — they'll be fixed in subsequent tasks.

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/shared/types/api/auth.ts NAFClient/src/features/auth/api.ts
git commit -m "feat(auth): update AuthUser type and authApi for unified login"
```

---

## Task 7: Update `AuthContext`

**Files:**
- Modify: `NAFClient/src/features/auth/AuthContext.tsx`

- [ ] **Step 1: Replace the full file**

```typescript
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "@/shared/types/api/auth";
import { authApi } from "./api";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  selectRole: (role: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const selectRole = async (role: string): Promise<AuthUser> => {
    const updated = await authApi.selectRole(role);
    setUser(updated);
    return updated;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, selectRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

- [ ] **Step 2: Build**

```
npm run build
```
Expected: still shows errors on files that use `user.role` — those get fixed in Tasks 8–11.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/auth/AuthContext.tsx
git commit -m "feat(auth): add selectRole to AuthContext"
```

---

## Task 8: Create Unified `LoginPage`

**Files:**
- Create: `NAFClient/src/features/auth/pages/LoginPage.tsx`

- [ ] **Step 1: Create the file**

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { authApi } from "../api";
import { useAuth } from "../AuthContext";

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  REQUESTOR_APPROVER: "/NAF",
};

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const user = await authApi.login({ employeeId });
      setUser(user);
      navigate(ROLE_HOME[user.activeRole] ?? "/NAF");
    } catch {
      setError("Invalid employee ID or no roles assigned.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Enter your employee ID"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add NAFClient/src/features/auth/pages/LoginPage.tsx
git commit -m "feat(auth): add unified LoginPage"
```

---

## Task 9: Update `ProtectedRoute`

**Files:**
- Modify: `NAFClient/src/features/auth/ProtectedRoute.tsx`

- [ ] **Step 1: Replace the full file**

`loginPath` prop is removed — all unauthenticated users go to `/login`.

```typescript
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user || user.activeRole !== requiredRole) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
```

- [ ] **Step 2: Commit**

```bash
git add NAFClient/src/features/auth/ProtectedRoute.tsx
git commit -m "feat(auth): update ProtectedRoute to use activeRole and single login path"
```

---

## Task 10: Add Role Switcher to `Sidebar`

**Files:**
- Modify: `NAFClient/src/shared/components/layout/Sidebar.tsx`

- [ ] **Step 1: Replace the full file**

The sidebar reads `user.roles` and `user.activeRole` directly from `useAuth`. When the user has more than one role, a pill-style switcher appears above the navigation items.

```typescript
import { LogOut, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/shared/utils/utils";
import { useAuth } from "@/features/auth/AuthContext";

export interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface SidebarProps {
  isOpen?: boolean;
  currentUser?: {
    name: string;
  };
  navItems: NavItem[];
  onLogout?: () => void;
}

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  REQUESTOR_APPROVER: "/NAF",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  REQUESTOR_APPROVER: "Requestor",
};

export default function Sidebar({
  isOpen = true,
  currentUser = { name: "User" },
  navItems,
  onLogout,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, selectRole } = useAuth();

  const handleRoleSwitch = async (role: string) => {
    if (role === user?.activeRole) return;
    await selectRole(role);
    navigate(ROLE_HOME[role] ?? "/NAF");
  };

  return (
    <aside
      className={cn(
        "fixed top-14 left-0 bottom-0 z-40 flex flex-col w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out",
        !isOpen && "-translate-x-full",
      )}
    >
      {/* Role switcher — shown only when user has multiple roles */}
      {user && user.roles.length > 1 && (
        <div className="px-4 py-3 border-b border-gray-200">
          <p className="text-xs text-gray-400 mb-2">Role</p>
          <div className="flex flex-wrap gap-1.5">
            {user.roles.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleSwitch(role)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  role === user.activeRole
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
              >
                {ROLE_LABELS[role] ?? role}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0",
                      isActive ? "text-gray-700" : "text-gray-400",
                    )}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section at the bottom */}
      <div className="border-t border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-400 leading-tight">Hello</p>
            <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
              {currentUser.name}
            </p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="shrink-0 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add NAFClient/src/shared/components/layout/Sidebar.tsx
git commit -m "feat(auth): add role switcher to Sidebar"
```

---

## Task 11: Update `AppRouter` and `routesEnum`

**Files:**
- Modify: `NAFClient/src/app/routesEnum.ts`
- Modify: `NAFClient/src/app/router.tsx`

- [ ] **Step 1: Update `routesEnum.ts`**

```typescript
export enum RoutesEnum {
  // Login
  LOGIN = "/login",

  // Requestor/Approver routes
  NAF = "/NAF",

  // Admin routes
  ADMIN = "/admin",
  ADMIN_FOR_IMPLEMENTATIONS = "/admin/for-implementations",
  ADMIN_NAF = "/admin/NAF",
  ADMIN_NAF_DETAIL = "/admin/NAF/:nafId",
  ADMIN_IMPLEMENTATION_DETAIL = "/admin/for-implementations/:nafId",
  ADMIN_USERS = "/admin/users",
  ADMIN_USER_DETAIL = "/admin/users/:userId",
  ADMIN_RESOURCES = "/admin/resources",
  ADMIN_RESOURCE_DETAIL = "/admin/resources/:resourceId",
}
```

- [ ] **Step 2: Update `router.tsx`**

Replace the full file. `ProtectedRoute` no longer takes a `loginPath` prop — all routes go to `/login`:

```typescript
import { Routes, Route, Navigate } from "react-router-dom";
import { RoutesEnum } from "./routesEnum";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";

const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const ViewAllNAF = lazy(() => import("@/features/naf/pages/ViewAllNAF"));
const NAFDetailPage = lazy(() => import("@/features/naf/pages/ViewNAFDetail"));

const AdminHomePage = lazy(() => import("@/features/admin/pages/AdminHomePage"));
const UsersPage = lazy(() => import("@/features/admin/pages/UsersPage"));
const UserDetailPage = lazy(() => import("@/features/admin/pages/UserDetailPage"));
const AdminNAFListPage = lazy(() => import("@/features/admin/pages/AdminNAFListPage"));
const AdminNAFDetailPage = lazy(() => import("@/features/admin/pages/AdminNAFDetailPage"));
const ForImplementationsPage = lazy(() => import("@/features/admin/pages/ForImplementationsPage"));
const AdminImplementationDetailPage = lazy(
  () => import("@/features/admin/pages/AdminImplementationDetailPage"),
);
const ResourceListPage = lazy(
  () => import("@/features/resource-management/pages/ResourceListPage"),
);
const ResourceDetailPage = lazy(
  () => import("@/features/resource-management/pages/ResourceDetailPage"),
);

export function AppRouter() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* Login */}
        <Route path={RoutesEnum.LOGIN} element={<LoginPage />} />

        {/* Requestor/Approver routes */}
        <Route
          path={RoutesEnum.NAF}
          element={
            <ProtectedRoute requiredRole="REQUESTOR_APPROVER">
              <ViewAllNAF />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${RoutesEnum.NAF}/:nafId`}
          element={
            <ProtectedRoute requiredRole="REQUESTOR_APPROVER">
              <NAFDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path={RoutesEnum.ADMIN}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_NAF}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminNAFListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_NAF_DETAIL}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminNAFDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_FOR_IMPLEMENTATIONS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ForImplementationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_IMPLEMENTATION_DETAIL}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminImplementationDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_USERS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_USER_DETAIL}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <UserDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_RESOURCES}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ResourceListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_RESOURCE_DETAIL}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ResourceDetailPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to={RoutesEnum.LOGIN} replace />} />
      </Routes>
    </Suspense>
  );
}
```

- [ ] **Step 3: Build**

```
npm run build
```
Expected: `Build succeeded` with 0 errors. If there are remaining `user.role` references, grep for them:
```
grep -r "user\.role" NAFClient/src --include="*.tsx" --include="*.ts"
```
Fix any that appear by changing `user.role` → `user.activeRole`.

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/app/routesEnum.ts NAFClient/src/app/router.tsx
git commit -m "feat(auth): unify login route and remove role-specific login paths"
```

---

## Task 12: Delete Old Files

**Files to delete:**
- `NAFClient/src/features/auth/pages/AdminLoginPage.tsx`
- `NAFClient/src/features/auth/pages/RequestorLoginPage.tsx`
- `NAFClient/src/features/auth/pages/TechTeamLoginPage.tsx`
- `NAFClient/src/shared/components/layout/TechTeamLayout.tsx`

- [ ] **Step 1: Delete the files**

```bash
rm NAFClient/src/features/auth/pages/AdminLoginPage.tsx
rm NAFClient/src/features/auth/pages/RequestorLoginPage.tsx
rm NAFClient/src/features/auth/pages/TechTeamLoginPage.tsx
rm NAFClient/src/shared/components/layout/TechTeamLayout.tsx
```

- [ ] **Step 2: Build to confirm nothing imports them**

```
npm run build
```
Expected: `Build succeeded` with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(auth): remove old role-specific login pages and TechTeamLayout"
```

---

## Task 13: End-to-End Verification

- [ ] **Step 1: Start both servers**

Terminal 1 — backend:
```
cd NAFServer && dotnet run
```

Terminal 2 — frontend:
```
cd NAFClient && npm run dev
```

- [ ] **Step 2: Test single-role login**

Navigate to `http://localhost:5173`. Confirm you are redirected to `/login`.

Log in with an employee ID that has **only `REQUESTOR_APPROVER`**. Confirm:
- Redirected to `/NAF`
- Sidebar shows no role switcher (only one role)
- Logout works, redirects back to `/login`

- [ ] **Step 3: Test multi-role login**

Log in with an employee ID that has **both `ADMIN` and `REQUESTOR_APPROVER`**. Confirm:
- Redirected to `/admin` (ADMIN is the higher-priority role)
- Sidebar shows role switcher with two pills: "Admin" (active/dark) and "Requestor" (inactive)

- [ ] **Step 4: Test role switching**

While logged in with both roles, click the "Requestor" pill in the sidebar. Confirm:
- Redirected to `/NAF`
- Sidebar now shows "Requestor" as the active (dark) pill and "Admin" as inactive
- Only the NAF nav item is visible (requestor nav, not admin nav)
- Clicking "Admin" pill returns to `/admin` with admin nav restored

- [ ] **Step 5: Test direct URL access enforcement**

While the active role is `REQUESTOR_APPROVER`, navigate directly to `/admin`. Confirm you are redirected to `/login`.

- [ ] **Step 6: Test page refresh**

While logged in with an active role, refresh the page. Confirm the session is restored (the `GET /auth/me` call returns the correct `activeRole` and `roles`).
