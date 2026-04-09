# Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add role-based JWT authentication (ADMIN, TECHNICAL_TEAM, REQUESTOR_APPROVER) with httpOnly cookies, role-specific dashboards, and supporting admin/tech-team pages.

**Architecture:** Backend issues JWTs stored as httpOnly cookies; frontend calls `/api/auth/me` on load to hydrate an `AuthContext`. `ProtectedRoute` components guard all non-login routes by role. Each role gets its own layout and sidebar.

**Tech Stack:** ASP.NET Core 8 (JwtBearer 8.0.0), React 19, React Router, Axios (withCredentials), TanStack Query

---

## File Map

### Backend — New
- `NAFServer/src/Application/DTOs/Auth/LoginRequestDTO.cs`
- `NAFServer/src/Application/DTOs/Auth/AuthUserDTO.cs`
- `NAFServer/src/Application/DTOs/Admin/UserRoleDTO.cs`
- `NAFServer/src/Application/DTOs/Admin/UserWithRolesDTO.cs`
- `NAFServer/src/Application/DTOs/Admin/AddUserDTO.cs`
- `NAFServer/src/Application/DTOs/Admin/AssignLocationDTO.cs`
- `NAFServer/src/Application/Interfaces/IAuthService.cs`
- `NAFServer/src/Application/Interfaces/IAdminService.cs`
- `NAFServer/src/Application/Services/AuthService.cs`
- `NAFServer/src/Application/Services/AdminService.cs`
- `NAFServer/src/Domain/Interface/Repository/IUserRepository.cs`
- `NAFServer/src/Infrastructure/Persistence/Repositories/UserRepository.cs`
- `NAFServer/src/API/Controllers/AuthController.cs`
- `NAFServer/src/API/Controllers/AdminController.cs`
- `NAFServer/src/API/Controllers/ImplementationController.cs`

### Backend — Modified
- `NAFServer/NAFServer.csproj` — add JwtBearer package
- `NAFServer/appsettings.json` — add JwtSettings
- `NAFServer/Program.cs` — JWT auth, CORS credentials, new DI registrations, `UseAuthentication()`
- `NAFServer/src/Application/Interfaces/ICurrentUserService.cs` — replace `Guid UserId` with `string EmployeeId`
- `NAFServer/src/Application/Services/CurrentUserService.cs` — implement `EmployeeId`
- `NAFServer/src/Domain/Interface/Repository/IImplementationRepository.cs` — add new query methods
- `NAFServer/src/Infrastructure/Persistence/Repositories/ImplementationRepository.cs` — implement new methods
- `NAFServer/src/Application/Interfaces/IImplementationService.cs` — add 3 new methods
- `NAFServer/src/Application/Services/ImplementationService.cs` — implement new methods
- All existing controllers — add `[Authorize]`

### Frontend — New
- `NAFClient/src/types/api/auth.ts`
- `NAFClient/src/services/EntityAPI/authService.ts`
- `NAFClient/src/services/EntityAPI/adminService.ts`
- `NAFClient/src/services/EntityAPI/implementationService.ts`
- `NAFClient/src/features/auth/AuthContext.tsx`
- `NAFClient/src/features/auth/useAuth.ts`
- `NAFClient/src/features/auth/ProtectedRoute.tsx`
- `NAFClient/src/features/auth/pages/AdminLoginPage.tsx`
- `NAFClient/src/features/auth/pages/TechTeamLoginPage.tsx`
- `NAFClient/src/features/auth/pages/RequestorLoginPage.tsx`
- `NAFClient/src/features/admin/pages/AdminHomePage.tsx`
- `NAFClient/src/features/admin/pages/RolesPage.tsx`
- `NAFClient/src/features/admin/pages/LocationsPage.tsx`
- `NAFClient/src/features/admin/hooks/useAdminUsers.ts`
- `NAFClient/src/features/admin/hooks/useAdminLocations.ts`
- `NAFClient/src/features/technical-team/pages/TechTeamHomePage.tsx`
- `NAFClient/src/features/technical-team/pages/MyTasksPage.tsx`
- `NAFClient/src/features/technical-team/pages/ForImplementationsPage.tsx`
- `NAFClient/src/features/technical-team/hooks/useMyTasks.ts`
- `NAFClient/src/features/technical-team/hooks/useForImplementations.ts`
- `NAFClient/src/components/layout/AdminLayout.tsx`
- `NAFClient/src/components/layout/TechTeamLayout.tsx`
- `NAFClient/src/components/layout/RequestorLayout.tsx`

### Frontend — Modified
- `NAFClient/src/services/api.tsx` — add `withCredentials: true`
- `NAFClient/src/components/layout/Sidebar.tsx` — accept `navItems` as prop
- `NAFClient/src/components/layout/Layout.tsx` — accept `navItems` prop, pass to Sidebar
- `NAFClient/src/app/routesEnum.ts` — add new route constants
- `NAFClient/src/app/router.tsx` — new routes, ProtectedRoute wrappers, remove `:employeeId`
- `NAFClient/src/main.tsx` — wrap App in `AuthProvider`
- `NAFClient/src/features/naf/pages/ViewAllNAF.tsx` — use auth context instead of `useParams`
- `NAFClient/src/features/naf/pages/ViewNAFDetail.tsx` — use auth context instead of `useParams`

---

## Task 1: Add JwtBearer NuGet package

**Files:**
- Modify: `NAFServer/NAFServer.csproj`

- [ ] **Step 1: Install JwtBearer**

Run inside `NAFServer/`:
```bash
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.0.0
```
Expected output: `PackageReference` for `Microsoft.AspNetCore.Authentication.JwtBearer Version="8.0.0"` added.

- [ ] **Step 2: Verify build still passes**

```bash
dotnet build NAFServer/NAFServer.csproj
```
Expected: `Build succeeded. 0 Warning(s) 0 Error(s)`

- [ ] **Step 3: Commit**

```bash
git add NAFServer/NAFServer.csproj
git commit -m "chore: add JwtBearer package"
```

---

## Task 2: Add JwtSettings to appsettings.json

**Files:**
- Modify: `NAFServer/appsettings.json`

- [ ] **Step 1: Add JWT config block**

In `NAFServer/appsettings.json`, add after the `ConnectionStrings` block:
```json
{
  "Logging": { ... },
  "ConnectionStrings": { ... },
  "JwtSettings": {
    "Key": "naf-ojt-super-secret-key-minimum-32-chars-long!",
    "Issuer": "NAFServer",
    "ExpireMinutes": 480
  },
  "AllowedHosts": "*"
}
```

- [ ] **Step 2: Commit**

```bash
git add NAFServer/appsettings.json
git commit -m "chore: add JwtSettings to appsettings"
```

---

## Task 3: Update ICurrentUserService and CurrentUserService

**Files:**
- Modify: `NAFServer/src/Application/Interfaces/ICurrentUserService.cs`
- Modify: `NAFServer/src/Application/Services/CurrentUserService.cs`

- [ ] **Step 1: Update interface**

Replace entire `NAFServer/src/Application/Interfaces/ICurrentUserService.cs`:
```csharp
namespace NAFServer.src.Application.Interfaces
{
    public interface ICurrentUserService
    {
        string EmployeeId { get; }
        bool IsAuthenticated { get; }
    }
}
```

- [ ] **Step 2: Update implementation**

Replace entire `NAFServer/src/Application/Services/CurrentUserService.cs`:
```csharp
namespace NAFServer.src.Application.Services
{
    using NAFServer.src.Application.Interfaces;
    using System.Security.Claims;

    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public string EmployeeId
        {
            get
            {
                var user = _httpContextAccessor.HttpContext?.User;
                if (user == null || !user.Identity!.IsAuthenticated)
                    throw new UnauthorizedAccessException("User is not authenticated.");
                var id = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (id == null)
                    throw new UnauthorizedAccessException("Employee ID claim not found.");
                return id;
            }
        }

        public bool IsAuthenticated =>
            _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
    }
}
```

- [ ] **Step 3: Build to verify no compile errors**

