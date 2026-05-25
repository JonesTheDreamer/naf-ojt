# Employee & Department View Restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace app-DB employee/department tables with SQL Server views (`vw_Employees`, `vw_Departments`), cache all employees at startup, remove `UserLocation`/`UserDepartment`/`Department`/`DepartmentEmployee` stacks, repurpose `Location` with `AllowWeekendDateNeeded`, and add `ResourceRequestAllowance` for per-resource per-location `DateNeeded` validation.

**Architecture:** Employee and DepartmentView become keyless EF Core entities mapped to SQL views; `EmployeeCacheHostedService` loads both into `IMemoryCache` on startup and refreshes every 6 hours; all `EmployeeRepository` methods read from cache. `ResourceRequestAllowance` (ResourceId × LocationId → AllowanceDays) is an app-DB table enforced on resource request creation alongside the new `Location.AllowWeekendDateNeeded` flag.

**Tech Stack:** ASP.NET Core 8, EF Core (SQL Server), IMemoryCache, IHostedService, React 19 + TypeScript, React Query, ShadCN

---

## File Map

### Created
- `NAFServer/src/Domain/Entities/DepartmentView.cs`
- `NAFServer/src/Domain/Entities/ResourceRequestAllowance.cs`
- `NAFServer/src/Infrastructure/Persistence/HostedServices/EmployeeCacheHostedService.cs`
- `NAFServer/src/Domain/Interface/Repository/IResourceRequestAllowanceRepository.cs`
- `NAFServer/src/Infrastructure/Persistence/Repositories/ResourceRequestAllowanceRepository.cs`
- `NAFServer/src/Application/Interfaces/IResourceRequestAllowanceService.cs`
- `NAFServer/src/Application/Services/ResourceRequestAllowanceService.cs`
- `NAFServer/src/Application/DTOs/ResourceRequestAllowance/ResourceRequestAllowanceDTO.cs`
- `NAFServer/src/Application/DTOs/ResourceRequestAllowance/CreateResourceRequestAllowanceDTO.cs`
- `NAFServer/src/Application/DTOs/ResourceRequestAllowance/UpdateResourceRequestAllowanceDTO.cs`
- `NAFServer/src/Mapper/ResourceRequestAllowanceMapper.cs`
- `NAFServer/src/API/Controllers/ResourceRequestAllowancesController.cs`
- `NAFServer/src/Infrastructure/Persistence/Seeder/LocationSeeder.cs`
- `NAFClient/src/shared/types/api/resourceRequestAllowance.ts`
- `NAFClient/src/services/EntityAPI/resourceAllowanceService.ts`
- `NAFClient/src/features/admin/hooks/useResourceAllowance.ts`
- `NAFClient/src/features/admin/components/ResourceAllowanceManager.tsx`

### Modified
- `NAFServer/src/Domain/Entities/Employee.cs`
- `NAFServer/src/Domain/Entities/Location.cs`
- `NAFServer/src/Domain/Entities/User.cs`
- `NAFServer/src/Domain/Entities/NAF.cs`
- `NAFServer/src/Domain/Interface/Repository/IEmployeeRepository.cs`
- `NAFServer/src/Infrastructure/Persistence/Repositories/EmployeeRepository.cs`
- `NAFServer/src/Infrastructure/Persistence/Repositories/LocationRepository.cs`
- `NAFServer/src/Infrastructure/Persistence/AppDbContext.cs`
- `NAFServer/src/Application/DTOs/Employee/EmployeeDTO.cs`
- `NAFServer/src/Application/DTOs/Location/LocationDTO.cs`
- `NAFServer/src/Application/Services/NAFService.cs`
- `NAFServer/src/Application/Services/ResourceRequestService.cs`
- `NAFServer/src/Application/Services/LocationService.cs`
- `NAFServer/src/Application/Services/EmployeeService.cs`
- `NAFServer/src/Application/Services/CurrentUserService.cs`
- `NAFServer/src/Infrastructure/Persistence/Seeder/UserSeeder.cs`
- `NAFServer/Program.cs`
- `NAFClient/src/shared/types/api/employee.ts`
- `NAFClient/src/features/naf/components/resource-request/ResourceRequestContent.tsx`
- `NAFClient/src/features/admin/pages/AdminHomePage.tsx`

### Deleted
- `NAFServer/src/Domain/Entities/Department.cs`
- `NAFServer/src/Domain/Entities/UserLocation.cs`
- `NAFServer/src/Domain/Entities/UserDepartment.cs`
- `NAFServer/src/Domain/Entities/DepartmentEmployee.cs`
- `NAFServer/src/Domain/Interface/Repository/IDepartmentRepository.cs`
- `NAFServer/src/Domain/Interface/Repository/IUserLocationRepository.cs`
- `NAFServer/src/Domain/Interface/Repository/IUserDepartmentRepository.cs`
- `NAFServer/src/Domain/Interface/Repository/IDepartmentEmployeeRepository.cs`
- `NAFServer/src/Infrastructure/Persistence/Repositories/DepartmentRepository.cs`
- `NAFServer/src/Infrastructure/Persistence/Repositories/UserLocationRepository.cs`
- `NAFServer/src/Infrastructure/Persistence/Repositories/UserDepartmentRepository.cs`
- `NAFServer/src/Infrastructure/Persistence/Repositories/DepartmentEmployeeRepository.cs`
- `NAFServer/src/Application/Interfaces/IDepartmentService.cs`
- `NAFServer/src/Application/Interfaces/IUserLocationService.cs`
- `NAFServer/src/Application/Interfaces/IUserDepartmentService.cs`
- `NAFServer/src/Application/Interfaces/IDepartmentEmployeeService.cs`
- `NAFServer/src/Application/Services/DepartmentService.cs`
- `NAFServer/src/Application/Services/UserLocationService.cs`
- `NAFServer/src/Application/Services/UserDepartmentService.cs`
- `NAFServer/src/Application/Services/DepartmentEmployeeService.cs`
- `NAFServer/src/API/Controllers/DepartmentsController.cs`
- `NAFServer/src/API/Controllers/UserLocationController.cs`
- `NAFServer/src/API/Controllers/UserDepartmentController.cs`
- `NAFServer/src/Mapper/DepartmentMapper.cs`
- `NAFServer/src/Mapper/UserMapper/UserLocationMapper.cs`
- `NAFServer/src/Mapper/UserMapper/UserDepartmentMapper.cs`
- `NAFServer/src/Application/DTOs/Department/` (entire folder)
- `NAFServer/src/Application/DTOs/User/UserLocationDTO.cs`
- `NAFServer/src/Application/DTOs/User/UserDepartmentDTO.cs`
- `NAFServer/src/Infrastructure/Persistence/Seeder/EmployeeDepartmentSeeder.cs`
- `NAFServer/src/Infrastructure/Persistence/Seeder/DepartmentEmployeeSeeder.cs`

---

## Task 1: Update Employee Entity

**Files:**
- Modify: `NAFServer/src/Domain/Entities/Employee.cs`

- [ ] **Step 1: Replace Employee.cs with view-mapped version**

Replace the entire file with:

```csharp
namespace NAFServer.src.Domain.Entities
{
    public class Employee
    {
        public string Id { get; set; }
        public string FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string LastName { get; set; }
        public string FullName { get; set; }
        public string Status { get; set; }
        public string Company { get; set; }
        public string? Position { get; set; }
        public string? Location { get; set; }
        public string? SupervisorId { get; set; }
        public string DepartmentId { get; set; }
        public string DepartmentDesc { get; set; }
        public string DepartmentHead { get; set; }
    }
}
```

Note: `DepartmentHeadId` is gone — replaced by `DepartmentHead` (full name string from view). `EmployeeNumber` column is mapped to `Id` via EF config in Task 10.

- [ ] **Step 2: Create DepartmentView entity**

Create `NAFServer/src/Domain/Entities/DepartmentView.cs`:

```csharp
namespace NAFServer.src.Domain.Entities
{
    public class DepartmentView
    {
        public string Id { get; set; }
        public string DepartmentDesc { get; set; }
        public string DepartmentHead { get; set; }
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/Domain/Entities/Employee.cs NAFServer/src/Domain/Entities/DepartmentView.cs
git commit -m "feat: update Employee entity for vw_Employees, add DepartmentView entity"
```

---

## Task 2: Repurpose Location Entity + Create ResourceRequestAllowance

**Files:**
- Modify: `NAFServer/src/Domain/Entities/Location.cs`
- Create: `NAFServer/src/Domain/Entities/ResourceRequestAllowance.cs`

- [ ] **Step 1: Update Location.cs — add AllowWeekendDateNeeded, remove nav props**

Replace entire file:

