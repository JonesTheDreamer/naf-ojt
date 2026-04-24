# User Management Server Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix broken server-side implementations for employee, user, role, location, and department management, and create missing services and controllers so the backend is ready for client-side consumption.

**Architecture:** Repositories handle granular DB queries; services own business logic (audit trail transitions like assign/remove); dedicated controllers per concern. Employee data is read from `vw_EmployeeLinkPeopleCore` via EF Core view mapping.

**Tech Stack:** ASP.NET Core 8, EF Core, SQL Server, JWT Auth

---

## File Map

**Modified files:**
- `NAFServer/src/Infrastructure/Persistence/AppDbContext.cs` — add `ToView` for Employee, fix User relationship config
- `NAFServer/src/Infrastructure/Persistence/Repositories/EmployeeRepository.cs` — remove unused `CacheService` constructor param
- `NAFServer/src/Infrastructure/Persistence/Repositories/UserRoleRepository.cs` — fix wrong DbSet, fix error message
- `NAFServer/src/Infrastructure/Persistence/Repositories/LocationRepository.cs` — add missing constructor
- `NAFServer/src/Domain/Interface/Repository/IUserRoleRepository.cs` — remove stale TODO comment
- `NAFServer/src/Application/Services/AuthService.cs` — fix `ValidateRoleAsync` and `GetCurrentUserAsync`
- `NAFServer/src/Application/Interfaces/IAdminService.cs` — keep only two methods
- `NAFServer/src/Application/Services/AdminService.cs` — implement `GetAllUsersInLocationAsync`, fix `AddUserAsync`, remove misplaced methods
- `NAFServer/src/API/Controllers/AdminController.cs` — add `locationId` query param, remove misplaced actions
- `NAFServer/Program.cs` — register new services and repositories

**New files:**
- `NAFServer/src/Domain/Interface/Repository/IRoleRepository.cs`
- `NAFServer/src/Infrastructure/Persistence/Repositories/RoleRepository.cs`
- `NAFServer/src/Application/Interfaces/IUserLocationService.cs`
- `NAFServer/src/Application/Services/UserLocationService.cs`
- `NAFServer/src/Application/Interfaces/IUserDepartmentService.cs`
- `NAFServer/src/Application/Services/UserDepartmentService.cs`
- `NAFServer/src/Application/Interfaces/IUserRoleService.cs`
- `NAFServer/src/Application/Services/UserRoleService.cs`
- `NAFServer/src/API/Controllers/UserLocationController.cs`
- `NAFServer/src/API/Controllers/UserDepartmentController.cs`
- `NAFServer/src/API/Controllers/UserRoleController.cs`

---

### Task 1: Fix AppDbContext — Employee view mapping and User relationships

**Files:**
- Modify: `NAFServer/src/Infrastructure/Persistence/AppDbContext.cs`

- [ ] **Step 1: Replace the commented-out Employee and User model configurations**

In `AppDbContext.cs`, locate the block of commented-out code starting at line 142 and replace it:

```csharp
// Remove these commented-out lines (lines 142–164):
//modelBuilder.Entity<Employee>(entity =>
//{
//    entity.HasKey(e => e.EmployeeNumber);
//    entity.ToView("vw_EmployeeLinkPeopleCore ");
//});
//
//modelBuilder.Entity<User>()
//    .HasMany(u => u.UserRoles)
//    ...

// Replace with:
modelBuilder.Entity<Employee>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.ToView("vw_EmployeeLinkPeopleCore");
});

modelBuilder.Entity<User>()
    .HasOne(u => u.Employee)
    .WithMany()
    .HasForeignKey(u => u.EmployeeNumber)
    .HasPrincipalKey(e => e.Id);

modelBuilder.Entity<User>()
    .HasMany(u => u.UserRoles)
    .WithOne(ur => ur.User)
    .HasForeignKey(ur => ur.UserId);

modelBuilder.Entity<User>()
    .HasMany(u => u.UserDepartments)
    .WithOne(ud => ud.User)
    .HasForeignKey(ud => ud.UserId);

modelBuilder.Entity<User>()
    .HasMany(u => u.UserLocations)
    .WithOne(ul => ul.User)
    .HasForeignKey(ul => ul.UserId);
```