```bash
dotnet build NAFServer/NAFServer.csproj
```
Expected: `Build succeeded.`

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Application/Interfaces/ICurrentUserService.cs NAFServer/src/Application/Services/CurrentUserService.cs
git commit -m "refactor: change CurrentUserService UserId (Guid) to EmployeeId (string)"
```

---

## Task 4: Configure JWT authentication and CORS in Program.cs

**Files:**
- Modify: `NAFServer/Program.cs`

- [ ] **Step 1: Add JWT auth + update CORS + fix middleware order**

Replace `NAFServer/Program.cs` with:
```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NAFServer.src.Application.Handlers.Interface;
using NAFServer.src.Application.Handlers.ResourceRequestHandler;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Application.Services;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;
using NAFServer.src.Infrastructure.Persistence;
using NAFServer.src.Infrastructure.Persistence.Repositories;
using NAFServer.src.Infrastructure.Persistence.Seeder;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend",
        policy => policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHttpContextAccessor();

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            context.Token = context.Request.Cookies["auth_token"];
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddScoped<IResourceRequestService, ResourceRequestService>();
builder.Services.AddScoped<INAFService, NAFService>();
builder.Services.AddScoped<IResourceRequestApprovalStepService, ResourceRequestApprovalStepService>();
builder.Services.AddScoped<IResourceRequestStepRepository, ResourceRequestStepRepository>();
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<INAFRepository, NAFRepository>();
builder.Services.AddScoped<IApprovalWorkflowTemplateRepository, ApprovalWorkflowTemplateRepository>();
builder.Services.AddScoped<IApprovalWorkflowStepsTemplateRepository, ApprovalWorkflowStepsTemplateRepository>();
builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();
builder.Services.AddScoped<IResourceRequestStepHistoryRepository, ResourceRequestStepHistoryRepository>();
builder.Services.AddScoped<IResourceRequestRepository, ResourceRequestRepository>();
builder.Services.AddScoped<IResourceRequestHandler, InternetRequestHandler>();
builder.Services.AddScoped<IResourceRequestHandler, SharedFolderRequestHandler>();
builder.Services.AddScoped<IResourceRequestHandler, GroupEmailRequestHandler>();
builder.Services.AddScoped<IResourceRepository, ResourceRepository>();
builder.Services.AddScoped<IInternetResourceRepository, InternetResourceRepository>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IResourceService, ResourceService>();
builder.Services.AddScoped<IInternetPurposeRepository, InternetPurposeRepository>();
builder.Services.AddScoped<IGroupEmailRepository, GroupEmailRepository>();
builder.Services.AddScoped<ISharedFolderRepository, SharedFolderRepository>();
builder.Services.AddScoped<IInternetPurposeService, InternetPurposeService>();
builder.Services.AddScoped<IInternetResourceService, InternetResourceService>();
builder.Services.AddScoped<IGroupEmailService, GroupEmailService>();
builder.Services.AddScoped<ISharedFolderService, SharedFolderService>();
builder.Services.AddScoped<IResourceRequestHandlerRegistry, ResourceRequestHandlerRegistry>();
builder.Services.AddScoped<IImplementationRepository, ImplementationRepository>();
builder.Services.AddScoped<IImplementationService, ImplementationService>();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<CacheService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// Auth + Admin (registered in later tasks — add here when created)
// builder.Services.AddScoped<IUserRepository, UserRepository>();
// builder.Services.AddScoped<IAuthService, AuthService>();
// builder.Services.AddScoped<IAdminService, AdminService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await EmployeeDepartmentSeeder.SeedAsync(context);
    await ResourceWorkflowSeeder.SeedAsync(context);
    await SharedFolderSeeder.SeedAsync(context);
    await InternetResourceSeeder.SeedAsync(context);
    await UserSeeder.SeedAsync(context);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

- [ ] **Step 2: Build**

```bash
dotnet build NAFServer/NAFServer.csproj
```
Expected: `Build succeeded.`

- [ ] **Step 3: Commit**

```bash
git add NAFServer/Program.cs
git commit -m "feat: configure JWT authentication and CORS credentials in Program.cs"
```

---

## Task 5: Create Auth and Admin DTOs

**Files:**
- Create: `NAFServer/src/Application/DTOs/Auth/LoginRequestDTO.cs`
- Create: `NAFServer/src/Application/DTOs/Auth/AuthUserDTO.cs`
- Create: `NAFServer/src/Application/DTOs/Admin/UserRoleDTO.cs`
- Create: `NAFServer/src/Application/DTOs/Admin/UserWithRolesDTO.cs`
- Create: `NAFServer/src/Application/DTOs/Admin/AddUserDTO.cs`
- Create: `NAFServer/src/Application/DTOs/Admin/AssignLocationDTO.cs`

- [ ] **Step 1: Create LoginRequestDTO**

`NAFServer/src/Application/DTOs/Auth/LoginRequestDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.Auth
{
    public record LoginRequestDTO(string EmployeeId);
}
```

- [ ] **Step 2: Create AuthUserDTO**

`NAFServer/src/Application/DTOs/Auth/AuthUserDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.Auth
{
    public record AuthUserDTO(string EmployeeId, string Role, string Name);
}
```

- [ ] **Step 3: Create UserRoleDTO**

`NAFServer/src/Application/DTOs/Admin/UserRoleDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.Admin
{
    public record UserRoleDTO(int Id, string EmployeeId, string Role, DateTime DateAdded, DateTime? DateRemoved);
}
```

- [ ] **Step 4: Create UserWithRolesDTO**

`NAFServer/src/Application/DTOs/Admin/UserWithRolesDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.Admin
{
    public record UserWithRolesDTO(string EmployeeId, string Location, List<UserRoleDTO> Roles);
}
```

- [ ] **Step 5: Create AddUserDTO**

`NAFServer/src/Application/DTOs/Admin/AddUserDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.Admin
{
    public record AddUserDTO(string EmployeeId, string Role, string Location);
}
```

- [ ] **Step 6: Create AssignLocationDTO**

`NAFServer/src/Application/DTOs/Admin/AssignLocationDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.Admin
{
    public record AssignLocationDTO(string EmployeeId, string Location);
}
```

- [ ] **Step 7: Build**

```bash
dotnet build NAFServer/NAFServer.csproj
```
Expected: `Build succeeded.`

- [ ] **Step 8: Commit**

```bash
git add NAFServer/src/Application/DTOs/Auth/ NAFServer/src/Application/DTOs/Admin/
git commit -m "feat: add Auth and Admin DTOs"
```

---

## Task 6: Create IUserRepository and UserRepository

**Files:**
- Create: `NAFServer/src/Domain/Interface/Repository/IUserRepository.cs`
- Create: `NAFServer/src/Infrastructure/Persistence/Repositories/UserRepository.cs`

- [ ] **Step 1: Create IUserRepository**

`NAFServer/src/Domain/Interface/Repository/IUserRepository.cs`:
```csharp
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IUserRepository
    {
        Task<bool> HasRoleAsync(string employeeId, Roles role);
        Task<List<User>> GetAllAsync();
        Task<List<UserRole>> GetRolesByEmployeeIdAsync(string employeeId);
        Task AddAsync(User user, UserRole userRole);
        Task RemoveRoleAsync(string employeeId, Roles role);
        Task<List<string>> GetLocationsAsync();
        Task AssignLocationAsync(string employeeId, string location);
    }
}
```

- [ ] **Step 2: Create UserRepository**

`NAFServer/src/Infrastructure/Persistence/Repositories/UserRepository.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> HasRoleAsync(string employeeId, Roles role)
        {
            return await _context.UserRoles.AnyAsync(ur =>
                ur.userId == employeeId &&
                ur.role == role &&
                ur.date_removed == null);
        }

        public async Task<List<User>> GetAllAsync()
        {
            return await _context.Users.ToListAsync();
        }

        public async Task<List<UserRole>> GetRolesByEmployeeIdAsync(string employeeId)
        {
            return await _context.UserRoles
                .Where(ur => ur.userId == employeeId)
                .ToListAsync();
        }

        public async Task AddAsync(User user, UserRole userRole)
        {
            await _context.Users.AddAsync(user);
            await _context.UserRoles.AddAsync(userRole);
            await _context.SaveChangesAsync();
        }

        public async Task RemoveRoleAsync(string employeeId, Roles role)
        {
            var userRole = await _context.UserRoles.FirstOrDefaultAsync(ur =>
                ur.userId == employeeId &&
                ur.role == role &&
                ur.date_removed == null)
                ?? throw new KeyNotFoundException($"Active role {role} not found for employee {employeeId}");
            userRole.date_removed = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task<List<string>> GetLocationsAsync()
        {
            return await _context.Users
                .Select(u => u.location)
                .Distinct()
                .ToListAsync();
        }

        public async Task AssignLocationAsync(string employeeId, string location)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.employeeId == employeeId)
                ?? throw new KeyNotFoundException($"User {employeeId} not found");
            user.location = location;
            await _context.SaveChangesAsync();
        }
    }
}
```

- [ ] **Step 3: Build**