```csharp
namespace NAFServer.src.Domain.Entities
{
    public class Location
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public bool IsActive { get; set; }
        public bool AllowWeekendDateNeeded { get; set; }
        public List<NAF> NAFs { get; set; } = new();

        public Location(string name)
        {
            Name = name;
            IsActive = true;
            AllowWeekendDateNeeded = true;
        }

        public Location SetToInactive()
        {
            IsActive = false;
            return this;
        }

        public Location SetToActive()
        {
            IsActive = true;
            return this;
        }
    }
}
```

- [ ] **Step 2: Create ResourceRequestAllowance.cs**

Create `NAFServer/src/Domain/Entities/ResourceRequestAllowance.cs`:

```csharp
namespace NAFServer.src.Domain.Entities
{
    public class ResourceRequestAllowance
    {
        public int Id { get; set; }
        public int ResourceId { get; set; }
        public int LocationId { get; set; }
        public int AllowanceDays { get; set; }

        public Resource Resource { get; set; }
        public Location Location { get; set; }

        private ResourceRequestAllowance() { }

        public ResourceRequestAllowance(int resourceId, int locationId, int allowanceDays)
        {
            ResourceId = resourceId;
            LocationId = locationId;
            AllowanceDays = allowanceDays;
        }
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/Domain/Entities/Location.cs NAFServer/src/Domain/Entities/ResourceRequestAllowance.cs
git commit -m "feat: repurpose Location with AllowWeekendDateNeeded, add ResourceRequestAllowance entity"
```

---

## Task 3: Update NAF + User Entities

**Files:**
- Modify: `NAFServer/src/Domain/Entities/NAF.cs`
- Modify: `NAFServer/src/Domain/Entities/User.cs`

- [ ] **Step 1: Update NAF.cs — DepartmentId becomes string, remove Department nav prop**

Replace entire file:

```csharp
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Exceptions;

namespace NAFServer.src.Domain.Entities
{
    public class NAF : TimeStamp
    {
        public Guid Id { get; set; }
        public string Reference { get; set; }
        public string RequestorId { get; set; }
        public string EmployeeId { get; set; }
        public int LocationId { get; set; }
        public DateTime? AccomplishedAt { get; set; }
        public DateTime SubmittedAt { get; set; }
        public Progress Progress { get; set; }
        public Location Location { get; set; }
        public string DepartmentId { get; set; }
        public bool IsActive { get; set; }
        public List<ResourceRequest> ResourceRequests { get; set; } = new();

        private NAF() { }

        public NAF(string reference, string requestorId, string employeeId, string departmentId, int locationId)
        {
            Reference = reference;
            RequestorId = requestorId;
            EmployeeId = employeeId;
            DepartmentId = departmentId;
            LocationId = locationId;
            SubmittedAt = DateTime.UtcNow;
            Progress = Progress.OPEN;
            IsActive = true;
        }

        public NAF SetToInProgress()
        {
            if (Progress == Progress.IN_PROGRESS) throw new DomainException("Already In Progress");
            Progress = Progress.IN_PROGRESS;
            return this;
        }

        public NAF SetToApproved()
        {
            if (Progress == Progress.ACCOMPLISHED) throw new DomainException("Already Approved");
            Progress = Progress.ACCOMPLISHED;
            AccomplishedAt = DateTime.UtcNow;
            return this;
        }

        public bool IsFullyApproved() =>
            ResourceRequests.All(rr => rr.Progress == Progress.ACCOMPLISHED);

        public List<ResourceRequest> AddResource(ResourceRequest request)
        {
            ResourceRequests.Add(request);
            return ResourceRequests;
        }

        public bool CascadeApproval()
        {
            if (Progress == Progress.ACCOMPLISHED) return true;
            if (ResourceRequests.All(r => r.Progress == Progress.ACCOMPLISHED))
            {
                Progress = Progress.ACCOMPLISHED;
                AccomplishedAt = DateTime.UtcNow;
                return true;
            }
            return false;
        }

        public NAF DeactivateNAF() { IsActive = false; return this; }
        public NAF ActivateNAF() { IsActive = true; return this; }
    }
}
```

- [ ] **Step 2: Update User.cs — remove UserLocations and UserDepartments nav props**

Open `NAFServer/src/Domain/Entities/User.cs`. Remove the lines:
```csharp
public List<UserLocation> UserLocations { get; set; }
public List<UserDepartment> UserDepartments { get; set; }
```

The file should retain: `Id`, `EmployeeNumber`, `IsActive`, `DateAdded`, `DateRemoved`, `UserRoles`, `Employee`, and the `SetUserToInactive`/`SetUserToActive` methods.

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/Domain/Entities/NAF.cs NAFServer/src/Domain/Entities/User.cs
git commit -m "feat: NAF.DepartmentId string, remove Department nav prop; User remove UserLocation/UserDepartment navs"
```

---

## Task 4: Update IEmployeeRepository + Rewrite EmployeeRepository

**Files:**
- Modify: `NAFServer/src/Domain/Interface/Repository/IEmployeeRepository.cs`
- Modify: `NAFServer/src/Infrastructure/Persistence/Repositories/EmployeeRepository.cs`

- [ ] **Step 1: Update IEmployeeRepository.cs**

Replace entire file:

```csharp
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IEmployeeRepository
    {
        Task<Employee?> GetByIdAsync(string employeeId);
        Task<Employee?> GetByFullNameAsync(string fullName);
        Task<List<Employee>> GetSubordinatesAsync(string employeeId);
        Task<List<Employee>> SearchAsync(string match);
        Task<List<Employee>> GetByDepartmentAsync(string departmentId);
        Task<DepartmentView?> GetDepartmentByIdAsync(string departmentId);
    }
}
```

- [ ] **Step 2: Rewrite EmployeeRepository.cs**

Replace entire file:

```csharp
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class EmployeeRepository : IEmployeeRepository
    {
        private readonly CacheService _cache;
        private const string EmployeeKey = "employees:all";
        private const string DepartmentKey = "departments:all";

        public EmployeeRepository(CacheService cache)
        {
            _cache = cache;
        }

        private List<Employee> All() =>
            _cache.Get<List<Employee>>(EmployeeKey) ?? new List<Employee>();

        private List<DepartmentView> AllDepts() =>
            _cache.Get<List<DepartmentView>>(DepartmentKey) ?? new List<DepartmentView>();

        public Task<Employee?> GetByIdAsync(string employeeId) =>
            Task.FromResult(All().FirstOrDefault(e => e.Id == employeeId));

        public Task<Employee?> GetByFullNameAsync(string fullName) =>
            Task.FromResult(All().FirstOrDefault(e => e.FullName == fullName));

        public Task<List<Employee>> GetSubordinatesAsync(string employeeId)
        {
            var target = All().FirstOrDefault(e => e.Id == employeeId);
            if (target is null) return Task.FromResult(new List<Employee>());

            var result = All()
                .Where(e => e.SupervisorId == employeeId || e.DepartmentHead == target.FullName)
                .ToList();
            return Task.FromResult(result);
        }

        public Task<List<Employee>> SearchAsync(string match)
        {
            var result = All()
                .Where(e => e.Status == "Active" && (
                    e.Id.Contains(match, StringComparison.OrdinalIgnoreCase) ||
                    e.LastName.Contains(match, StringComparison.OrdinalIgnoreCase) ||
                    e.FirstName.Contains(match, StringComparison.OrdinalIgnoreCase) ||
                    (e.MiddleName != null && e.MiddleName.Contains(match, StringComparison.OrdinalIgnoreCase))
                ))
                .OrderBy(e => e.Id)
                .ToList();
            return Task.FromResult(result);
        }

        public Task<List<Employee>> GetByDepartmentAsync(string departmentId)
        {
            var result = All().Where(e => e.DepartmentId == departmentId).ToList();
            return Task.FromResult(result);
        }

        public Task<DepartmentView?> GetDepartmentByIdAsync(string departmentId) =>
            Task.FromResult(AllDepts().FirstOrDefault(d => d.Id == departmentId));
    }
}
```

Note: `CacheService` needs a `Get<T>` method — add it in the next step.

- [ ] **Step 3: Add Get<T> method to CacheService**

Open `NAFServer/src/Infrastructure/Helper/CacheService.cs` and add after the existing `Set<T>` method:

```csharp
public T? Get<T>(string key)
{
    _cache.TryGetValue(key, out T? value);
    return value;
}
```

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Domain/Interface/Repository/IEmployeeRepository.cs NAFServer/src/Infrastructure/Persistence/Repositories/EmployeeRepository.cs NAFServer/src/Infrastructure/Helper/CacheService.cs
git commit -m "feat: rewrite IEmployeeRepository and EmployeeRepository to query from IMemoryCache"
```

---

## Task 5: Create EmployeeCacheHostedService

**Files:**
- Create: `NAFServer/src/Infrastructure/Persistence/HostedServices/EmployeeCacheHostedService.cs`