- [ ] **Step 2: Build to verify**

Run from `NAFServer/`:
```bash
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/Infrastructure/Persistence/AppDbContext.cs
git commit -m "fix: map Employee entity to vw_EmployeeLinkPeopleCore view and configure User relationships"
```

---

### Task 2: Fix EmployeeRepository — remove unused CacheService dependency

**Files:**
- Modify: `NAFServer/src/Infrastructure/Persistence/Repositories/EmployeeRepository.cs`

- [ ] **Step 1: Remove the CacheService constructor parameter**

Replace the constructor:

```csharp
// Before:
public EmployeeRepository(AppDbContext context, CacheService cacheService)
{
    _context = context;
}

// After:
public EmployeeRepository(AppDbContext context)
{
    _context = context;
}
```

- [ ] **Step 2: Build to verify**

```bash
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/Infrastructure/Persistence/Repositories/EmployeeRepository.cs
git commit -m "fix: remove unused CacheService dependency from EmployeeRepository"
```

---

### Task 3: Fix LocationRepository — add missing constructor

**Files:**
- Modify: `NAFServer/src/Infrastructure/Persistence/Repositories/LocationRepository.cs`

- [ ] **Step 1: Add the missing constructor**

The class has a `private readonly AppDbContext _context` field but no constructor, so `_context` is never assigned. Add the constructor after the class declaration:

```csharp
public class LocationRepository : ILocationRepository
{
    private readonly AppDbContext _context;

    public LocationRepository(AppDbContext context)
    {
        _context = context;
    }

    // ... existing methods unchanged
```

- [ ] **Step 2: Build to verify**

```bash
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/Infrastructure/Persistence/Repositories/LocationRepository.cs
git commit -m "fix: add missing AppDbContext constructor to LocationRepository"
```

---

### Task 4: Fix UserRoleRepository — wrong DbSet reference and error messages

**Files:**
- Modify: `NAFServer/src/Infrastructure/Persistence/Repositories/UserRoleRepository.cs`
- Modify: `NAFServer/src/Domain/Interface/Repository/IUserRoleRepository.cs`

- [ ] **Step 1: Fix the wrong DbSet in AddUserRoleAsync**

In `UserRoleRepository.cs`, line 30 adds to `_context.UserLocations` — change it to `_context.UserRoles`:

```csharp
// Before:
_context.UserLocations.Add(new UserLocation(userId, roleId));

// After:
_context.UserRoles.Add(new UserRole(userId, roleId));
```

- [ ] **Step 2: Fix the wrong error message in GetUserRolesAsync**

In `UserRoleRepository.cs`, line 45:

```csharp
// Before:
throw new KeyNotFoundException("No user locations found");

// After:
throw new KeyNotFoundException("No user roles found");
```

- [ ] **Step 3: Remove the stale TODO comment from the interface**

In `IUserRoleRepository.cs`, remove line 13:

```csharp
// Remove this line:
// TODO: Implement repository
```

- [ ] **Step 4: Build to verify**