```bash
dotnet build NAFServer/NAFServer.csproj
```
Expected: `Build succeeded.`

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Domain/Interface/Repository/IUserRepository.cs NAFServer/src/Infrastructure/Persistence/Repositories/UserRepository.cs
git commit -m "feat: add IUserRepository and UserRepository"
```

---

## Task 7: Create IAuthService, AuthService, and AuthController

**Files:**
- Create: `NAFServer/src/Application/Interfaces/IAuthService.cs`
- Create: `NAFServer/src/Application/Services/AuthService.cs`
- Create: `NAFServer/src/API/Controllers/AuthController.cs`

- [ ] **Step 1: Create IAuthService**

`NAFServer/src/Application/Interfaces/IAuthService.cs`:
```csharp
using NAFServer.src.Application.DTOs.Auth;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Application.Interfaces
{
    public interface IAuthService
    {
        Task<bool> ValidateRoleAsync(string employeeId, Roles role);
        Task<string> GenerateTokenAsync(string employeeId, Roles role);
        Task<AuthUserDTO> GetCurrentUserAsync(string employeeId);
    }
}
```

- [ ] **Step 2: Create AuthService**

`NAFServer/src/Application/Services/AuthService.cs`:
```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using NAFServer.src.Application.DTOs.Auth;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IConfiguration _config;
        private readonly IUserRepository _userRepository;
        private readonly IEmployeeRepository _employeeRepository;

        public AuthService(
            IConfiguration config,
            IUserRepository userRepository,
            IEmployeeRepository employeeRepository)
        {
            _config = config;
            _userRepository = userRepository;
            _employeeRepository = employeeRepository;
        }

        public async Task<bool> ValidateRoleAsync(string employeeId, Roles role)
        {
            return await _userRepository.HasRoleAsync(employeeId, role);
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

        public async Task<AuthUserDTO> GetCurrentUserAsync(string employeeId)
        {
            var employee = await _employeeRepository.GetByIdAsync(employeeId)
                ?? throw new KeyNotFoundException($"Employee {employeeId} not found");
            var roles = await _userRepository.GetRolesByEmployeeIdAsync(employeeId);
            var activeRole = roles.FirstOrDefault(r => r.date_removed == null);

            return new AuthUserDTO(
                employeeId,
                activeRole?.role.ToString() ?? "",
                $"{employee.FirstName} {employee.LastName}"
            );
        }
    }
}
```

- [ ] **Step 3: Create AuthController**

`NAFServer/src/API/Controllers/AuthController.cs`:
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

        [HttpPost("login/admin")]
        public async Task<IActionResult> LoginAdmin([FromBody] LoginRequestDTO request)
            => await LoginWithRole(request.EmployeeId, Roles.ADMIN);

        [HttpPost("login/technical-team")]
        public async Task<IActionResult> LoginTechnicalTeam([FromBody] LoginRequestDTO request)
            => await LoginWithRole(request.EmployeeId, Roles.TECHNICAL_TEAM);

        [HttpPost("login/requestor-approver")]
        public async Task<IActionResult> LoginRequestorApprover([FromBody] LoginRequestDTO request)
            => await LoginWithRole(request.EmployeeId, Roles.REQUESTOR_APPROVER);

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var user = await _authService.GetCurrentUserAsync(_currentUserService.EmployeeId);
            return Ok(user);
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("auth_token");
            return Ok();
        }

        private async Task<IActionResult> LoginWithRole(string employeeId, Roles role)
        {
            var isValid = await _authService.ValidateRoleAsync(employeeId, role);
            if (!isValid) return Unauthorized("Invalid employee ID or role.");

            var token = await _authService.GenerateTokenAsync(employeeId, role);

            Response.Cookies.Append("auth_token", token, new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddHours(8),
                Path = "/"
            });

            return Ok(new { employeeId, role = role.ToString() });
        }
    }
}
```

- [ ] **Step 4: Register IUserRepository and IAuthService in Program.cs**

In `NAFServer/Program.cs`, replace the commented-out block:
```csharp
// Auth + Admin (registered in later tasks — add here when created)
// builder.Services.AddScoped<IUserRepository, UserRepository>();
// builder.Services.AddScoped<IAuthService, AuthService>();
// builder.Services.AddScoped<IAdminService, AdminService>();
```
with:
```csharp
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
```

- [ ] **Step 5: Build**

```bash
dotnet build NAFServer/NAFServer.csproj
```
Expected: `Build succeeded.`

- [ ] **Step 6: Smoke test via Swagger**

Run `dotnet run` in `NAFServer/`, open `http://localhost:5186/swagger`. Find `POST /api/auth/login/requestor-approver`, try body `{ "employeeId": "0000001" }` (any seeded employee with REQUESTOR_APPROVER role). Expect `200 OK` with `{ employeeId, role }`. Try a fake ID — expect `401`.

- [ ] **Step 7: Commit**

```bash
git add NAFServer/src/Application/Interfaces/IAuthService.cs NAFServer/src/Application/Services/AuthService.cs NAFServer/src/API/Controllers/AuthController.cs NAFServer/Program.cs
git commit -m "feat: add AuthService and AuthController with JWT cookie login"
```

---

## Task 8: Create IAdminService, AdminService, and AdminController

**Files:**
- Create: `NAFServer/src/Application/Interfaces/IAdminService.cs`
- Create: `NAFServer/src/Application/Services/AdminService.cs`
- Create: `NAFServer/src/API/Controllers/AdminController.cs`

- [ ] **Step 1: Create IAdminService**

`NAFServer/src/Application/Interfaces/IAdminService.cs`:
```csharp
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Application.Interfaces
{
    public interface IAdminService
    {
        Task<List<UserWithRolesDTO>> GetAllUsersAsync();
        Task AddUserAsync(AddUserDTO dto);
        Task RemoveRoleAsync(string employeeId, Roles role);
        Task<List<string>> GetLocationsAsync();
        Task AssignLocationAsync(AssignLocationDTO dto);
    }
}
```

- [ ] **Step 2: Create AdminService**

`NAFServer/src/Application/Services/AdminService.cs`:
```csharp
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class AdminService : IAdminService
    {
        private readonly IUserRepository _userRepository;

        public AdminService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<List<UserWithRolesDTO>> GetAllUsersAsync()
        {
            var users = await _userRepository.GetAllAsync();
            var result = new List<UserWithRolesDTO>();

            foreach (var user in users)
            {
                var roles = await _userRepository.GetRolesByEmployeeIdAsync(user.employeeId);
                var roleDTOs = roles.Select(r => new UserRoleDTO(
                    r.id,
                    r.userId,
                    r.role.ToString(),
                    r.date_added,
                    r.date_removed
                )).ToList();
                result.Add(new UserWithRolesDTO(user.employeeId, user.location, roleDTOs));
            }

            return result;
        }

        public async Task AddUserAsync(AddUserDTO dto)
        {
            if (!Enum.TryParse<Roles>(dto.Role, ignoreCase: true, out var role))
                throw new ArgumentException($"Invalid role: {dto.Role}");

            var user = new User(dto.EmployeeId, dto.Location);
            var userRole = new UserRole(dto.EmployeeId, role);
            await _userRepository.AddAsync(user, userRole);
        }

        public async Task RemoveRoleAsync(string employeeId, Roles role)
        {
            await _userRepository.RemoveRoleAsync(employeeId, role);
        }

        public async Task<List<string>> GetLocationsAsync()
        {
            return await _userRepository.GetLocationsAsync();
        }

        public async Task AssignLocationAsync(AssignLocationDTO dto)
        {
            await _userRepository.AssignLocationAsync(dto.EmployeeId, dto.Location);
        }
    }
}
```

- [ ] **Step 3: Create AdminController**