- [ ] **Step 1: Create EmployeeCacheHostedService.cs**

Create the file:

```csharp
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Infrastructure.Helper;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Infrastructure.Persistence.HostedServices
{
    public class EmployeeCacheHostedService : IHostedService, IDisposable
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly CacheService _cache;
        private readonly ILogger<EmployeeCacheHostedService> _logger;
        private Timer? _timer;

        private const string EmployeeKey = "employees:all";
        private const string DepartmentKey = "departments:all";
        private static readonly TimeSpan RefreshInterval = TimeSpan.FromHours(6);

        public EmployeeCacheHostedService(
            IServiceScopeFactory scopeFactory,
            CacheService cache,
            ILogger<EmployeeCacheHostedService> logger)
        {
            _scopeFactory = scopeFactory;
            _cache = cache;
            _logger = logger;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            await RefreshAsync();
            _timer = new Timer(_ => _ = RefreshAsync(), null, RefreshInterval, RefreshInterval);
        }

        public async Task RefreshAsync()
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var employees = await context.Employees.AsNoTracking().ToListAsync();
                var departments = await context.DepartmentViews.AsNoTracking().ToListAsync();

                _cache.Set(EmployeeKey, employees);
                _cache.Set(DepartmentKey, departments);

                _logger.LogInformation("Employee cache refreshed: {Count} employees, {DeptCount} departments.",
                    employees.Count, departments.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to refresh employee cache.");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _timer?.Change(Timeout.Infinite, 0);
            return Task.CompletedTask;
        }

        public void Dispose() => _timer?.Dispose();
    }
}
```

Note: `CacheService.Set<T>` already sets with no expiry when `expiration` is null-equivalent — update its signature to allow no-expiry. Open `CacheService.cs` and change the `Set<T>` method:

```csharp
public void Set<T>(string key, T value, TimeSpan? expiration = null)
{
    if (expiration.HasValue)
        _cache.Set(key, value, expiration.Value);
    else
        _cache.Set(key, value);  // no expiry
}
```

- [ ] **Step 2: Commit**

```bash
git add NAFServer/src/Infrastructure/Persistence/HostedServices/EmployeeCacheHostedService.cs NAFServer/src/Infrastructure/Helper/CacheService.cs
git commit -m "feat: add EmployeeCacheHostedService for startup load and 6-hour cache refresh"
```

---

## Task 6: Update AppDbContext

**Files:**
- Modify: `NAFServer/src/Infrastructure/Persistence/AppDbContext.cs`

- [ ] **Step 1: Update DbSet declarations**

In `AppDbContext.cs`, make the following changes to the `DbSet` properties section:

Remove these lines:
```csharp
public DbSet<Department> Departments { get; set; }
public DbSet<UserLocation> UserLocations { get; set; }
public DbSet<UserDepartment> UserDepartments { get; set; }
public DbSet<DepartmentEmployee> DepartmentEmployees { get; set; }
```

Replace `public DbSet<Employee> Employees { get; set; }` with (keep, it stays).

Add these lines after `public DbSet<Location> Locations { get; set; }`:
```csharp
public DbSet<DepartmentView> DepartmentViews { get; set; }
public DbSet<ResourceRequestAllowance> ResourceRequestAllowances { get; set; }
```

- [ ] **Step 2: Update OnModelCreating**

In `OnModelCreating`, make the following changes:

**Remove** the `Department → DepartmentHead` relationship config:
```csharp
// DELETE THIS BLOCK:
modelBuilder.Entity<Department>()
    .HasOne(d => d.DepartmentHead)
    .WithMany()
    .HasForeignKey(d => d.DepartmentHeadId)
    .OnDelete(DeleteBehavior.NoAction);
```

**Remove** the `DepartmentEmployee` relationship config:
```csharp
// DELETE THIS BLOCK:
modelBuilder.Entity<DepartmentEmployee>()
    .HasOne(de => de.Department)
    .WithMany()
    .HasForeignKey(de => de.DepartmentId)
    .OnDelete(DeleteBehavior.Cascade);
```

**Remove** UserDepartments relationship config:
```csharp
// DELETE THIS BLOCK:
modelBuilder.Entity<User>()
    .HasMany(u => u.UserDepartments)
    .WithOne(ud => ud.User)
    .HasForeignKey(ud => ud.UserId);
```

**Remove** UserLocations relationship config:
```csharp
// DELETE THIS BLOCK:
modelBuilder.Entity<User>()
    .HasMany(u => u.UserLocations)
    .WithOne(ul => ul.User)
    .HasForeignKey(ul => ul.UserId);
```

**Remove** the `User → Employee` relationship (Employee is now keyless):
```csharp
// DELETE THIS BLOCK:
modelBuilder.Entity<User>()
    .HasOne(u => u.Employee)
    .WithMany()
    .HasForeignKey(u => u.EmployeeNumber)
    .HasPrincipalKey(e => e.Id);
```

**Add** at the end of `OnModelCreating` (before the closing brace):
```csharp
// Employee view (keyless)
modelBuilder.Entity<Employee>()
    .HasNoKey()
    .ToView("vw_Employees")
    .Property(e => e.Id).HasColumnName("EmployeeNumber");

modelBuilder.Entity<Employee>()
    .Property(e => e.DepartmentId).HasColumnName("DepartmentCode");

// DepartmentView (keyless)
modelBuilder.Entity<DepartmentView>()
    .HasNoKey()
    .ToView("vw_Departments")
    .Property(d => d.Id).HasColumnName("DepartmentCode");

// ResourceRequestAllowance
modelBuilder.Entity<ResourceRequestAllowance>()
    .HasOne(a => a.Resource)
    .WithMany()
    .HasForeignKey(a => a.ResourceId)
    .OnDelete(DeleteBehavior.Cascade);

modelBuilder.Entity<ResourceRequestAllowance>()
    .HasOne(a => a.Location)
    .WithMany()
    .HasForeignKey(a => a.LocationId)
    .OnDelete(DeleteBehavior.Cascade);

modelBuilder.Entity<ResourceRequestAllowance>()
    .HasIndex(a => new { a.ResourceId, a.LocationId })
    .IsUnique();

// NAF → Location (keep)
// NAF.DepartmentId is now a string column — no FK relationship needed
```

Also update the `NAF → Location` config to remove the `.WithMany(l => l.NAFs)` — Location still has the `NAFs` nav prop, so this can stay as-is.

- [ ] **Step 3: Build to verify**

```bash
cd NAFServer
dotnet build
```