```bash
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 5: Commit**

```bash
git add NAFServer/src/Infrastructure/Persistence/Repositories/UserRoleRepository.cs NAFServer/src/Domain/Interface/Repository/IUserRoleRepository.cs
git commit -m "fix: correct wrong DbSet reference and error messages in UserRoleRepository"
```

---

### Task 5: Create IRoleRepository and RoleRepository

**Files:**
- Create: `NAFServer/src/Domain/Interface/Repository/IRoleRepository.cs`
- Create: `NAFServer/src/Infrastructure/Persistence/Repositories/RoleRepository.cs`

- [ ] **Step 1: Create the interface**

Create `NAFServer/src/Domain/Interface/Repository/IRoleRepository.cs`:

```csharp
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IRoleRepository
    {
        Task<Role?> GetByNameAsync(Roles role);
        Task<List<Role>> GetAllAsync();
    }
}
```

- [ ] **Step 2: Create the implementation**

Create `NAFServer/src/Infrastructure/Persistence/Repositories/RoleRepository.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class RoleRepository : IRoleRepository
    {
        private readonly AppDbContext _context;

        public RoleRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Role?> GetByNameAsync(Roles role)
        {
            return await _context.Roles.FirstOrDefaultAsync(r => r.Name == role);
        }

        public async Task<List<Role>> GetAllAsync()
        {
            return await _context.Roles.ToListAsync();
        }
    }
}
```

- [ ] **Step 3: Build to verify**

```bash
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Domain/Interface/Repository/IRoleRepository.cs NAFServer/src/Infrastructure/Persistence/Repositories/RoleRepository.cs
git commit -m "feat: add IRoleRepository and RoleRepository"
```

---

### Task 6: Fix AuthService — ValidateRoleAsync and GetCurrentUserAsync

**Files:**
- Modify: `NAFServer/src/Application/Services/AuthService.cs`

- [ ] **Step 1: Add IRoleRepository dependency and fix ValidateRoleAsync**

Replace the full `AuthService.cs` with:

```csharp
using Microsoft.IdentityModel.Tokens;
using NAFServer.src.Application.DTOs.Auth;
using NAFServer.src.Application.Interfaces;
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

        public AuthService(
            IConfiguration config,
            IUserRepository userRepository,
            IEmployeeRepository employeeRepository,
            IUserRoleRepository userRoleRepository,
            IRoleRepository roleRepository)
        {
            _config = config;
            _userRepository = userRepository;
            _employeeRepository = employeeRepository;
            _userRoleRepository = userRoleRepository;
            _roleRepository = roleRepository;
        }

        public async Task<bool> ValidateRoleAsync(string employeeId, Roles role)
        {
            try
            {
                var user = await _userRepository.GetUserByEmployeeId(employeeId);
                var roleEntity = await _roleRepository.GetByNameAsync(role);
                if (roleEntity == null) return false;
                return await _userRoleRepository.UserHasRoleAsync(user.Id, roleEntity.Id);
            }
            catch (KeyNotFoundException)
            {
                return false;
            }
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

            var user = await _userRepository.GetUserByEmployeeId(employeeId);

            List<NAFServer.src.Domain.Entities.UserRole> activeRoles;
            try
            {
                activeRoles = await _userRoleRepository.GetUserActiveRolesAsync(user.Id);
            }
            catch (KeyNotFoundException)
            {
                activeRoles = new List<NAFServer.src.Domain.Entities.UserRole>();
            }

            var primaryRole = activeRoles.FirstOrDefault()?.Role.Name.ToString() ?? "";

            return new AuthUserDTO(
                employeeId,
                primaryRole,
                $"{employee.FirstName} {employee.LastName}"
            );
        }
    }
}
```

- [ ] **Step 2: Build to verify**

```bash
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/Application/Services/AuthService.cs
git commit -m "fix: resolve user and role correctly in AuthService ValidateRoleAsync and GetCurrentUserAsync"
```

---

### Task 7: Fix IAdminService and AdminService

**Files:**
- Modify: `NAFServer/src/Application/Interfaces/IAdminService.cs`
- Modify: `NAFServer/src/Application/Services/AdminService.cs`

- [ ] **Step 1: Clean up IAdminService — keep only the two valid methods**

Replace `IAdminService.cs` with:

```csharp
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.DTOs.User;