`NAFServer/src/API/Controllers/AdminController.cs`:
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.API.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            return Ok(await _adminService.GetAllUsersAsync());
        }

        [HttpPost("users")]
        public async Task<IActionResult> AddUser([FromBody] AddUserDTO dto)
        {
            try
            {
                await _adminService.AddUserAsync(dto);
                return Created("", null);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPatch("users/{employeeId}/roles/{role}/remove")]
        public async Task<IActionResult> RemoveRole(string employeeId, Roles role)
        {
            try
            {
                await _adminService.RemoveRoleAsync(employeeId, role);
                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("locations")]
        public async Task<IActionResult> GetLocations()
        {
            return Ok(await _adminService.GetLocationsAsync());
        }

        [HttpPost("locations/assign")]
        public async Task<IActionResult> AssignLocation([FromBody] AssignLocationDTO dto)
        {
            try
            {
                await _adminService.AssignLocationAsync(dto);
                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}
```

- [ ] **Step 4: Register IAdminService in Program.cs**

In `NAFServer/Program.cs`, after `builder.Services.AddScoped<IAuthService, AuthService>();`, add:
```csharp
builder.Services.AddScoped<IAdminService, AdminService>();
```

- [ ] **Step 5: Build**

```bash
dotnet build NAFServer/NAFServer.csproj
```
Expected: `Build succeeded.`

- [ ] **Step 6: Commit**

```bash
git add NAFServer/src/Application/Interfaces/IAdminService.cs NAFServer/src/Application/Services/AdminService.cs NAFServer/src/API/Controllers/AdminController.cs NAFServer/Program.cs
git commit -m "feat: add AdminService and AdminController"
```

---

## Task 9: Add Implementation query methods and ImplementationController

**Files:**
- Modify: `NAFServer/src/Domain/Interface/Repository/IImplementationRepository.cs`
- Modify: `NAFServer/src/Infrastructure/Persistence/Repositories/ImplementationRepository.cs`
- Modify: `NAFServer/src/Application/Interfaces/IImplementationService.cs`
- Modify: `NAFServer/src/Application/Services/ImplementationService.cs`
- Create: `NAFServer/src/API/Controllers/ImplementationController.cs`

- [ ] **Step 1: Add ForImplementationItemDTO**

Create `NAFServer/src/Application/DTOs/ResourceRequest/ForImplementationItemDTO.cs`:
```csharp
using static NAFServer.src.Domain.Entities.ResourceRequestImplementation;

namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record ForImplementationItemDTO(
        Guid Id,
        Guid NAFId,
        string Progress,
        string ResourceName,
        Guid? ImplementationId,
        ImplementationStatus? ImplementationStatus,
        string? AssignedTo
    );
}
```

- [ ] **Step 2: Update IImplementationRepository**

Replace entire `NAFServer/src/Domain/Interface/Repository/IImplementationRepository.cs`:
```csharp
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IImplementationRepository
    {
        Task<ResourceRequestImplementation> GetByIdAsync(string id);
        Task<List<ResourceRequestImplementation>> GetByEmployeeIdAsync(string employeeId);
        Task<List<ResourceRequest>> GetForImplementationsAsync();
        Task<ResourceRequestImplementation?> GetByResourceRequestIdAsync(Guid resourceRequestId);
        Task<ResourceRequestImplementation> CreateAsync(Guid resourceRequestId);
    }
}
```

- [ ] **Step 2: Update ImplementationRepository**

Replace entire `NAFServer/src/Infrastructure/Persistence/Repositories/ImplementationRepository.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;
using static NAFServer.src.Domain.Entities.ResourceRequestImplementation;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class ImplementationRepository : IImplementationRepository
    {
        private readonly AppDbContext _context;

        public ImplementationRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ResourceRequestImplementation> GetByIdAsync(string id)
        {
            return await _context.Implementations.FindAsync(Guid.Parse(id))
                ?? throw new KeyNotFoundException("Implementation not found");
        }

        public async Task<List<ResourceRequestImplementation>> GetByEmployeeIdAsync(string employeeId)
        {
            return await _context.Implementations
                .Include(i => i.ResourceRequest)
                    .ThenInclude(rr => rr.Resource)
                .Include(i => i.ResourceRequest)
                    .ThenInclude(rr => rr.NAF)
                .Where(i => i.EmployeeId == employeeId)
                .ToListAsync();
        }

        public async Task<List<ResourceRequest>> GetForImplementationsAsync()
        {
            return await _context.ResourceRequests
                .Include(rr => rr.Resource)
                .Include(rr => rr.NAF)
                .Include(rr => rr.ResourceRequestImplementation)
                .Where(rr => rr.Progress == Progress.IMPLEMENTATION)
                .ToListAsync();
        }

        public async Task<ResourceRequestImplementation?> GetByResourceRequestIdAsync(Guid resourceRequestId)
        {
            return await _context.Implementations
                .FirstOrDefaultAsync(i => i.ResourceRequestId == resourceRequestId);
        }

        public async Task<ResourceRequestImplementation> CreateAsync(Guid resourceRequestId)
        {
            var implementation = new ResourceRequestImplementation(resourceRequestId);
            await _context.Implementations.AddAsync(implementation);
            await _context.SaveChangesAsync();
            return implementation;
        }
    }
}
```

- [ ] **Step 3: Update IImplementationService**

Replace entire `NAFServer/src/Application/Interfaces/IImplementationService.cs`:
```csharp
using NAFServer.src.Application.DTOs.ResourceRequest;

namespace NAFServer.src.Application.Interfaces
{
    public interface IImplementationService
    {
        Task<ResourceRequestImplementationDTO> SetToInProgress(string request, string employeeId);
        Task<ResourceRequestImplementationDTO> SetToDelayed(string request, string DelayReason);
        Task<ResourceRequestImplementationDTO> SetToAccomplished(string request);
        Task<List<ResourceRequestImplementationDTO>> GetMyTasksAsync(string employeeId);
        Task<List<ForImplementationItemDTO>> GetForImplementationsAsync();
        Task<ResourceRequestImplementationDTO> AssignToMeAsync(Guid resourceRequestId, string employeeId);
    }
}
```

- [ ] **Step 4: Update ImplementationService**

Replace entire `NAFServer/src/Application/Services/ImplementationService.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;
using NAFServer.src.Mapper;

namespace NAFServer.src.Application.Services
{
    public class ImplementationService : IImplementationService
    {
        private readonly IImplementationRepository _implementationRepository;
        private readonly AppDbContext _context;

        public ImplementationService(IImplementationRepository implementationRepository, AppDbContext context)
        {
            _implementationRepository = implementationRepository;
            _context = context;
        }

        public async Task<ResourceRequestImplementationDTO> SetToAccomplished(string request)
        {
            var implementation = await _implementationRepository.GetByIdAsync(request);
            implementation.SetToAccomplished();
            await _context.SaveChangesAsync();
            return ResourceRequestImplementationMapper.ToDTO(implementation);
        }

        public async Task<ResourceRequestImplementationDTO> SetToDelayed(string request, string DelayReason)
        {
            var implementation = await _implementationRepository.GetByIdAsync(request);
            implementation.SetToDelayed(DelayReason);
            await _context.SaveChangesAsync();
            return ResourceRequestImplementationMapper.ToDTO(implementation);
        }

        public async Task<ResourceRequestImplementationDTO> SetToInProgress(string request, string EmployeeId)
        {
            var implementation = await _implementationRepository.GetByIdAsync(request);
            implementation.SetToInProgress(EmployeeId);
            await _context.SaveChangesAsync();
            return ResourceRequestImplementationMapper.ToDTO(implementation);
        }

        public async Task<List<ResourceRequestImplementationDTO>> GetMyTasksAsync(string employeeId)
        {
            var implementations = await _implementationRepository.GetByEmployeeIdAsync(employeeId);
            return implementations.Select(ResourceRequestImplementationMapper.ToDTO).ToList();
        }

        public async Task<List<ForImplementationItemDTO>> GetForImplementationsAsync()
        {
            var resourceRequests = await _implementationRepository.GetForImplementationsAsync();
            return resourceRequests.Select(rr => new ForImplementationItemDTO(
                rr.Id,
                rr.NAFId,
                rr.Progress.ToString(),
                rr.Resource.Name,
                rr.ResourceRequestImplementation?.Id,
                rr.ResourceRequestImplementation?.Status,
                rr.ResourceRequestImplementation?.EmployeeId
            )).ToList();
        }

        public async Task<ResourceRequestImplementationDTO> AssignToMeAsync(Guid resourceRequestId, string employeeId)
        {
            var implementation = await _implementationRepository.GetByResourceRequestIdAsync(resourceRequestId)
                ?? await _implementationRepository.CreateAsync(resourceRequestId);
            implementation.SetToInProgress(employeeId);
            await _context.SaveChangesAsync();
            return ResourceRequestImplementationMapper.ToDTO(implementation);
        }
    }
}
```

- [ ] **Step 5: Create ImplementationController**

`NAFServer/src/API/Controllers/ImplementationController.cs`:
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/implementations")]
    [ApiController]
    [Authorize(Roles = "TECHNICAL_TEAM")]
    public class ImplementationController : ControllerBase
    {
        private readonly IImplementationService _implementationService;
        private readonly ICurrentUserService _currentUserService;

        public ImplementationController(
            IImplementationService implementationService,
            ICurrentUserService currentUserService)
        {
            _implementationService = implementationService;
            _currentUserService = currentUserService;
        }

        [HttpGet("my-tasks")]
        public async Task<IActionResult> GetMyTasks()
        {
            var tasks = await _implementationService.GetMyTasksAsync(_currentUserService.EmployeeId);
            return Ok(tasks);
        }

        [HttpGet("for-implementations")]
        public async Task<IActionResult> GetForImplementations()
        {
            var requests = await _implementationService.GetForImplementationsAsync();
            return Ok(requests);
        }

        [HttpPost("{resourceRequestId:guid}/assign")]
        public async Task<IActionResult> AssignToMe(Guid resourceRequestId)
        {
            try
            {
                var result = await _implementationService.AssignToMeAsync(
                    resourceRequestId, _currentUserService.EmployeeId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
```