Expected: build errors referencing `UserLocation`, `UserDepartment`, `Department`, `DepartmentEmployee` types in other files. That's expected — those files will be deleted in Task 7. Focus only on fixing errors in `AppDbContext.cs` itself.

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Infrastructure/Persistence/AppDbContext.cs
git commit -m "feat: configure Employee and DepartmentView as keyless views, add ResourceRequestAllowance, remove deleted DbSets"
```

---

## Task 7: Delete Removed Stacks

**Files:** All files listed under "Deleted" in the file map above.

- [ ] **Step 1: Delete Department stack**

```bash
cd NAFServer
Remove-Item src/Domain/Entities/Department.cs
Remove-Item src/Domain/Interface/Repository/IDepartmentRepository.cs
Remove-Item src/Infrastructure/Persistence/Repositories/DepartmentRepository.cs
Remove-Item src/Application/Interfaces/IDepartmentService.cs
Remove-Item src/Application/Services/DepartmentService.cs
Remove-Item src/API/Controllers/DepartmentsController.cs
Remove-Item src/Mapper/DepartmentMapper.cs
Remove-Item -Recurse src/Application/DTOs/Department/
```

- [ ] **Step 2: Delete UserLocation stack**

```bash
Remove-Item src/Domain/Entities/UserLocation.cs
Remove-Item src/Domain/Interface/Repository/IUserLocationRepository.cs
Remove-Item src/Infrastructure/Persistence/Repositories/UserLocationRepository.cs
Remove-Item src/Application/Interfaces/IUserLocationService.cs
Remove-Item src/Application/Services/UserLocationService.cs
Remove-Item src/API/Controllers/UserLocationController.cs
Remove-Item src/Mapper/UserMapper/UserLocationMapper.cs
Remove-Item src/Application/DTOs/User/UserLocationDTO.cs
```

- [ ] **Step 3: Delete UserDepartment stack**

```bash
Remove-Item src/Domain/Entities/UserDepartment.cs
Remove-Item src/Domain/Interface/Repository/IUserDepartmentRepository.cs
Remove-Item src/Infrastructure/Persistence/Repositories/UserDepartmentRepository.cs
Remove-Item src/Application/Interfaces/IUserDepartmentService.cs
Remove-Item src/Application/Services/UserDepartmentService.cs
Remove-Item src/API/Controllers/UserDepartmentController.cs
Remove-Item src/Mapper/UserMapper/UserDepartmentMapper.cs
Remove-Item src/Application/DTOs/User/UserDepartmentDTO.cs
```

- [ ] **Step 4: Delete DepartmentEmployee stack**

```bash
Remove-Item src/Domain/Entities/DepartmentEmployee.cs
Remove-Item src/Domain/Interface/Repository/IDepartmentEmployeeRepository.cs
Remove-Item src/Infrastructure/Persistence/Repositories/DepartmentEmployeeRepository.cs
Remove-Item src/Application/Interfaces/IDepartmentEmployeeService.cs
Remove-Item src/Application/Services/DepartmentEmployeeService.cs
```

- [ ] **Step 5: Commit deletions**

```bash
git add -A
git commit -m "chore: delete Department, UserLocation, UserDepartment, DepartmentEmployee stacks"
```

---

## Task 8: Update NAFService

**Files:**
- Modify: `NAFServer/src/Application/Services/NAFService.cs`

The goal: remove `IDepartmentRepository`, `IUserLocationRepository`, `IUserDepartmentRepository` dependencies. Fix `CreateAsync` to resolve location from `employee.Location` and department from `employee.DepartmentId`. Fix `AuthorizeNAFAccessAsync` to not use `DepartmentHeadId`.

- [ ] **Step 1: Update constructor — remove deleted dependencies**

Remove from the constructor parameters and field declarations:
- `IDepartmentRepository departmentRepository` / `_departmentRepository`
- `IUserLocationRepository userLocationRepository` / `_userLocationRepository`
- `IUserDepartmentRepository userDepartmentRepository` / `_userDepartmentRepository`

Add field:
```csharp
private readonly ILocationRepository _locationRepository;
```

Add to constructor parameter list and assignment:
```csharp
ILocationRepository locationRepository,
// ...
_locationRepository = locationRepository;
```

- [ ] **Step 2: Fix CreateAsync**

Find the `CreateAsync` method. Replace the block that fetches department and location:

Old code to remove:
```csharp
var employeeActiveDepartment = await _userDepartmentRepository.GetUserActiveDepartment(employeeUser.Id);
// ...
var hasNAFForDepartment = await _nafRepository.EmployeeHasNAFForDepartmentAsync(request.EmployeeId, employeeActiveDepartment.DepartmentId);
// ...
var employeeActiveLocation = await _userLocationRepository.GetUserActiveLocation(employeeUser.Id);
var naf = new NAF(reference, request.RequestorId, request.EmployeeId, employeeActiveDepartment.DepartmentId, employeeActiveLocation.LocationId);
```

New code:
```csharp
var hasNAFForDepartment = await _nafRepository.EmployeeHasNAFForDepartmentAsync(request.EmployeeId, employee.DepartmentId);
if (hasNAFForDepartment) throw new InvalidOperationException("Employee already has a NAF for this department");

var location = await _locationRepository.GetByNameAsync(employee.Location ?? string.Empty)
    ?? throw new InvalidOperationException($"No Location record found matching employee location '{employee.Location}'. Ensure Location table is seeded.");

var naf = new NAF(reference, request.RequestorId, request.EmployeeId, employee.DepartmentId, location.Id);
```

Also update the notification line that uses `employee.DepartmentHeadId`:

Old:
```csharp
var deptHeadId = await _notificationService.FindUserIdByEmployeeNumberAsync(employee.DepartmentHeadId);
```

New:
```csharp
var deptHead = await _employeeRepository.GetByFullNameAsync(employee.DepartmentHead ?? string.Empty);
var deptHeadId = deptHead is not null
    ? await _notificationService.FindUserIdByEmployeeNumberAsync(deptHead.Id)
    : null;
```

- [ ] **Step 3: Fix AuthorizeNAFAccessAsync**

Find in `AuthorizeNAFAccessAsync`:

Old:
```csharp
var currentDepartmentId = await _currentUserService.GetDepartmentIdAsync();
if (int.TryParse(currentDepartmentId, out int parsedDeptId) && naf.DepartmentId == parsedDeptId)
    return;
```

New (DepartmentId is now string):
```csharp
var currentDepartmentId = await _currentUserService.GetDepartmentIdAsync();
if (!string.IsNullOrEmpty(currentDepartmentId) && naf.DepartmentId == currentDepartmentId)
    return;
```

Find:
```csharp
if (nafEmployee is not null &&
    (nafEmployee.SupervisorId == currentUserId || nafEmployee.DepartmentHeadId == currentUserId))
    return;
```

Replace:
```csharp
if (nafEmployee is not null)
{
    if (nafEmployee.SupervisorId == currentUserId) return;

    var deptHeadEmployee = await _employeeRepository.GetByFullNameAsync(nafEmployee.DepartmentHead ?? string.Empty);
    if (deptHeadEmployee?.Id == currentUserId) return;
}
```

Also update `EmployeeHasNAFForDepartmentAsync` — its current signature takes `int departmentId`. Change it to `string departmentId` in both `INAFRepository` and `NAFRepository`. In `NAFRepository`, the EF query will change from `n.DepartmentId == departmentId` (int compare) to `n.DepartmentId == departmentId` (string compare — same code, just different type). The NAF table column type changes in the migration (Task 15).

- [ ] **Step 4: Build check**

```bash
cd NAFServer
dotnet build
```

Fix any remaining compile errors in NAFService.cs.

- [ ] **Step 5: Commit**

```bash
git add NAFServer/src/Application/Services/NAFService.cs
git commit -m "feat: update NAFService to resolve location/department from employee view cache"
```

---

## Task 9: Update ResourceRequestService

**Files:**
- Modify: `NAFServer/src/Application/Services/ResourceRequestService.cs`

- [ ] **Step 1: Remove deleted dependencies**

Remove from constructor parameters and field declarations:
- `IDepartmentRepository departmentRepository` / `_departmentRepository`
- `IUserLocationRepository userLocationRepository` / `_userLocationRepository`

Add field:
```csharp
private readonly IResourceRequestAllowanceRepository _allowanceRepository;
private readonly ILocationRepository _locationRepository;
```

Add to constructor:
```csharp
IResourceRequestAllowanceRepository allowanceRepository,
ILocationRepository locationRepository,
// ...
_allowanceRepository = allowanceRepository;
_locationRepository = locationRepository;
```

- [ ] **Step 2: Fix DEPARTMENT_HEAD case in FetchApproversAsync**

Find the `DEPARTMENT_HEAD` case:

Old:
```csharp
case ApproverRole.DEPARTMENT_HEAD:
    if (string.IsNullOrEmpty(step.ApproverEntity))
        approverId = employee.DepartmentHeadId;
    else
    {
        var dept = await _departmentRepository.GetByCodeAsync(step.ApproverEntity);
        approverId = dept.DepartmentHeadId;
    }
    break;
```

New:
```csharp
case ApproverRole.DEPARTMENT_HEAD:
    if (string.IsNullOrEmpty(step.ApproverEntity))
    {
        var deptHead = await _employeeRepository.GetByFullNameAsync(employee.DepartmentHead ?? string.Empty);
        approverId = deptHead?.Id;
    }
    else
    {
        var dept = await _employeeRepository.GetDepartmentByIdAsync(step.ApproverEntity);
        if (dept is not null)
        {
            var deptHead = await _employeeRepository.GetByFullNameAsync(dept.DepartmentHead);
            approverId = deptHead?.Id;
        }
    }
    break;
```

- [ ] **Step 3: Fix TECHNICAL_HEAD case**

Old:
```csharp
case ApproverRole.TECHNICAL_HEAD:
    var user = await _userRepository.GetUserByEmployeeId(employee.Id);
    var activeLocation = await _userLocationRepository.GetUserActiveLocation(user.Id);
    var techHead = await _userRepository.GetNetworkAdminOfLocation(activeLocation.LocationId);
    approverId = techHead.EmployeeNumber;
    break;
```

New (use NAF's LocationId directly):
```csharp
case ApproverRole.TECHNICAL_HEAD:
    var techHead = await _userRepository.GetNetworkAdminOfLocation(request.NAF.LocationId);
    approverId = techHead?.EmployeeNumber;
    break;