namespace NAFServer.src.Application.Interfaces
{
    public interface IAdminService
    {
        Task<List<UserDTO>> GetAllUsersInLocationAsync(int locationId);
        Task AddUserAsync(AddUserDTO dto);
    }
}
```

- [ ] **Step 2: Replace AdminService.cs with the complete fixed implementation**

```csharp
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.DTOs.User;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class AdminService : IAdminService
    {
        private readonly IUserRepository _userRepository;
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly IUserLocationRepository _userLocationRepository;
        private readonly IUserDepartmentRepository _userDepartmentRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IRoleRepository _roleRepository;

        public AdminService(
            IUserRepository userRepository,
            IUserRoleRepository userRoleRepository,
            IUserLocationRepository userLocationRepository,
            IUserDepartmentRepository userDepartmentRepository,
            IEmployeeRepository employeeRepository,
            IRoleRepository roleRepository)
        {
            _userRepository = userRepository;
            _userRoleRepository = userRoleRepository;
            _userLocationRepository = userLocationRepository;
            _userDepartmentRepository = userDepartmentRepository;
            _employeeRepository = employeeRepository;
            _roleRepository = roleRepository;
        }

        public async Task<List<UserDTO>> GetAllUsersInLocationAsync(int locationId)
        {
            List<UserLocation> userLocations;
            try
            {
                userLocations = await _userLocationRepository.GetUserLocationsByLocationIdAsync(locationId);
            }
            catch (KeyNotFoundException)
            {
                return new List<UserDTO>();
            }

            var result = new List<UserDTO>();
            foreach (var ul in userLocations.Where(ul => ul.IsActive))
            {
                var user = ul.User;
                var employee = await _employeeRepository.GetByIdAsync(user.EmployeeNumber);
                if (employee == null) continue;

                List<UserRole> activeRoles;
                try
                {
                    activeRoles = await _userRoleRepository.GetUserActiveRolesAsync(user.Id);
                }
                catch (KeyNotFoundException)
                {
                    activeRoles = new List<UserRole>();
                }

                UserDepartment? activeDept = null;
                try
                {
                    activeDept = await _userDepartmentRepository.GetUserActiveDepartment(user.Id);
                }
                catch (KeyNotFoundException) { }

                result.Add(new UserDTO(
                    user.Id,
                    user.EmployeeNumber,
                    employee.LastName,
                    employee.FirstName,
                    employee.MiddleName,
                    employee.Company,
                    employee.Position ?? "",
                    activeDept?.DepartmentId ?? 0,
                    activeDept?.Department?.Name ?? "",
                    ul.LocationId,
                    ul.Location?.Name ?? "",
                    activeRoles.Select(r => r.Role.Name).ToList()
                ));
            }
            return result;
        }

        public async Task AddUserAsync(AddUserDTO dto)
        {
            if (!Enum.TryParse<Roles>(dto.Role, ignoreCase: true, out var role))
                throw new ArgumentException($"Invalid role: {dto.Role}");

            var roleEntity = await _roleRepository.GetByNameAsync(role)
                ?? throw new KeyNotFoundException($"Role {dto.Role} not found");

            var user = new User(dto.EmployeeId);
            await _userRepository.AddAsync(user);

            await _userLocationRepository.AddUserCurrentLocation(user.Id, dto.LocationId);
            await _userRoleRepository.AddUserRoleAsync(user.Id, roleEntity.Id);
        }
    }
}
```

- [ ] **Step 3: Build to verify**

```bash
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Application/Interfaces/IAdminService.cs NAFServer/src/Application/Services/AdminService.cs
git commit -m "fix: implement GetAllUsersInLocationAsync and fix AddUserAsync in AdminService"
```

---

### Task 8: Fix AdminController

**Files:**
- Modify: `NAFServer/src/API/Controllers/AdminController.cs`

- [ ] **Step 1: Replace AdminController.cs with the cleaned-up version**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.Interfaces;

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
        public async Task<IActionResult> GetUsers([FromQuery] int locationId)
        {
            return Ok(await _adminService.GetAllUsersInLocationAsync(locationId));
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
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}
```

- [ ] **Step 2: Build to verify**

```bash
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/API/Controllers/AdminController.cs
git commit -m "fix: add locationId query param to AdminController and remove misplaced actions"
```

---

### Task 9: Create IUserLocationService and UserLocationService

**Files:**
- Create: `NAFServer/src/Application/Interfaces/IUserLocationService.cs`
- Create: `NAFServer/src/Application/Services/UserLocationService.cs`

- [ ] **Step 1: Create the interface**

Create `NAFServer/src/Application/Interfaces/IUserLocationService.cs`:

```csharp
using NAFServer.src.Application.DTOs.Location;
using NAFServer.src.Application.DTOs.User;

namespace NAFServer.src.Application.Interfaces
{
    public interface IUserLocationService
    {
        Task<List<LocationDTO>> GetAllLocationsAsync();
        Task<UserLocationDTO> GetUserActiveLocationAsync(int userId);
        Task<List<UserLocationDTO>> GetUserLocationHistoryAsync(int userId);
        Task AssignLocationAsync(int userId, int locationId);
        Task RemoveUserFromLocationAsync(int userId, int locationId);
    }
}
```