- [ ] **Step 6: Build**

```bash
dotnet build NAFServer/NAFServer.csproj
```

If `ResourceRequestMapper.ToDTO` signature doesn't match, check `NAFServer/src/Mapper/ResourceRequestMapper.cs` and adjust the call accordingly. The mapper likely takes a `ResourceRequest` and returns `ResourceRequestDTO`.

- [ ] **Step 7: Commit**

```bash
git add NAFServer/src/Domain/Interface/Repository/IImplementationRepository.cs NAFServer/src/Infrastructure/Persistence/Repositories/ImplementationRepository.cs NAFServer/src/Application/Interfaces/IImplementationService.cs NAFServer/src/Application/Services/ImplementationService.cs NAFServer/src/API/Controllers/ImplementationController.cs
git commit -m "feat: add implementation my-tasks, for-implementations, and assign-to-me endpoints"
```

---

## Task 10: Add [Authorize] to existing controllers

**Files:**
- Modify: `NAFServer/src/API/Controllers/NAFsController.cs`
- Modify: `NAFServer/src/API/Controllers/RequestsController.cs`
- Modify: `NAFServer/src/API/Controllers/ApprovalStepsController.cs`
- Modify: `NAFServer/src/API/Controllers/EmployeesController.cs`
- Modify: `NAFServer/src/API/Controllers/ResourcesController.cs`
- Modify: `NAFServer/src/API/Controllers/GroupEmailsController.cs`
- Modify: `NAFServer/src/API/Controllers/InternetPurposesController.cs`
- Modify: `NAFServer/src/API/Controllers/InternetResourcesController.cs`
- Modify: `NAFServer/src/API/Controllers/SharedFoldersController.cs`

- [ ] **Step 1: Add using + [Authorize] to each controller**

For each controller file above, add `using Microsoft.AspNetCore.Authorization;` at the top (if not present) and `[Authorize]` attribute on the class. Example for `NAFsController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.NAF;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NAFsController : ControllerBase
    {
        // ... rest unchanged
    }
}
```

Repeat for all 8 other existing controllers.

- [ ] **Step 2: Build**

```bash
dotnet build NAFServer/NAFServer.csproj
```
Expected: `Build succeeded.`

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/API/Controllers/
git commit -m "feat: add [Authorize] to all existing controllers"
```

---

## Task 11: Frontend — axios withCredentials + auth types + authService

**Files:**
- Modify: `NAFClient/src/services/api.tsx`
- Create: `NAFClient/src/types/api/auth.ts`
- Create: `NAFClient/src/services/EntityAPI/authService.ts`

- [ ] **Step 1: Add withCredentials to axios instance**

Replace `NAFClient/src/services/api.tsx`:
```ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});
```

- [ ] **Step 2: Create auth types**

`NAFClient/src/types/api/auth.ts`:
```ts
export type Role = "ADMIN" | "TECHNICAL_TEAM" | "REQUESTOR_APPROVER";

export interface AuthUser {
  employeeId: string;
  role: Role;
  name: string;
}
```

- [ ] **Step 3: Create authService**

`NAFClient/src/services/EntityAPI/authService.ts`:
```ts
import { api } from "@/services/api";
import type { AuthUser } from "@/types/api/auth";

export const authService = {
  loginAdmin: (employeeId: string) =>
    api.post("/auth/login/admin", { employeeId }),

  loginTechnicalTeam: (employeeId: string) =>
    api.post("/auth/login/technical-team", { employeeId }),

  loginRequestorApprover: (employeeId: string) =>
    api.post("/auth/login/requestor-approver", { employeeId }),

  me: () => api.get<AuthUser>("/auth/me"),

  logout: () => api.post("/auth/logout"),
};
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd NAFClient && npm run build
```
Expected: No type errors related to the new files.

- [ ] **Step 5: Commit**

```bash
git add NAFClient/src/services/api.tsx NAFClient/src/types/api/auth.ts NAFClient/src/services/EntityAPI/authService.ts
git commit -m "feat: add withCredentials, auth types, and authService"
```

---

## Task 12: Create AuthContext, useAuth, and ProtectedRoute

**Files:**
- Create: `NAFClient/src/features/auth/AuthContext.tsx`
- Create: `NAFClient/src/features/auth/useAuth.ts`
- Create: `NAFClient/src/features/auth/ProtectedRoute.tsx`

- [ ] **Step 1: Create AuthContext**

`NAFClient/src/features/auth/AuthContext.tsx`:
```tsx
import { createContext, useEffect, useState } from "react";
import type { AuthUser, Role } from "@/types/api/auth";
import { authService } from "@/services/EntityAPI/authService";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authService
      .me()
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

- [ ] **Step 2: Create useAuth**

`NAFClient/src/features/auth/useAuth.ts`:
```ts
import { useContext } from "react";
import { AuthContext } from "./AuthContext";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

- [ ] **Step 3: Create ProtectedRoute**

`NAFClient/src/features/auth/ProtectedRoute.tsx`:
```tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import type { Role } from "@/types/api/auth";

const loginRoutes: Record<Role, string> = {
  ADMIN: "/login/admin",
  TECHNICAL_TEAM: "/login/technical-team",
  REQUESTOR_APPROVER: "/login/requestor-approver",
};

const dashboardRoutes: Record<Role, string> = {
  ADMIN: "/admin",
  TECHNICAL_TEAM: "/technical-team",
  REQUESTOR_APPROVER: "/NAF",
};

interface ProtectedRouteProps {
  requiredRole: Role;
  children: React.ReactNode;
}