```

- [ ] **Step 4: Add DateNeeded validation**

Add a new private method `ValidateDateNeededAsync` in `ResourceRequestService`:

```csharp
private async Task ValidateDateNeededAsync(CreateResourceRequestDTO request, NAF naf)
{
    var location = await _locationRepository.GetByIdAsync(naf.LocationId);
    if (location is null) return;

    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    var dateNeeded = DateOnly.FromDateTime(request.dateNeeded);

    if (!location.AllowWeekendDateNeeded)
    {
        var dow = request.dateNeeded.DayOfWeek;
        if (dow == DayOfWeek.Saturday || dow == DayOfWeek.Sunday)
            throw new ArgumentException($"DateNeeded cannot fall on a weekend for location '{location.Name}'.");
    }

    var allowance = await _allowanceRepository.GetByResourceAndLocationAsync(request.resourceId, naf.LocationId);
    if (allowance is not null)
    {
        var minDate = today.AddDays(allowance.AllowanceDays);
        if (dateNeeded < minDate)
            throw new ArgumentException(
                $"DateNeeded must be at least {allowance.AllowanceDays} day(s) from today for this resource at location '{location.Name}'. Earliest allowed: {minDate:yyyy-MM-dd}.");
    }
}
```

- [ ] **Step 5: Call validation in CreateSpecialAsync and CreateBasicAsync**

In `CreateSpecialAsync`, add before the transaction begins:
```csharp
var naf = await _nafRepository.GetByIdAsync(request.nafId);
await ValidateDateNeededAsync(request, naf);
```

In `CreateBasicAsync`, add similarly before the creation logic.

- [ ] **Step 6: Build check**

```bash
cd NAFServer
dotnet build
```

- [ ] **Step 7: Commit**

```bash
git add NAFServer/src/Application/Services/ResourceRequestService.cs
git commit -m "feat: ResourceRequestService — remove deleted deps, add DateNeeded validation"
```

---

## Task 10: Update CurrentUserService

**Files:**
- Modify: `NAFServer/src/Application/Services/CurrentUserService.cs`

`GetDepartmentIdAsync()` previously fetched from `IUserDepartmentRepository`. It now fetches the current employee from the view cache and returns their `DepartmentId`.
`GetLocationIdAsync()` previously fetched from `IUserLocationRepository`. It now resolves the employee's `Location` string to a `Location.Id`.

- [ ] **Step 1: Update GetDepartmentIdAsync**

Find `GetDepartmentIdAsync()` in `CurrentUserService.cs`. Replace its body:

```csharp
public async Task<string> GetDepartmentIdAsync()
{
    var employee = await _employeeRepository.GetByIdAsync(EmployeeId);
    return employee?.DepartmentId ?? string.Empty;
}
```

Update `ICurrentUserService.cs` return type from `Task<string>` (it already returns string — verify and keep as-is).

- [ ] **Step 2: Update GetLocationIdAsync**

Replace its body:

```csharp
public async Task<int> GetLocationIdAsync()
{
    var employee = await _employeeRepository.GetByIdAsync(EmployeeId);
    if (employee?.Location is null) return 0;
    var location = await _locationRepository.GetByNameAsync(employee.Location);
    return location?.Id ?? 0;
}
```

Remove `IUserDepartmentRepository` and `IUserLocationRepository` from `CurrentUserService` constructor/fields. Add `ILocationRepository` if not already there.

- [ ] **Step 3: Build check**

```bash
cd NAFServer
dotnet build
```

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Application/Services/CurrentUserService.cs
git commit -m "feat: CurrentUserService resolves department/location from employee view cache"
```

---

## Task 11: ResourceRequestAllowance — Repository + Service + Controller

**Files:**
- Create: `NAFServer/src/Domain/Interface/Repository/IResourceRequestAllowanceRepository.cs`
- Create: `NAFServer/src/Infrastructure/Persistence/Repositories/ResourceRequestAllowanceRepository.cs`
- Create: `NAFServer/src/Application/DTOs/ResourceRequestAllowance/ResourceRequestAllowanceDTO.cs`
- Create: `NAFServer/src/Application/DTOs/ResourceRequestAllowance/CreateResourceRequestAllowanceDTO.cs`
- Create: `NAFServer/src/Application/DTOs/ResourceRequestAllowance/UpdateResourceRequestAllowanceDTO.cs`
- Create: `NAFServer/src/Mapper/ResourceRequestAllowanceMapper.cs`
- Create: `NAFServer/src/Application/Interfaces/IResourceRequestAllowanceService.cs`
- Create: `NAFServer/src/Application/Services/ResourceRequestAllowanceService.cs`
- Create: `NAFServer/src/API/Controllers/ResourceRequestAllowancesController.cs`

- [ ] **Step 1: Create IResourceRequestAllowanceRepository.cs**

```csharp
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IResourceRequestAllowanceRepository
    {
        Task<List<ResourceRequestAllowance>> GetAllAsync();
        Task<ResourceRequestAllowance?> GetByIdAsync(int id);
        Task<ResourceRequestAllowance?> GetByResourceAndLocationAsync(int resourceId, int locationId);
        Task<ResourceRequestAllowance> CreateAsync(int resourceId, int locationId, int allowanceDays);
        Task<ResourceRequestAllowance> UpdateAsync(int id, int allowanceDays);
        Task DeleteAsync(int id);
    }
}
```

- [ ] **Step 2: Create ResourceRequestAllowanceRepository.cs**

```csharp
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class ResourceRequestAllowanceRepository : IResourceRequestAllowanceRepository
    {
        private readonly AppDbContext _context;

        public ResourceRequestAllowanceRepository(AppDbContext context)
        {
            _context = context;
        }

        public Task<List<ResourceRequestAllowance>> GetAllAsync() =>
            _context.ResourceRequestAllowances
                .Include(a => a.Resource)
                .Include(a => a.Location)
                .AsNoTracking()
                .ToListAsync();

        public Task<ResourceRequestAllowance?> GetByIdAsync(int id) =>
            _context.ResourceRequestAllowances
                .Include(a => a.Resource)
                .Include(a => a.Location)
                .FirstOrDefaultAsync(a => a.Id == id);

        public Task<ResourceRequestAllowance?> GetByResourceAndLocationAsync(int resourceId, int locationId) =>
            _context.ResourceRequestAllowances
                .FirstOrDefaultAsync(a => a.ResourceId == resourceId && a.LocationId == locationId);

        public async Task<ResourceRequestAllowance> CreateAsync(int resourceId, int locationId, int allowanceDays)
        {
            var allowance = new ResourceRequestAllowance(resourceId, locationId, allowanceDays);
            _context.ResourceRequestAllowances.Add(allowance);
            await _context.SaveChangesAsync();
            return allowance;
        }

        public async Task<ResourceRequestAllowance> UpdateAsync(int id, int allowanceDays)
        {
            var allowance = await _context.ResourceRequestAllowances.FindAsync(id)
                ?? throw new KeyNotFoundException($"Allowance {id} not found.");
            allowance.AllowanceDays = allowanceDays;
            await _context.SaveChangesAsync();
            return allowance;
        }

        public async Task DeleteAsync(int id)
        {
            var allowance = await _context.ResourceRequestAllowances.FindAsync(id)
                ?? throw new KeyNotFoundException($"Allowance {id} not found.");
            _context.ResourceRequestAllowances.Remove(allowance);
            await _context.SaveChangesAsync();
        }
    }
}
```

- [ ] **Step 3: Create DTOs**

`ResourceRequestAllowanceDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.ResourceRequestAllowance
{
    public record ResourceRequestAllowanceDTO(
        int Id,
        int ResourceId,
        string ResourceName,
        int LocationId,
        string LocationName,
        int AllowanceDays
    );
}
```

`CreateResourceRequestAllowanceDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.ResourceRequestAllowance
{
    public record CreateResourceRequestAllowanceDTO(
        int ResourceId,
        int LocationId,
        int AllowanceDays
    );
}
```

`UpdateResourceRequestAllowanceDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.ResourceRequestAllowance
{
    public record UpdateResourceRequestAllowanceDTO(int AllowanceDays);
}
```

- [ ] **Step 4: Create ResourceRequestAllowanceMapper.cs**

```csharp
using NAFServer.src.Application.DTOs.ResourceRequestAllowance;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Mapper
{
    public static class ResourceRequestAllowanceMapper
    {
        public static ResourceRequestAllowanceDTO ToDTO(ResourceRequestAllowance allowance) =>
            new(
                allowance.Id,
                allowance.ResourceId,
                allowance.Resource?.Name ?? string.Empty,
                allowance.LocationId,
                allowance.Location?.Name ?? string.Empty,
                allowance.AllowanceDays
            );

        public static List<ResourceRequestAllowanceDTO> ListToDTO(List<ResourceRequestAllowance> list) =>
            list.Select(ToDTO).ToList();
    }
}
```

- [ ] **Step 5: Create IResourceRequestAllowanceService.cs**

```csharp
using NAFServer.src.Application.DTOs.ResourceRequestAllowance;

namespace NAFServer.src.Application.Interfaces
{
    public interface IResourceRequestAllowanceService
    {
        Task<List<ResourceRequestAllowanceDTO>> GetAllAsync();
        Task<ResourceRequestAllowanceDTO> GetByIdAsync(int id);
        Task<ResourceRequestAllowanceDTO> CreateAsync(CreateResourceRequestAllowanceDTO dto);
        Task<ResourceRequestAllowanceDTO> UpdateAsync(int id, UpdateResourceRequestAllowanceDTO dto);
        Task DeleteAsync(int id);
    }
}
```