- [ ] **Step 2: Create the implementation**

Create `NAFServer/src/Application/Services/UserLocationService.cs`:

```csharp
using NAFServer.src.Application.DTOs.Location;
using NAFServer.src.Application.DTOs.User;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class UserLocationService : IUserLocationService
    {
        private readonly IUserLocationRepository _userLocationRepository;
        private readonly ILocationRepository _locationRepository;

        public UserLocationService(
            IUserLocationRepository userLocationRepository,
            ILocationRepository locationRepository)
        {
            _userLocationRepository = userLocationRepository;
            _locationRepository = locationRepository;
        }

        public async Task<List<LocationDTO>> GetAllLocationsAsync()
        {
            var locations = await _locationRepository.GetAllAsync();
            return locations.Select(l => new LocationDTO(l.Id, l.Name, l.IsActive)).ToList();
        }

        public async Task<UserLocationDTO> GetUserActiveLocationAsync(int userId)
        {
            var ul = await _userLocationRepository.GetUserActiveLocation(userId);
            return new UserLocationDTO(
                ul.Id,
                ul.LocationId,
                ul.Location.Name,
                ul.UserId,
                ul.Location.IsActive,
                ul.IsActive,
                ul.DateAdded,
                ul.DateRemoved);
        }

        public async Task<List<UserLocationDTO>> GetUserLocationHistoryAsync(int userId)
        {
            try
            {
                var history = await _userLocationRepository.GetUserLocationsAsync(userId);
                return history.Select(ul => new UserLocationDTO(
                    ul.Id,
                    ul.LocationId,
                    ul.Location.Name,
                    ul.UserId,
                    ul.Location.IsActive,
                    ul.IsActive,
                    ul.DateAdded,
                    ul.DateRemoved)).ToList();
            }
            catch (KeyNotFoundException)
            {
                return new List<UserLocationDTO>();
            }
        }

        public async Task AssignLocationAsync(int userId, int locationId)
        {
            try
            {
                var current = await _userLocationRepository.GetUserActiveLocation(userId);
                if (current.LocationId != locationId)
                    await _userLocationRepository.RemoveUserFromLocation(userId, current.LocationId);
            }
            catch (KeyNotFoundException) { }

            await _userLocationRepository.AddUserCurrentLocation(userId, locationId);
        }

        public async Task RemoveUserFromLocationAsync(int userId, int locationId)
        {
            await _userLocationRepository.RemoveUserFromLocation(userId, locationId);
        }
    }
}
```

- [ ] **Step 3: Build to verify**

```bash
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Application/Interfaces/IUserLocationService.cs NAFServer/src/Application/Services/UserLocationService.cs
git commit -m "feat: add IUserLocationService and UserLocationService"
```

---

### Task 10: Create UserLocationController

**Files:**
- Create: `NAFServer/src/API/Controllers/UserLocationController.cs`

- [ ] **Step 1: Create the controller**

Create `NAFServer/src/API/Controllers/UserLocationController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/user-locations")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class UserLocationController : ControllerBase
    {
        private readonly IUserLocationService _userLocationService;

        public UserLocationController(IUserLocationService userLocationService)
        {
            _userLocationService = userLocationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllLocations()
        {
            return Ok(await _userLocationService.GetAllLocationsAsync());
        }

        [HttpGet("{userId}/active")]
        public async Task<IActionResult> GetActiveLocation(int userId)
        {
            try
            {
                return Ok(await _userLocationService.GetUserActiveLocationAsync(userId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("{userId}/history")]
        public async Task<IActionResult> GetLocationHistory(int userId)
        {
            return Ok(await _userLocationService.GetUserLocationHistoryAsync(userId));
        }

        [HttpPost("{userId}/assign")]
        public async Task<IActionResult> AssignLocation(int userId, [FromBody] int locationId)
        {
            try
            {
                await _userLocationService.AssignLocationAsync(userId, locationId);
                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("{userId}/remove/{locationId}")]
        public async Task<IActionResult> RemoveLocation(int userId, int locationId)
        {
            try
            {
                await _userLocationService.RemoveUserFromLocationAsync(userId, locationId);
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

- [ ] **Step 2: Build to verify**

```bash
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/API/Controllers/UserLocationController.cs
git commit -m "feat: add UserLocationController with CRUD endpoints"
```

---

### Task 11: Create IUserDepartmentService and UserDepartmentService

**Files:**
- Create: `NAFServer/src/Application/Interfaces/IUserDepartmentService.cs`
- Create: `NAFServer/src/Application/Services/UserDepartmentService.cs`

- [ ] **Step 1: Create the interface**

Create `NAFServer/src/Application/Interfaces/IUserDepartmentService.cs`:

```csharp
using NAFServer.src.Application.DTOs.User;