export function ProtectedRoute({ requiredRole, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to={loginRoutes[requiredRole]} replace />;

  if (user.role !== requiredRole) {
    return <Navigate to={dashboardRoutes[user.role]} replace />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 4: Wrap App in AuthProvider in main.tsx**

In `NAFClient/src/main.tsx`, import and wrap with `AuthProvider`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./app/queryClient";
import { AuthProvider } from "./features/auth/AuthContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
```

(Read `main.tsx` first to match existing import structure exactly — add only what's missing.)

- [ ] **Step 5: Build**

```bash
npm run build
```
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add NAFClient/src/features/auth/ NAFClient/src/main.tsx
git commit -m "feat: add AuthContext, useAuth, and ProtectedRoute"
```

---

## Task 13: Create login pages

**Files:**
- Create: `NAFClient/src/features/auth/pages/AdminLoginPage.tsx`
- Create: `NAFClient/src/features/auth/pages/TechTeamLoginPage.tsx`
- Create: `NAFClient/src/features/auth/pages/RequestorLoginPage.tsx`

- [ ] **Step 1: Create AdminLoginPage**

`NAFClient/src/features/auth/pages/AdminLoginPage.tsx`:
```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/EntityAPI/authService";

export default function AdminLoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.loginAdmin(employeeId);
      navigate("/admin");
    } catch {
      setError("Invalid employee ID or insufficient permissions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Login</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in with your employee ID</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 text-white rounded px-4 py-2 font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create TechTeamLoginPage**

`NAFClient/src/features/auth/pages/TechTeamLoginPage.tsx`:
```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/EntityAPI/authService";

export default function TechTeamLoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.loginTechnicalTeam(employeeId);
      navigate("/technical-team");
    } catch {
      setError("Invalid employee ID or insufficient permissions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Technical Team Login</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in with your employee ID</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 text-white rounded px-4 py-2 font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create RequestorLoginPage**

`NAFClient/src/features/auth/pages/RequestorLoginPage.tsx`:
```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/EntityAPI/authService";

export default function RequestorLoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.loginRequestorApprover(employeeId);
      navigate("/NAF");
    } catch {
      setError("Invalid employee ID or insufficient permissions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Employee Login</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in with your employee ID</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 text-white rounded px-4 py-2 font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/features/auth/pages/
git commit -m "feat: add login pages for all three roles"
```

---

## Task 14: Update Sidebar to accept dynamic navItems + create role layouts

**Files:**
- Modify: `NAFClient/src/components/layout/Sidebar.tsx`
- Modify: `NAFClient/src/components/layout/Layout.tsx`
- Create: `NAFClient/src/components/layout/RequestorLayout.tsx`
- Create: `NAFClient/src/components/layout/AdminLayout.tsx`
- Create: `NAFClient/src/components/layout/TechTeamLayout.tsx`

- [ ] **Step 1: Update Sidebar to accept navItems prop**

Replace `NAFClient/src/components/layout/Sidebar.tsx`:
```tsx
import { Home, Folder, User, Settings, MapPin, ClipboardList, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface SidebarProps {
  isOpen?: boolean;
  currentUser?: { name: string };
  activeItem?: string;
  navItems: NavItem[];
}

export default function Sidebar({
  isOpen = true,
  currentUser = { name: "User" },
  activeItem,
  navItems,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed top-14 left-0 bottom-0 z-40 flex flex-col w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out",
        !isOpen && "-translate-x-full",
      )}
    >
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const isActive = item.label === activeItem;
            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <span className={cn("shrink-0", isActive ? "text-gray-700" : "text-gray-400")}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 leading-tight">Hello</p>
            <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
              {currentUser.name}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Update Layout to accept and forward navItems**

Replace `NAFClient/src/components/layout/Layout.tsx`:
```tsx
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Header from "./Header";
import Sidebar from "./Sidebar";
import type { NavItem } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  currentUser?: { name: string };
  activeItem?: string;
  navItems: NavItem[];
}

export default function Layout({
  children,
  currentUser = { name: "User" },
  activeItem,
  navItems,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Header onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <Sidebar
        isOpen={sidebarOpen}
        currentUser={currentUser}
        activeItem={activeItem}
        navItems={navItems}
      />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <main className={cn("pt-14 min-h-screen transition-all duration-300 ease-in-out flex flex-col gap-5")}>
        <div className="p-6 flex flex-col gap-5">{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Create RequestorLayout**

`NAFClient/src/components/layout/RequestorLayout.tsx`:
```tsx
import { Folder } from "lucide-react";
import Layout from "./Layout";
import { useAuth } from "@/features/auth/useAuth";

const requestorNavItems = [
  { label: "NAF Directory", icon: <Folder className="w-5 h-5" />, href: "/NAF" },
];

export default function RequestorLayout({ children, activeItem }: { children: React.ReactNode; activeItem?: string }) {
  const { user } = useAuth();
  return (
    <Layout navItems={requestorNavItems} currentUser={{ name: user?.name ?? "" }} activeItem={activeItem}>
      {children}
    </Layout>
  );
}
```

- [ ] **Step 4: Create AdminLayout**

`NAFClient/src/components/layout/AdminLayout.tsx`:
```tsx
import { Home, Users, MapPin } from "lucide-react";
import Layout from "./Layout";
import { useAuth } from "@/features/auth/useAuth";

const adminNavItems = [
  { label: "Home", icon: <Home className="w-5 h-5" />, href: "/admin" },
  { label: "Roles", icon: <Users className="w-5 h-5" />, href: "/admin/roles" },
  { label: "Locations", icon: <MapPin className="w-5 h-5" />, href: "/admin/locations" },
];

export default function AdminLayout({ children, activeItem }: { children: React.ReactNode; activeItem?: string }) {
  const { user } = useAuth();
  return (
    <Layout navItems={adminNavItems} currentUser={{ name: user?.name ?? "" }} activeItem={activeItem}>
      {children}
    </Layout>
  );
}
```

- [ ] **Step 5: Create TechTeamLayout**

`NAFClient/src/components/layout/TechTeamLayout.tsx`:
```tsx
import { Home, ClipboardList, Wrench } from "lucide-react";
import Layout from "./Layout";
import { useAuth } from "@/features/auth/useAuth";

const techTeamNavItems = [
  { label: "Home", icon: <Home className="w-5 h-5" />, href: "/technical-team" },
  { label: "My Tasks", icon: <ClipboardList className="w-5 h-5" />, href: "/technical-team/my-tasks" },
  { label: "For Implementations", icon: <Wrench className="w-5 h-5" />, href: "/technical-team/for-implementations" },
];

export default function TechTeamLayout({ children, activeItem }: { children: React.ReactNode; activeItem?: string }) {
  const { user } = useAuth();
  return (
    <Layout navItems={techTeamNavItems} currentUser={{ name: user?.name ?? "" }} activeItem={activeItem}>
      {children}
    </Layout>
  );
}
```

- [ ] **Step 6: Build**

```bash
npm run build
```
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add NAFClient/src/components/layout/
git commit -m "feat: make Sidebar accept navItems prop, add role-based layouts"
```

---

## Task 15: Update routesEnum and router

**Files:**
- Modify: `NAFClient/src/app/routesEnum.ts`
- Modify: `NAFClient/src/app/router.tsx`

- [ ] **Step 1: Update routesEnum**

Replace `NAFClient/src/app/routesEnum.ts`:
```ts
export enum RoutesEnum {
  LOGIN_ADMIN = "/login/admin",
  LOGIN_TECH_TEAM = "/login/technical-team",
  LOGIN_REQUESTOR = "/login/requestor-approver",
  NAF = "/NAF",
  ADMIN = "/admin",
  ADMIN_ROLES = "/admin/roles",
  ADMIN_LOCATIONS = "/admin/locations",
  TECH_TEAM = "/technical-team",
  TECH_TEAM_MY_TASKS = "/technical-team/my-tasks",
  TECH_TEAM_FOR_IMPLEMENTATIONS = "/technical-team/for-implementations",
}
```

- [ ] **Step 2: Update router.tsx**

Replace `NAFClient/src/app/router.tsx`:
```tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";

const ViewAllNAF = lazy(() => import("@/features/naf/pages/ViewAllNAF"));
const NAFDetailPage = lazy(() => import("@/features/naf/pages/ViewNAFDetail"));

const AdminLoginPage = lazy(() => import("@/features/auth/pages/AdminLoginPage"));
const TechTeamLoginPage = lazy(() => import("@/features/auth/pages/TechTeamLoginPage"));
const RequestorLoginPage = lazy(() => import("@/features/auth/pages/RequestorLoginPage"));

const AdminHomePage = lazy(() => import("@/features/admin/pages/AdminHomePage"));
const RolesPage = lazy(() => import("@/features/admin/pages/RolesPage"));
const LocationsPage = lazy(() => import("@/features/admin/pages/LocationsPage"));

const TechTeamHomePage = lazy(() => import("@/features/technical-team/pages/TechTeamHomePage"));
const MyTasksPage = lazy(() => import("@/features/technical-team/pages/MyTasksPage"));
const ForImplementationsPage = lazy(() => import("@/features/technical-team/pages/ForImplementationsPage"));

export function AppRouter() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <Routes>
        {/* Public login routes */}
        <Route path="/login/admin" element={<AdminLoginPage />} />
        <Route path="/login/technical-team" element={<TechTeamLoginPage />} />
        <Route path="/login/requestor-approver" element={<RequestorLoginPage />} />

        {/* REQUESTOR_APPROVER routes */}
        <Route
          path="/NAF"
          element={
            <ProtectedRoute requiredRole="REQUESTOR_APPROVER">
              <ViewAllNAF />
            </ProtectedRoute>
          }
        />
        <Route
          path="/NAF/:nafId"
          element={
            <ProtectedRoute requiredRole="REQUESTOR_APPROVER">
              <NAFDetailPage />
            </ProtectedRoute>
          }
        />

        {/* ADMIN routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <RolesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/locations"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <LocationsPage />
            </ProtectedRoute>
          }
        />

        {/* TECHNICAL_TEAM routes */}
        <Route
          path="/technical-team"
          element={
            <ProtectedRoute requiredRole="TECHNICAL_TEAM">
              <TechTeamHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/technical-team/my-tasks"
          element={
            <ProtectedRoute requiredRole="TECHNICAL_TEAM">
              <MyTasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/technical-team/for-implementations"
          element={
            <ProtectedRoute requiredRole="TECHNICAL_TEAM">
              <ForImplementationsPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login/requestor-approver" replace />} />
      </Routes>
    </Suspense>
  );
}
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: Errors only for pages not yet created (AdminHomePage, RolesPage, etc.) — those are created in later tasks. If there are import errors for existing pages, resolve them now.

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/app/routesEnum.ts NAFClient/src/app/router.tsx
git commit -m "feat: update routes with auth-protected paths and remove employeeId params"
```

---

## Task 16: Update ViewAllNAF and ViewNAFDetail to use auth context

**Files:**
- Modify: `NAFClient/src/features/naf/pages/ViewAllNAF.tsx`
- Modify: `NAFClient/src/features/naf/pages/ViewNAFDetail.tsx`

- [ ] **Step 1: Update ViewAllNAF**

Remove `useParams` and get `employeeId` from `useAuth`. Replace the relevant import and usage:

In `ViewAllNAF.tsx`, remove:
```ts
import { useParams } from "react-router-dom";
```

Add:
```ts
import { useAuth } from "@/features/auth/useAuth";
import RequestorLayout from "@/components/layout/RequestorLayout";
```

Change:
```ts
export default function ViewAllNAF() {
  const { employeeId } = useParams();
```
to:
```ts
export default function ViewAllNAF() {
  const { user } = useAuth();
  const employeeId = user?.employeeId;
```

Replace `<Layout>` with `<RequestorLayout activeItem="NAF Directory">`.

- [ ] **Step 2: Update ViewNAFDetail**

In `NAFClient/src/features/naf/pages/ViewNAFDetail.tsx`:

Add import:
```ts
import { useAuth } from "@/features/auth/useAuth";
import RequestorLayout from "@/components/layout/RequestorLayout";
```

Change the `useParams` call at line 362 from:
```ts
const { nafId, employeeId } = useParams<{ nafId: string; employeeId: string }>();
```
to:
```ts
const { nafId } = useParams<{ nafId: string }>();
const { user } = useAuth();
const employeeId = user?.employeeId ?? "";
```

Remove the `import { Layout }` line and replace the `<Layout>` wrapper with `<RequestorLayout activeItem="NAF Directory">`.

- [ ] **Step 3: Build**

```bash
npm run build
```
Expected: No errors related to ViewAllNAF or ViewNAFDetail.

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/features/naf/pages/
git commit -m "refactor: get employeeId from auth context instead of URL params in NAF pages"
```

---

## Task 17: Admin pages and hooks

**Files:**
- Create: `NAFClient/src/services/EntityAPI/adminService.ts`
- Create: `NAFClient/src/features/admin/hooks/useAdminUsers.ts`
- Create: `NAFClient/src/features/admin/hooks/useAdminLocations.ts`
- Create: `NAFClient/src/features/admin/pages/AdminHomePage.tsx`
- Create: `NAFClient/src/features/admin/pages/RolesPage.tsx`
- Create: `NAFClient/src/features/admin/pages/LocationsPage.tsx`

- [ ] **Step 1: Create adminService**

`NAFClient/src/services/EntityAPI/adminService.ts`:
```ts
import { api } from "@/services/api";

export interface UserRoleDTO {
  id: number;
  employeeId: string;
  role: string;
  dateAdded: string;
  dateRemoved: string | null;
}

export interface UserWithRolesDTO {
  employeeId: string;
  location: string;
  roles: UserRoleDTO[];
}

export interface AddUserPayload {
  employeeId: string;
  role: string;
  location: string;
}

export const adminService = {
  getUsers: () => api.get<UserWithRolesDTO[]>("/admin/users"),
  addUser: (payload: AddUserPayload) => api.post("/admin/users", payload),
  removeRole: (employeeId: string, role: string) =>
    api.patch(`/admin/users/${employeeId}/roles/${role}/remove`),
  getLocations: () => api.get<string[]>("/admin/locations"),
  assignLocation: (employeeId: string, location: string) =>
    api.post("/admin/locations/assign", { employeeId, location }),
};
```

- [ ] **Step 2: Create useAdminUsers**

`NAFClient/src/features/admin/hooks/useAdminUsers.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService, type AddUserPayload } from "@/services/EntityAPI/adminService";

export function useAdminUsers() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminService.getUsers().then((r) => r.data),
  });

  const addUserMutation = useMutation({
    mutationFn: (payload: AddUserPayload) => adminService.addUser(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const removeRoleMutation = useMutation({
    mutationFn: ({ employeeId, role }: { employeeId: string; role: string }) =>
      adminService.removeRole(employeeId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return { usersQuery, addUserMutation, removeRoleMutation };
}
```

- [ ] **Step 3: Create useAdminLocations**

`NAFClient/src/features/admin/hooks/useAdminLocations.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/EntityAPI/adminService";

export function useAdminLocations() {
  const queryClient = useQueryClient();

  const locationsQuery = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: () => adminService.getLocations().then((r) => r.data),
  });

  const assignLocationMutation = useMutation({
    mutationFn: ({ employeeId, location }: { employeeId: string; location: string }) =>
      adminService.assignLocation(employeeId, location),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "locations"] }),
  });

  return { locationsQuery, assignLocationMutation };
}
```

- [ ] **Step 4: Create AdminHomePage**

`NAFClient/src/features/admin/pages/AdminHomePage.tsx`:
```tsx
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminHomePage() {
  return (
    <AdminLayout activeItem="Home">
      <p className="text-2xl text-amber-500 font-bold">Admin Dashboard</p>
      <p className="text-gray-500">Select a section from the sidebar to manage the system.</p>
    </AdminLayout>
  );
}
```

- [ ] **Step 5: Create RolesPage**

`NAFClient/src/features/admin/pages/RolesPage.tsx`:
```tsx
import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAdminUsers } from "../hooks/useAdminUsers";

const ROLES = ["ADMIN", "TECHNICAL_TEAM", "REQUESTOR_APPROVER"];

export default function RolesPage() {
  const { usersQuery, addUserMutation, removeRoleMutation } = useAdminUsers();
  const [form, setForm] = useState({ employeeId: "", role: ROLES[2], location: "" });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    addUserMutation.mutate(form);
    setForm({ employeeId: "", role: ROLES[2], location: "" });
  };

  return (
    <AdminLayout activeItem="Roles">
      <p className="text-2xl text-amber-500 font-bold">Roles Management</p>

      {/* Add employee form */}
      <div className="bg-white rounded-lg border p-4 flex flex-col gap-3 max-w-md">
        <p className="font-semibold text-gray-700">Add Employee to System</p>
        <form onSubmit={handleAddUser} className="flex flex-col gap-2">
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="Employee ID"
            value={form.employeeId}
            onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
            required
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            required
          />
          <button
            type="submit"
            disabled={addUserMutation.isPending}
            className="bg-amber-500 text-white rounded px-4 py-2 text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            {addUserMutation.isPending ? "Adding..." : "Add Employee"}
          </button>
        </form>
      </div>

      {/* Users table */}
      {usersQuery.isLoading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-2 border-b">Employee ID</th>
                <th className="px-4 py-2 border-b">Location</th>
                <th className="px-4 py-2 border-b">Role</th>
                <th className="px-4 py-2 border-b">Date Added</th>
                <th className="px-4 py-2 border-b">Status</th>
                <th className="px-4 py-2 border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.data?.flatMap((user) =>
                user.roles.map((role) => (
                  <tr
                    key={`${user.employeeId}-${role.id}`}
                    className={role.dateRemoved ? "opacity-40" : ""}
                  >
                    <td className="px-4 py-2 border-b">{user.employeeId}</td>
                    <td className="px-4 py-2 border-b">{user.location}</td>
                    <td className="px-4 py-2 border-b">{role.role}</td>
                    <td className="px-4 py-2 border-b">
                      {new Date(role.dateAdded).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {role.dateRemoved ? (
                        <span className="text-red-400 text-xs">Inactive</span>
                      ) : (
                        <span className="text-green-600 text-xs">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {!role.dateRemoved && (
                        <button
                          onClick={() =>
                            removeRoleMutation.mutate({
                              employeeId: user.employeeId,
                              role: role.role,
                            })
                          }
                          disabled={removeRoleMutation.isPending}
                          className="text-xs text-red-500 hover:underline disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
```

- [ ] **Step 6: Create LocationsPage**

`NAFClient/src/features/admin/pages/LocationsPage.tsx`:
```tsx
import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAdminLocations } from "../hooks/useAdminLocations";

export default function LocationsPage() {
  const { locationsQuery, assignLocationMutation } = useAdminLocations();
  const [form, setForm] = useState({ employeeId: "", location: "" });

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    assignLocationMutation.mutate(form);
    setForm({ employeeId: "", location: "" });
  };

  return (
    <AdminLayout activeItem="Locations">
      <p className="text-2xl text-amber-500 font-bold">Locations</p>

      {/* Existing locations */}
      <div className="bg-white rounded-lg border p-4 max-w-md">
        <p className="font-semibold text-gray-700 mb-3">Existing Locations</p>
        {locationsQuery.isLoading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {locationsQuery.data?.map((loc) => (
              <li key={loc} className="text-sm text-gray-700 px-3 py-1.5 bg-gray-50 rounded">
                {loc}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Assign employee to location */}
      <div className="bg-white rounded-lg border p-4 flex flex-col gap-3 max-w-md">
        <p className="font-semibold text-gray-700">Assign Employee to Location</p>
        <form onSubmit={handleAssign} className="flex flex-col gap-2">
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="Employee ID"
            value={form.employeeId}
            onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
            required
          />
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="Location (e.g. Makati)"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            required
          />
          <button
            type="submit"
            disabled={assignLocationMutation.isPending}
            className="bg-amber-500 text-white rounded px-4 py-2 text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            {assignLocationMutation.isPending ? "Assigning..." : "Assign"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 7: Build**

```bash
npm run build
```
Expected: No errors related to admin files.

- [ ] **Step 8: Commit**

```bash
git add NAFClient/src/services/EntityAPI/adminService.ts NAFClient/src/features/admin/
git commit -m "feat: add admin pages — Roles and Locations with CRUD"
```

---

## Task 18: Technical team pages and hooks

**Files:**
- Create: `NAFClient/src/services/EntityAPI/implementationService.ts`
- Create: `NAFClient/src/features/technical-team/hooks/useMyTasks.ts`
- Create: `NAFClient/src/features/technical-team/hooks/useForImplementations.ts`
- Create: `NAFClient/src/features/technical-team/pages/TechTeamHomePage.tsx`
- Create: `NAFClient/src/features/technical-team/pages/MyTasksPage.tsx`
- Create: `NAFClient/src/features/technical-team/pages/ForImplementationsPage.tsx`

- [ ] **Step 1: Create implementationService**

`NAFClient/src/services/EntityAPI/implementationService.ts`:
```ts
import { api } from "@/services/api";

export interface ImplementationTaskDTO {
  id: string;
  resourceRequestId: string;
  employeeId: string | null;
  status: string;
  acceptedAt: string | null;
  accomplishedAt: string | null;
  delayReason: string | null;
  delayedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ForImplementationItemDTO {
  id: string;
  nafId: string;
  progress: string;
  resourceName: string;
  implementationId: string | null;
  implementationStatus: string | null;
  assignedTo: string | null;
}

export const implementationService = {
  getMyTasks: () => api.get<ImplementationTaskDTO[]>("/implementations/my-tasks"),
  getForImplementations: () =>
    api.get<ForImplementationItemDTO[]>("/implementations/for-implementations"),
  assignToMe: (resourceRequestId: string) =>
    api.post<ImplementationTaskDTO>(`/implementations/${resourceRequestId}/assign`),
};
```

- [ ] **Step 2: Create useMyTasks**

`NAFClient/src/features/technical-team/hooks/useMyTasks.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import { implementationService } from "@/services/EntityAPI/implementationService";

export function useMyTasks() {
  return useQuery({
    queryKey: ["implementations", "my-tasks"],
    queryFn: () => implementationService.getMyTasks().then((r) => r.data),
  });
}
```

- [ ] **Step 3: Create useForImplementations**

`NAFClient/src/features/technical-team/hooks/useForImplementations.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { implementationService } from "@/services/EntityAPI/implementationService";

export function useForImplementations() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["implementations", "for-implementations"],
    queryFn: () => implementationService.getForImplementations().then((r) => r.data),
  });

  const assignMutation = useMutation({
    mutationFn: (id: string) =>
      implementationService.assignToMe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementations", "for-implementations"] });
      queryClient.invalidateQueries({ queryKey: ["implementations", "my-tasks"] });
    },
  });

  return { query, assignMutation };
}
```

- [ ] **Step 4: Create TechTeamHomePage**

`NAFClient/src/features/technical-team/pages/TechTeamHomePage.tsx`:
```tsx
import TechTeamLayout from "@/components/layout/TechTeamLayout";

export default function TechTeamHomePage() {
  return (
    <TechTeamLayout activeItem="Home">
      <p className="text-2xl text-amber-500 font-bold">Technical Team Dashboard</p>
      <p className="text-gray-500">Use the sidebar to view your tasks or pick up new implementations.</p>
    </TechTeamLayout>
  );
}
```

- [ ] **Step 5: Create MyTasksPage**

`NAFClient/src/features/technical-team/pages/MyTasksPage.tsx`:
```tsx
import TechTeamLayout from "@/components/layout/TechTeamLayout";
import { useMyTasks } from "../hooks/useMyTasks";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  DELAYED: "Delayed",
  ACCOMPLISHED: "Accomplished",
};

export default function MyTasksPage() {
  const { data, isLoading } = useMyTasks();

  return (
    <TechTeamLayout activeItem="My Tasks">
      <p className="text-2xl text-amber-500 font-bold">My Tasks</p>

      {isLoading ? (
        <p className="text-gray-400">Loading...</p>
      ) : !data?.length ? (
        <p className="text-gray-500">No tasks assigned to you yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-2 border-b">Implementation ID</th>
                <th className="px-4 py-2 border-b">Resource Request ID</th>
                <th className="px-4 py-2 border-b">Status</th>
                <th className="px-4 py-2 border-b">Accepted At</th>
              </tr>
            </thead>
            <tbody>
              {data.map((task) => (
                <tr key={task.id}>
                  <td className="px-4 py-2 border-b font-mono text-xs">{task.id}</td>
                  <td className="px-4 py-2 border-b font-mono text-xs">{task.resourceRequestId}</td>
                  <td className="px-4 py-2 border-b">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {STATUS_LABELS[task.status] ?? task.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-b text-gray-500">
                    {task.acceptedAt ? new Date(task.acceptedAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </TechTeamLayout>
  );
}
```

- [ ] **Step 6: Create ForImplementationsPage**

`NAFClient/src/features/technical-team/pages/ForImplementationsPage.tsx`:
```tsx
import TechTeamLayout from "@/components/layout/TechTeamLayout";
import { useForImplementations } from "../hooks/useForImplementations";

export default function ForImplementationsPage() {
  const { query, assignMutation } = useForImplementations();

  return (
    <TechTeamLayout activeItem="For Implementations">
      <p className="text-2xl text-amber-500 font-bold">For Implementations</p>

      {query.isLoading ? (
        <p className="text-gray-400">Loading...</p>
      ) : !query.data?.length ? (
        <p className="text-gray-500">No resource requests are pending implementation.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-2 border-b">Resource</th>
                <th className="px-4 py-2 border-b">NAF ID</th>
                <th className="px-4 py-2 border-b">Progress</th>
                <th className="px-4 py-2 border-b">Assigned</th>
                <th className="px-4 py-2 border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((rr) => {
                const isAssigned = rr.assignedTo !== null;

                return (
                  <tr key={rr.id}>
                    <td className="px-4 py-2 border-b">{rr.resourceName}</td>
                    <td className="px-4 py-2 border-b font-mono text-xs">{rr.nafId}</td>
                    <td className="px-4 py-2 border-b">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                        {rr.progress}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-b">
                      {isAssigned ? (
                        <span className="text-xs text-green-600">Assigned</span>
                      ) : (
                        <span className="text-xs text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {!isAssigned && (
                        <button
                          onClick={() => assignMutation.mutate(rr.id)}
                          disabled={assignMutation.isPending}
                          className="text-xs text-amber-600 hover:underline disabled:opacity-50"
                        >
                          Assign to Me
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </TechTeamLayout>
  );
}
```

- [ ] **Step 7: Build**

```bash
npm run build
```
Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add NAFClient/src/services/EntityAPI/implementationService.ts NAFClient/src/features/technical-team/
git commit -m "feat: add tech team pages — My Tasks and For Implementations"
```

---

## Task 19: End-to-end verification

- [ ] **Step 1: Start backend**

```bash
cd NAFServer && dotnet run
```
Expected: Server starts on `http://localhost:5186`. No startup errors.

- [ ] **Step 2: Start frontend**

```bash
cd NAFClient && npm run dev
```
Expected: Dev server starts on `http://localhost:5173`.

- [ ] **Step 3: Test REQUESTOR_APPROVER login**

Navigate to `http://localhost:5173/login/requestor-approver`. Enter a seeded employee ID that has the REQUESTOR_APPROVER role. Click Sign In. Expected: Redirected to `/NAF` with NAF data loading.

- [ ] **Step 4: Test ADMIN login**

Navigate to `http://localhost:5173/login/admin`. Enter a seeded employee ID with ADMIN role (IT Director employees per the seeder). Expected: Redirected to `/admin`. Sidebar shows Home, Roles, Locations. Navigate to `/admin/roles` — user table loads. Try adding an employee and removing a role.

- [ ] **Step 5: Test TECHNICAL_TEAM login**

Navigate to `http://localhost:5173/login/technical-team`. Enter a seeded employee ID with TECHNICAL_TEAM role (IT Support Specialist or Help Desk Analyst). Expected: Redirected to `/technical-team`. Navigate to `/technical-team/for-implementations` — if any resource requests are at IMPLEMENTATION progress, they appear. Click Assign to Me.

- [ ] **Step 6: Test route guard**

While logged in as REQUESTOR_APPROVER, try navigating to `/admin` directly. Expected: Redirected to `/NAF`.

- [ ] **Step 7: Test logout**

Call `POST /api/auth/logout` via Swagger or add a logout button. Expected: Cookie cleared, subsequent `/api/auth/me` returns 401.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: complete authentication implementation"
```