- [ ] **Step 6: Create ResourceRequestAllowanceService.cs**

```csharp
using NAFServer.src.Application.DTOs.ResourceRequestAllowance;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Mapper;

namespace NAFServer.src.Application.Services
{
    public class ResourceRequestAllowanceService : IResourceRequestAllowanceService
    {
        private readonly IResourceRequestAllowanceRepository _repository;

        public ResourceRequestAllowanceService(IResourceRequestAllowanceRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<ResourceRequestAllowanceDTO>> GetAllAsync()
        {
            var list = await _repository.GetAllAsync();
            return ResourceRequestAllowanceMapper.ListToDTO(list);
        }

        public async Task<ResourceRequestAllowanceDTO> GetByIdAsync(int id)
        {
            var allowance = await _repository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Allowance {id} not found.");
            return ResourceRequestAllowanceMapper.ToDTO(allowance);
        }

        public async Task<ResourceRequestAllowanceDTO> CreateAsync(CreateResourceRequestAllowanceDTO dto)
        {
            var allowance = await _repository.CreateAsync(dto.ResourceId, dto.LocationId, dto.AllowanceDays);
            return ResourceRequestAllowanceMapper.ToDTO(allowance);
        }

        public async Task<ResourceRequestAllowanceDTO> UpdateAsync(int id, UpdateResourceRequestAllowanceDTO dto)
        {
            var allowance = await _repository.UpdateAsync(id, dto.AllowanceDays);
            return ResourceRequestAllowanceMapper.ToDTO(allowance);
        }

        public Task DeleteAsync(int id) => _repository.DeleteAsync(id);
    }
}
```

- [ ] **Step 7: Create ResourceRequestAllowancesController.cs**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.ResourceRequestAllowance;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/admin/resource-allowances")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class ResourceRequestAllowancesController : ControllerBase
    {
        private readonly IResourceRequestAllowanceService _service;

        public ResourceRequestAllowancesController(IResourceRequestAllowanceService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _service.GetAllAsync());

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id) =>
            Ok(await _service.GetByIdAsync(id));

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateResourceRequestAllowanceDTO dto) =>
            Ok(await _service.CreateAsync(dto));

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateResourceRequestAllowanceDTO dto) =>
            Ok(await _service.UpdateAsync(id, dto));

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
```

- [ ] **Step 8: Build check**

```bash
cd NAFServer
dotnet build
```

- [ ] **Step 9: Commit**

```bash
git add NAFServer/src/Domain/Interface/Repository/IResourceRequestAllowanceRepository.cs NAFServer/src/Infrastructure/Persistence/Repositories/ResourceRequestAllowanceRepository.cs NAFServer/src/Application/DTOs/ResourceRequestAllowance/ NAFServer/src/Mapper/ResourceRequestAllowanceMapper.cs NAFServer/src/Application/Interfaces/IResourceRequestAllowanceService.cs NAFServer/src/Application/Services/ResourceRequestAllowanceService.cs NAFServer/src/API/Controllers/ResourceRequestAllowancesController.cs
git commit -m "feat: add ResourceRequestAllowance CRUD — repository, service, controller"
```

---

## Task 12: Update LocationRepository + LocationService + LocationDTO + Add Cache Refresh Endpoint

**Files:**
- Modify: `NAFServer/src/Infrastructure/Persistence/Repositories/LocationRepository.cs`
- Modify: `NAFServer/src/Application/Services/LocationService.cs`
- Modify: `NAFServer/src/Application/DTOs/Location/LocationDTO.cs`
- Modify: `NAFServer/src/API/Controllers/LocationController.cs` (or wherever locations endpoint lives — find it)

- [ ] **Step 1: Update LocationDTO.cs — add AllowWeekendDateNeeded**

```csharp
namespace NAFServer.src.Application.DTOs.Location
{
    public record LocationDTO(
        int Id,
        string Name,
        bool IsActive,
        bool AllowWeekendDateNeeded
    );
}
```

- [ ] **Step 2: Update LocationRepository**

Find `LocationRepository.cs`. The existing `GetAllAsync`, `GetByIdAsync`, `GetByNameAsync` can stay. Remove any user-location methods if they exist. Add `UpdateAllowWeekendAsync`:

```csharp
public async Task<Location> UpdateAllowWeekendAsync(int id, bool allowWeekend)
{
    var location = await _context.Locations.FindAsync(id)
        ?? throw new KeyNotFoundException($"Location {id} not found.");
    location.AllowWeekendDateNeeded = allowWeekend;
    await _context.SaveChangesAsync();
    _cache.Remove(AllKey);
    return location;
}
```

Update `ILocationRepository` (find the file) to add:
```csharp
Task<Location> UpdateAllowWeekendAsync(int id, bool allowWeekend);
```

- [ ] **Step 3: Update LocationService**

Remove any user-assignment methods (`AssignLocationAsync`, `RemoveUserFromLocationAsync`, etc.) from `LocationService.cs` and its interface. Add:

```csharp
public async Task<Location> UpdateAllowWeekendAsync(int id, bool allowWeekend)
    => await _locationRepository.UpdateAllowWeekendAsync(id, allowWeekend);
```

- [ ] **Step 4: Add cache refresh endpoint**

Find the admin controller (look for `AdminController.cs` or similar) or add to `LocationController`. Add:

```csharp
[HttpPost("/api/admin/cache/refresh")]
[Authorize(Roles = "ADMIN")]
public async Task<IActionResult> RefreshCache([FromServices] EmployeeCacheHostedService cacheService)
{
    await cacheService.RefreshAsync();
    return NoContent();
}
```

If no suitable controller exists, add this endpoint to `LocationController.cs`.

Also add `PUT /api/admin/locations/{id}/weekend` to the location controller:

```csharp
[HttpPut("{id:int}/weekend")]
public async Task<IActionResult> UpdateWeekend(int id, [FromBody] bool allowWeekend)
{
    var location = await _locationService.UpdateAllowWeekendAsync(id, allowWeekend);
    return Ok(new LocationDTO(location.Id, location.Name, location.IsActive, location.AllowWeekendDateNeeded));
}
```

- [ ] **Step 5: Build check**

```bash
cd NAFServer
dotnet build
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: update Location with AllowWeekendDateNeeded CRUD, add cache refresh endpoint"
```

---

## Task 13: Update EmployeeDTO + EmployeeService

**Files:**
- Modify: `NAFServer/src/Application/DTOs/Employee/EmployeeDTO.cs`
- Modify: `NAFServer/src/Application/Services/EmployeeService.cs`

- [ ] **Step 1: Update EmployeeDTO.cs**

```csharp
namespace NAFServer.src.Application.DTOs.Employee
{
    public record EmployeeDTO(
        string Id,
        string FirstName,
        string? MiddleName,
        string LastName,
        string FullName,
        string Status,
        string? Company,
        string? Position,
        string? Location,
        string? SupervisorId,
        string DepartmentId,
        string DepartmentDesc,
        string DepartmentHead
    );
}
```

Removed: `HiredDate`, `RegularizedDate`, `SeparatedDate`, `DepartmentHeadId`.

- [ ] **Step 2: Update EmployeeService.cs — rename SearchEmployee to SearchAsync**

```csharp
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class EmployeeService : IEmployeeService
    {
        private readonly IEmployeeRepository _employeeRepository;

        public EmployeeService(IEmployeeRepository employeeRepository)
        {
            _employeeRepository = employeeRepository;
        }

        public Task<List<Employee>> SearchEmployee(string match) =>
            _employeeRepository.SearchAsync(match);
    }
}
```

Update `IEmployeeService` interface accordingly.

- [ ] **Step 3: Update EmployeeMapper (if one exists)**

Find `EmployeeMapper.cs` or wherever `Employee → EmployeeDTO` mapping happens. Update to use new DTO fields:

```csharp
public static EmployeeDTO ToDTO(Employee e) => new(
    e.Id, e.FirstName, e.MiddleName, e.LastName, e.FullName,
    e.Status, e.Company, e.Position, e.Location,
    e.SupervisorId, e.DepartmentId, e.DepartmentDesc, e.DepartmentHead
);
```

- [ ] **Step 4: Build check**

```bash
cd NAFServer
dotnet build
```

- [ ] **Step 5: Commit**

```bash
git add NAFServer/src/Application/DTOs/Employee/EmployeeDTO.cs NAFServer/src/Application/Services/EmployeeService.cs
git commit -m "feat: update EmployeeDTO to match vw_Employees columns"
```

---

## Task 14: Update Seeders + Program.cs

**Files:**
- Create: `NAFServer/src/Infrastructure/Persistence/Seeder/LocationSeeder.cs`
- Modify: `NAFServer/src/Infrastructure/Persistence/Seeder/UserSeeder.cs`
- Modify: `NAFServer/Program.cs`

- [ ] **Step 1: Create LocationSeeder.cs**

```csharp
using NAFServer.src.Domain.Entities;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Infrastructure.Persistence.Seeder
{
    public static class LocationSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            var locations = new[]
            {
                new { Name = "MAKATI",  AllowWeekend = false },
                new { Name = "ANTIQUE", AllowWeekend = false },
                new { Name = "CALACA",  AllowWeekend = false },
            };

            foreach (var loc in locations)
            {
                if (!context.Locations.Any(l => l.Name == loc.Name))
                {
                    var location = new Location(loc.Name);
                    location.AllowWeekendDateNeeded = loc.AllowWeekend;
                    context.Locations.Add(location);
                }
            }

            await context.SaveChangesAsync();
        }
    }
}
```

- [ ] **Step 2: Update UserSeeder.cs**

UserSeeder should now query employees from `vw_Employees` (via `context.Employees`) and create `User` records + assign roles. Remove all `UserLocation` and `UserDepartment` assignment code.

The key change is replacing any reference to seeded hardcoded employees with a view query. Find and update the seeder. The critical sections to remove are any calls to:
- `context.UserLocations.Add(...)`
- `context.UserDepartments.Add(...)`
- `context.Departments` queries for department head resolution

The role-assignment logic (based on `Position`) should stay but reference `employee.Position` from the view.

Replace the employee-fetching section with:
```csharp
var employees = await context.Employees.ToListAsync();
```

Then for each employee, create a User if not existing, and assign roles based on `employee.Position`:
```csharp
foreach (var emp in employees)
{
    var existingUser = await context.Users
        .FirstOrDefaultAsync(u => u.EmployeeNumber == emp.Id);

    if (existingUser is null)
    {
        var user = new User(emp.Id);
        context.Users.Add(user);
        await context.SaveChangesAsync();
        // assign roles based on emp.Position
    }
}
```

- [ ] **Step 3: Update Program.cs**

Remove registrations for deleted services:
```csharp
// DELETE:
builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();
builder.Services.AddScoped<IDepartmentEmployeeRepository, DepartmentEmployeeRepository>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IDepartmentEmployeeService, DepartmentEmployeeService>();
builder.Services.AddScoped<IUserLocationRepository, UserLocationRepository>();
builder.Services.AddScoped<IUserDepartmentRepository, UserDepartmentRepository>();
builder.Services.AddScoped<IUserLocationService, UserLocationService>();
builder.Services.AddScoped<IUserDepartmentService, UserDepartmentService>();
```

Add new registrations:
```csharp
builder.Services.AddScoped<IResourceRequestAllowanceRepository, ResourceRequestAllowanceRepository>();
builder.Services.AddScoped<IResourceRequestAllowanceService, ResourceRequestAllowanceService>();
builder.Services.AddSingleton<EmployeeCacheHostedService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<EmployeeCacheHostedService>());
```

Note: Register `EmployeeCacheHostedService` as singleton and also as `IHostedService` so it can be resolved by the cache-refresh endpoint.

Update seeder calls:
```csharp
// Remove:
await EmployeeDepartmentSeeder.SeedAsync(context);
await DepartmentEmployeeSeeder.SeedAsync(context);