namespace NAFServer.src.Application.Interfaces
{
    public interface IUserDepartmentService
    {
        Task<UserDepartmentDTO> GetUserActiveDepartmentAsync(int userId);
        Task<List<UserDepartmentDTO>> GetUserDepartmentHistoryAsync(int userId);
        Task AssignDepartmentAsync(int userId, int departmentId);
        Task RemoveUserFromDepartmentAsync(int userId, int departmentId);
    }
}
```

- [ ] **Step 2: Create the implementation**

Create `NAFServer/src/Application/Services/UserDepartmentService.cs`:

```csharp
using NAFServer.src.Application.DTOs.User;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class UserDepartmentService : IUserDepartmentService
    {
        private readonly IUserDepartmentRepository _userDepartmentRepository;

        public UserDepartmentService(IUserDepartmentRepository userDepartmentRepository)
        {
            _userDepartmentRepository = userDepartmentRepository;
        }

        public async Task<UserDepartmentDTO> GetUserActiveDepartmentAsync(int userId)
        {
            var ud = await _userDepartmentRepository.GetUserActiveDepartment(userId);
            return new UserDepartmentDTO(
                ud.Id,
                ud.DepartmentId,
                ud.Department.Name,
                ud.UserId,
                ud.Department.IsActive,
                ud.IsActive,
                ud.DateAdded,
                ud.DateRemoved);
        }

        public async Task<List<UserDepartmentDTO>> GetUserDepartmentHistoryAsync(int userId)
        {
            try
            {
                var history = await _userDepartmentRepository.GetUserDepartmentsAsync(userId);
                return history.Select(ud => new UserDepartmentDTO(
                    ud.Id,
                    ud.DepartmentId,
                    ud.Department.Name,
                    ud.UserId,
                    ud.Department.IsActive,
                    ud.IsActive,
                    ud.DateAdded,
                    ud.DateRemoved)).ToList();
            }
            catch (KeyNotFoundException)
            {
                return new List<UserDepartmentDTO>();
            }
        }

        public async Task AssignDepartmentAsync(int userId, int departmentId)
        {
            try
            {
                var current = await _userDepartmentRepository.GetUserActiveDepartment(userId);
                if (current.DepartmentId != departmentId)
                    await _userDepartmentRepository.RemoveUserFromDepartment(userId, current.DepartmentId);
            }
            catch (KeyNotFoundException) { }

            await _userDepartmentRepository.AddUserCurrentDepartment(userId, departmentId);
        }

        public async Task RemoveUserFromDepartmentAsync(int userId, int departmentId)
        {
            await _userDepartmentRepository.RemoveUserFromDepartment(userId, departmentId);
        }
    }
}
```

- [ ] **Step 3: Build to verify**

```bash
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Application/Interfaces/IUserDepartmentService.cs NAFServer/src/Application/Services/UserDepartmentService.cs
git commit -m "feat: add IUserDepartmentService and UserDepartmentService"
```

---

### Task 12: Create UserDepartmentController

**Files:**
- Create: `NAFServer/src/API/Controllers/UserDepartmentController.cs`

- [ ] **Step 1: Create the controller**

Create `NAFServer/src/API/Controllers/UserDepartmentController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/user-departments")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class UserDepartmentController : ControllerBase
    {
        private readonly IUserDepartmentService _userDepartmentService;

        public UserDepartmentController(IUserDepartmentService userDepartmentService)
        {
            _userDepartmentService = userDepartmentService;
        }

        [HttpGet("{userId}/active")]
        public async Task<IActionResult> GetActiveDepartment(int userId)
        {
            try
            {
                return Ok(await _userDepartmentService.GetUserActiveDepartmentAsync(userId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("{userId}/history")]
        public async Task<IActionResult> GetDepartmentHistory(int userId)
        {
            return Ok(await _userDepartmentService.GetUserDepartmentHistoryAsync(userId));
        }

        [HttpPost("{userId}/assign")]
        public async Task<IActionResult> AssignDepartment(int userId, [FromBody] int departmentId)
        {
            try
            {
                await _userDepartmentService.AssignDepartmentAsync(userId, departmentId);
                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("{userId}/remove/{departmentId}")]
        public async Task<IActionResult> RemoveDepartment(int userId, int departmentId)
        {
            try
            {
                await _userDepartmentService.RemoveUserFromDepartmentAsync(userId, departmentId);
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

- [ ] **Step 2: Build to verify**

```bash
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/API/Controllers/UserDepartmentController.cs
git commit -m "feat: add UserDepartmentController with CRUD endpoints"
```

---

### Task 13: Create IUserRoleService and UserRoleService

**Files:**
- Create: `NAFServer/src/Application/Interfaces/IUserRoleService.cs`
- Create: `NAFServer/src/Application/Services/UserRoleService.cs`

- [ ] **Step 1: Create the interface**

Create `NAFServer/src/Application/Interfaces/IUserRoleService.cs`:

```csharp
using NAFServer.src.Application.DTOs.User;

namespace NAFServer.src.Application.Interfaces
{
    public interface IUserRoleService
    {
        Task<List<UserRoleDTO>> GetUserActiveRolesAsync(int userId);
        Task<List<UserRoleDTO>> GetUserRoleHistoryAsync(int userId);
        Task AssignRoleAsync(int userId, int roleId);
        Task RemoveRoleAsync(int userId, int roleId);
    }
}
```

- [ ] **Step 2: Create the implementation**

Create `NAFServer/src/Application/Services/UserRoleService.cs`:

```csharp
using NAFServer.src.Application.DTOs.User;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class UserRoleService : IUserRoleService
    {
        private readonly IUserRoleRepository _userRoleRepository;

        public UserRoleService(IUserRoleRepository userRoleRepository)
        {
            _userRoleRepository = userRoleRepository;
        }

        public async Task<List<UserRoleDTO>> GetUserActiveRolesAsync(int userId)
        {
            try
            {
                var roles = await _userRoleRepository.GetUserActiveRolesAsync(userId);
                return roles.Select(ur => new UserRoleDTO(
                    ur.Id,
                    ur.RoleId,
                    ur.Role.Name.ToString(),
                    ur.UserId,
                    ur.IsActive,
                    ur.DateAdded,
                    ur.DateRemoved)).ToList();
            }
            catch (KeyNotFoundException)
            {
                return new List<UserRoleDTO>();
            }
        }

        public async Task<List<UserRoleDTO>> GetUserRoleHistoryAsync(int userId)
        {
            try
            {
                var history = await _userRoleRepository.GetUserRolesAsync(userId);
                return history.Select(ur => new UserRoleDTO(
                    ur.Id,
                    ur.RoleId,
                    ur.Role.Name.ToString(),
                    ur.UserId,
                    ur.IsActive,
                    ur.DateAdded,
                    ur.DateRemoved)).ToList();
            }
            catch (KeyNotFoundException)
            {
                return new List<UserRoleDTO>();
            }
        }

        public async Task AssignRoleAsync(int userId, int roleId)
        {
            await _userRoleRepository.AddUserRoleAsync(userId, roleId);
        }

        public async Task RemoveRoleAsync(int userId, int roleId)
        {
            await _userRoleRepository.RemoveUserRoleAsync(userId, roleId);
        }
    }
}
```

- [ ] **Step 3: Build to verify**

```bash
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Application/Interfaces/IUserRoleService.cs NAFServer/src/Application/Services/UserRoleService.cs
git commit -m "feat: add IUserRoleService and UserRoleService"
```

---

### Task 14: Create UserRoleController

**Files:**
- Create: `NAFServer/src/API/Controllers/UserRoleController.cs`

- [ ] **Step 1: Create the controller**

Create `NAFServer/src/API/Controllers/UserRoleController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/user-roles")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class UserRoleController : ControllerBase
    {
        private readonly IUserRoleService _userRoleService;

        public UserRoleController(IUserRoleService userRoleService)
        {
            _userRoleService = userRoleService;
        }

        [HttpGet("{userId}/active")]
        public async Task<IActionResult> GetActiveRoles(int userId)
        {
            return Ok(await _userRoleService.GetUserActiveRolesAsync(userId));
        }

        [HttpGet("{userId}/history")]
        public async Task<IActionResult> GetRoleHistory(int userId)
        {
            return Ok(await _userRoleService.GetUserRoleHistoryAsync(userId));
        }

        [HttpPost("{userId}/assign")]
        public async Task<IActionResult> AssignRole(int userId, [FromBody] int roleId)
        {
            try
            {
                await _userRoleService.AssignRoleAsync(userId, roleId);
                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpDelete("{userId}/remove/{roleId}")]
        public async Task<IActionResult> RemoveRole(int userId, int roleId)
        {
            try
            {
                await _userRoleService.RemoveRoleAsync(userId, roleId);
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

- [ ] **Step 2: Build to verify**

```bash
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/API/Controllers/UserRoleController.cs
git commit -m "feat: add UserRoleController with CRUD endpoints"
```

---

### Task 15: Register new services and repositories in Program.cs

**Files:**
- Modify: `NAFServer/Program.cs`

- [ ] **Step 1: Add missing scoped registrations**

In `Program.cs`, after the line `builder.Services.AddScoped<IAdminService, AdminService>();`, add:

```csharp
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<IUserRoleRepository, UserRoleRepository>();
builder.Services.AddScoped<IUserLocationRepository, UserLocationRepository>();
builder.Services.AddScoped<IUserDepartmentRepository, UserDepartmentRepository>();
builder.Services.AddScoped<ILocationRepository, LocationRepository>();
builder.Services.AddScoped<IUserLocationService, UserLocationService>();
builder.Services.AddScoped<IUserDepartmentService, UserDepartmentService>();
builder.Services.AddScoped<IUserRoleService, UserRoleService>();
```

Also add the missing using statements at the top of `Program.cs` if not already present (they should resolve from existing namespace imports).

- [ ] **Step 2: Final build to verify the whole project**

```bash
dotnet build
```
Expected: Build succeeded, 0 errors, 0 warnings related to the changed files.

- [ ] **Step 3: Commit**

```bash
git add NAFServer/Program.cs
git commit -m "feat: register UserLocationService, UserDepartmentService, UserRoleService, and RoleRepository in DI"
```

---

## Endpoint Summary

| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/users?locationId={id}` | List users in a location |
| POST | `/api/admin/users` | Add a new user |
| GET | `/api/user-locations` | List all locations |
| GET | `/api/user-locations/{userId}/active` | Get user's active location |
| GET | `/api/user-locations/{userId}/history` | Get user's location history |
| POST | `/api/user-locations/{userId}/assign` | Assign user to location |
| DELETE | `/api/user-locations/{userId}/remove/{locationId}` | Remove user from location |
| GET | `/api/user-departments/{userId}/active` | Get user's active department |
| GET | `/api/user-departments/{userId}/history` | Get user's department history |
| POST | `/api/user-departments/{userId}/assign` | Assign user to department |
| DELETE | `/api/user-departments/{userId}/remove/{departmentId}` | Remove user from department |
| GET | `/api/user-roles/{userId}/active` | Get user's active roles |
| GET | `/api/user-roles/{userId}/history` | Get user's role history |
| POST | `/api/user-roles/{userId}/assign` | Assign role to user |
| DELETE | `/api/user-roles/{userId}/remove/{roleId}` | Remove role from user |