// Add:
await LocationSeeder.SeedAsync(context);

// Keep:
await ResourceWorkflowSeeder.SeedAsync(context);
await SharedFolderSeeder.SeedAsync(context);
await InternetResourceSeeder.SeedAsync(context);
await UserSeeder.SeedAsync(context);
```

- [ ] **Step 4: Final build check**

```bash
cd NAFServer
dotnet build
```

All errors should be gone.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add LocationSeeder, update UserSeeder to query vw_Employees, update Program.cs registrations"
```

---

## Task 15: EF Core Migration

**Files:**
- Migration files auto-generated under `NAFServer/Migrations/`

- [ ] **Step 1: Add migration**

```bash
cd NAFServer
dotnet ef migrations add ViewRestructure_DropDeptUserLocUserDept_AddAllowance
```

- [ ] **Step 2: Review the migration**

Open the generated migration file. Verify it:
- Drops tables: `Departments`, `UserLocations`, `UserDepartments`, `DepartmentEmployees`
- Adds column `AllowWeekendDateNeeded` to `Locations`
- Changes `DepartmentId` on `NAFs` from `int` to `nvarchar` (or similar string type)
- Creates `ResourceRequestAllowances` table with unique index on `(ResourceId, LocationId)`
- Does NOT modify `Employees` table (it's now a view, not tracked by EF migrations)

If EF still tries to create/modify an `Employees` table, it means the keyless view configuration was not picked up. Verify `AppDbContext` has `HasNoKey().ToView("vw_Employees")` and no `Employee` entity has a primary key defined.

- [ ] **Step 3: Apply migration**

```bash
dotnet ef database update
```

- [ ] **Step 4: Start server and verify**

```bash
dotnet run
```

Hit `GET /api/employees/search/a` — should return employees from the view. If the views don't exist in the DB yet, the cache will log an error but the server should still start.

- [ ] **Step 5: Commit**

```bash
git add NAFServer/Migrations/
git commit -m "feat: migration — drop Dept/UserLoc/UserDept tables, add ResourceRequestAllowances, NAF.DepartmentId string"
```

---

## Task 16: Frontend — Update TypeScript Types

**Files:**
- Modify: `NAFClient/src/shared/types/api/employee.ts`
- Create: `NAFClient/src/shared/types/api/resourceRequestAllowance.ts`
- Modify: `NAFClient/src/shared/types/api/location.ts` (add `allowWeekendDateNeeded`)

- [ ] **Step 1: Update employee.ts**

Find `NAFClient/src/shared/types/api/employee.ts`. Update the Employee type:

```typescript
export type Employee = {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  status: string;
  company?: string;
  position?: string;
  location?: string;
  supervisorId?: string;
  departmentId: string;
  departmentDesc: string;
  departmentHead: string;
};
```

Remove: `departmentHeadId`, `hiredDate`, `regularizedDate`, `separatedDate`.

- [ ] **Step 2: Update location type — add allowWeekendDateNeeded**

Find or create `NAFClient/src/shared/types/api/location.ts`:

```typescript
export type Location = {
  id: number;
  name: string;
  isActive: boolean;
  allowWeekendDateNeeded: boolean;
};
```

- [ ] **Step 3: Create resourceRequestAllowance.ts**

```typescript
export type ResourceRequestAllowance = {
  id: number;
  resourceId: number;
  resourceName: string;
  locationId: number;
  locationName: string;
  allowanceDays: number;
};

export type CreateResourceRequestAllowanceDTO = {
  resourceId: number;
  locationId: number;
  allowanceDays: number;
};

export type UpdateResourceRequestAllowanceDTO = {
  allowanceDays: number;
};
```

- [ ] **Step 4: Fix type errors from removed fields**

Search for `departmentHeadId` across the frontend:

```bash
cd NAFClient
grep -r "departmentHeadId" src/
```

For each occurrence: replace with `departmentHead` (the full name string). Update any display logic that was resolving a name from the ID — now just display the string directly.

- [ ] **Step 5: Commit**

```bash
cd NAFClient
git add src/shared/types/
git commit -m "feat: update Employee type for view columns, add ResourceRequestAllowance type, update Location type"
```

---

## Task 17: Frontend — Resource Request Date Picker Constraints

**Files:**
- Modify: `NAFClient/src/features/naf/components/resource-request/ResourceRequestContent.tsx`

The date picker for `DateNeeded` must disable:
1. Dates before `today + allowanceDays` (fetched per resource + NAF location)
2. Weekends, if `!location.allowWeekendDateNeeded`

- [ ] **Step 1: Create resourceAllowanceService.ts**

Create `NAFClient/src/services/EntityAPI/resourceAllowanceService.ts`:

```typescript
import api from "../api";
import type { ResourceRequestAllowance, CreateResourceRequestAllowanceDTO, UpdateResourceRequestAllowanceDTO } from "../../shared/types/api/resourceRequestAllowance";

export const resourceAllowanceService = {
  getAll: () =>
    api.get<ResourceRequestAllowance[]>("/admin/resource-allowances").then(r => r.data),

  getById: (id: number) =>
    api.get<ResourceRequestAllowance>(`/admin/resource-allowances/${id}`).then(r => r.data),

  create: (dto: CreateResourceRequestAllowanceDTO) =>
    api.post<ResourceRequestAllowance>("/admin/resource-allowances", dto).then(r => r.data),

  update: (id: number, dto: UpdateResourceRequestAllowanceDTO) =>
    api.put<ResourceRequestAllowance>(`/admin/resource-allowances/${id}`, dto).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/admin/resource-allowances/${id}`),

  getForResourceAndLocation: (resourceId: number, locationId: number) =>
    api.get<ResourceRequestAllowance[]>("/admin/resource-allowances")
      .then(r => r.data.find(a => a.resourceId === resourceId && a.locationId === locationId) ?? null),
};
```

- [ ] **Step 2: Update date picker in ResourceRequestContent.tsx**

Open `NAFClient/src/features/naf/components/resource-request/ResourceRequestContent.tsx`.

Add a `disabledDates` function based on the NAF's location allowance. The component receives the NAF (which has `locationId`). Fetch the allowance for the selected resource + locationId using a query. Pass a `disabled` predicate to the date picker:

```typescript
const isDateDisabled = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Weekend check
  if (location && !location.allowWeekendDateNeeded) {
    const dow = date.getDay();
    if (dow === 0 || dow === 6) return true;
  }

  // Allowance days check
  if (allowance) {
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + allowance.allowanceDays);
    if (date < minDate) return true;
  }

  return false;
};
```

Pass `isDateDisabled` to the `DatePicker` or `Calendar` component's `disabled` prop (the exact prop name depends on which ShadCN component is used — check the existing usage).

Add a React Query hook to fetch the allowance when the resourceId is selected:

```typescript
const { data: allowance } = useQuery({
  queryKey: ["resource-allowance", resourceId, naf.locationId],
  queryFn: () => resourceAllowanceService.getForResourceAndLocation(resourceId, naf.locationId),
  enabled: !!resourceId,
});
```

Also fetch the location to check `allowWeekendDateNeeded`:

```typescript
const { data: location } = useQuery({
  queryKey: ["location", naf.locationId],
  queryFn: () => locationService.getById(naf.locationId),
});
```

- [ ] **Step 3: TypeScript check**

```bash
cd NAFClient
npm run build
```

Fix any type errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/naf/components/resource-request/ResourceRequestContent.tsx src/services/EntityAPI/resourceAllowanceService.ts
git commit -m "feat: disable invalid DateNeeded dates in resource request form based on allowance + location weekend rule"
```

---

## Task 18: Frontend — Admin UI for ResourceRequestAllowance + Cache Refresh

**Files:**
- Create: `NAFClient/src/features/admin/hooks/useResourceAllowance.ts`
- Create: `NAFClient/src/features/admin/components/ResourceAllowanceManager.tsx`
- Modify: `NAFClient/src/features/admin/pages/AdminHomePage.tsx`

- [ ] **Step 1: Create useResourceAllowance.ts**

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resourceAllowanceService } from "../../../services/EntityAPI/resourceAllowanceService";
import type { CreateResourceRequestAllowanceDTO, UpdateResourceRequestAllowanceDTO } from "../../../shared/types/api/resourceRequestAllowance";
import api from "../../../services/api";

export const useResourceAllowances = () =>
  useQuery({
    queryKey: ["resource-allowances"],
    queryFn: resourceAllowanceService.getAll,
  });

export const useCreateAllowance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateResourceRequestAllowanceDTO) => resourceAllowanceService.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resource-allowances"] }),
  });
};

export const useUpdateAllowance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateResourceRequestAllowanceDTO }) =>
      resourceAllowanceService.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resource-allowances"] }),
  });
};

export const useDeleteAllowance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => resourceAllowanceService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resource-allowances"] }),
  });
};

export const useRefreshCache = () =>
  useMutation({
    mutationFn: () => api.post("/admin/cache/refresh"),
  });
```

- [ ] **Step 2: Create ResourceAllowanceManager.tsx**

Create a table-based admin component showing all allowances with Create / Edit (allowanceDays) / Delete actions:

```tsx
import { useCreateAllowance, useDeleteAllowance, useResourceAllowances, useUpdateAllowance } from "../hooks/useResourceAllowance";
import { Button } from "../../../components/ui/button";
import { useState } from "react";
import type { CreateResourceRequestAllowanceDTO } from "../../../shared/types/api/resourceRequestAllowance";

export function ResourceAllowanceManager() {
  const { data: allowances = [], isLoading } = useResourceAllowances();
  const createMutation = useCreateAllowance();
  const updateMutation = useUpdateAllowance();
  const deleteMutation = useDeleteAllowance();

  const [form, setForm] = useState<CreateResourceRequestAllowanceDTO>({
    resourceId: 0,
    locationId: 0,
    allowanceDays: 0,
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Resource Request Allowances</h2>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Resource</th>
            <th className="text-left p-2">Location</th>
            <th className="text-left p-2">Min Days</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {allowances.map(a => (
            <tr key={a.id} className="border-b hover:bg-muted/40">
              <td className="p-2">{a.resourceName}</td>
              <td className="p-2">{a.locationName}</td>
              <td className="p-2">{a.allowanceDays}</td>
              <td className="p-2 flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const days = parseInt(prompt("New allowance days:", String(a.allowanceDays)) ?? "", 10);
                    if (!isNaN(days)) updateMutation.mutate({ id: a.id, dto: { allowanceDays: days } });
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(a.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-2 items-end">
        <div>
          <label className="text-xs text-muted-foreground">Resource ID</label>
          <input
            type="number"
            className="border rounded px-2 py-1 w-24"
            value={form.resourceId}
            onChange={e => setForm(f => ({ ...f, resourceId: +e.target.value }))}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Location ID</label>
          <input
            type="number"
            className="border rounded px-2 py-1 w-24"
            value={form.locationId}
            onChange={e => setForm(f => ({ ...f, locationId: +e.target.value }))}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Min Days</label>
          <input
            type="number"
            className="border rounded px-2 py-1 w-20"
            value={form.allowanceDays}
            onChange={e => setForm(f => ({ ...f, allowanceDays: +e.target.value }))}
          />
        </div>
        <Button onClick={() => createMutation.mutate(form)}>Add</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add ResourceAllowanceManager + cache refresh button to AdminHomePage.tsx**

Open `NAFClient/src/features/admin/pages/AdminHomePage.tsx`.

Remove any department or user-location management sections.

Add import and render `<ResourceAllowanceManager />` in an appropriate section.

Add a cache refresh button near the top of the page:

```tsx
import { useRefreshCache } from "../hooks/useResourceAllowance";

// Inside the component:
const refreshCache = useRefreshCache();

// In JSX:
<Button
  variant="outline"
  onClick={() => refreshCache.mutate()}
  disabled={refreshCache.isPending}
>
  {refreshCache.isPending ? "Refreshing..." : "Refresh Employee Cache"}
</Button>
```

- [ ] **Step 4: TypeScript check**

```bash
cd NAFClient
npm run build
```

Fix any type errors.

- [ ] **Step 5: Add Location weekend toggle to admin**

In the admin location management section (wherever locations are listed for admins), add a toggle button per location:

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../services/api";

const useToggleLocationWeekend = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, allow }: { id: number; allow: boolean }) =>
      api.put(`/admin/locations/${id}/weekend`, allow),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
  });
};
```

Display each location with its `allowWeekendDateNeeded` state and a toggle button that calls `PUT /api/admin/locations/{id}/weekend`.

- [ ] **Step 6: Remove location picker from NAF creation dialog**

Find the NAF creation dialog (likely `NAFClient/src/features/naf/components/createNAFDialog.tsx` or similar). Remove any `locationId` input/select from the form — the server now derives it from the employee. Remove the related state, query, and DTO field.

- [ ] **Step 7: TypeScript check**

```bash
cd NAFClient
npm run build
```

Fix any type errors.

- [ ] **Step 8: Commit**

```bash
git add src/features/admin/
git commit -m "feat: add ResourceAllowanceManager admin UI, location weekend toggle, and cache refresh button"
```

---

## Task 19: Final Build + Smoke Test

- [ ] **Step 1: Full server build**

```bash
cd NAFServer
dotnet build
```

Expected: 0 errors.

- [ ] **Step 2: Full client build**

```bash
cd NAFClient
npm run build
```

Expected: 0 errors.

- [ ] **Step 3: Start both servers**

Terminal 1:
```bash
cd NAFServer
dotnet run
```

Terminal 2:
```bash
cd NAFClient
npm run dev
```

- [ ] **Step 4: Smoke test checklist**

- [ ] `GET /api/employees/search/a` returns employees from the view
- [ ] NAF creation no longer requires location selection — created NAF has correct `locationId`
- [ ] `POST /api/admin/resource-allowances` creates an allowance record
- [ ] Creating a resource request with `DateNeeded` too early returns `400`
- [ ] Creating on a weekend returns `400` if `AllowWeekendDateNeeded = false`
- [ ] `POST /api/admin/cache/refresh` returns `204`
- [ ] Admin page shows `ResourceAllowanceManager` and cache refresh button
- [ ] Date picker in resource request form disables invalid dates

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: employee/department view restructure complete"
```
