# Department Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full department management section to the admin panel — list/create departments, manage HR employee assignments, and view/create NAFs per employee.

**Architecture:** New `DepartmentEmployee` entity (mirrors `UserDepartment`) stored in the app DB tracks which HR employees are assigned to each department. A new `DepartmentsController` at `/api/admin/departments` (ADMIN role) handles all department and employee assignment operations. Frontend gets a new `features/admin/departments/` folder following the exact pattern of the existing Users/NAFs admin pages.

**Tech Stack:** ASP.NET Core 8, EF Core, SQL Server, React 19 + TypeScript, Vite, TanStack Query v5, Tailwind CSS v4, ShadCN

---

## File Map

### Backend — new files
| File | Responsibility |
|------|---------------|
| `NAFServer/src/Domain/Entities/DepartmentEmployee.cs` | New entity — HR employee ↔ department assignment |
| `NAFServer/src/Domain/Interface/Repository/IDepartmentEmployeeRepository.cs` | Repository contract |
| `NAFServer/src/Infrastructure/Persistence/Repositories/DepartmentEmployeeRepository.cs` | EF Core implementation |
| `NAFServer/src/Application/Interfaces/IDepartmentEmployeeService.cs` | Service contract |
| `NAFServer/src/Application/Services/DepartmentEmployeeService.cs` | Business logic — enrich with SP + NAF lookup |
| `NAFServer/src/Application/DTOs/Department/DepartmentDetailDTO.cs` | Department + head full name/position |
| `NAFServer/src/Application/DTOs/Department/DepartmentEmployeeDTO.cs` | Employee + nullable NAF info |
| `NAFServer/src/Application/DTOs/Department/AddDepartmentEmployeeDTO.cs` | Input DTO for adding employee |
| `NAFServer/src/API/Controllers/DepartmentsController.cs` | All `/api/admin/departments` endpoints |

### Backend — modified files
| File | Change |
|------|--------|
| `NAFServer/src/Infrastructure/Persistence/AppDbContext.cs` | Add `DbSet<DepartmentEmployee>` |
| `NAFServer/src/Infrastructure/Persistence/Repositories/DepartmentRepository.cs` | Fix `RemoveAsync` bug; add location filter to `GetAllAsync`; include navigation properties |
| `NAFServer/src/Application/Services/DepartmentService.cs` | Implement `CreateDepartmentAsync`; add location-filtered `GetAllDepartmentsAsync` |
| `NAFServer/src/Application/Interfaces/IDepartmentService.cs` | Add `GetAllDepartmentsAsync(int? locationId)` overload |
| `NAFServer/src/Infrastructure/Persistence/Repositories/EmployeeRepository.cs` | Add transition comment block |
| `NAFServer/Program.cs` | Register `IDepartmentEmployeeRepository`, `IDepartmentEmployeeService` |

### Frontend — new files
| File | Responsibility |
|------|---------------|
| `NAFClient/src/features/admin/departments/api.ts` | Axios calls to `/api/admin/departments` |
| `NAFClient/src/features/admin/departments/types.ts` | `DepartmentDTO`, `DepartmentDetailDTO`, `DepartmentEmployeeDTO`, `CreateDepartmentDTO` |
| `NAFClient/src/features/admin/departments/hooks/useDepartments.ts` | React Query: list, detail, create, change head, set inactive |
| `NAFClient/src/features/admin/departments/hooks/useDepartmentEmployees.ts` | React Query: employees list, add, remove |
| `NAFClient/src/features/admin/departments/components/AddDepartmentDialog.tsx` | Dialog to create a department |
| `NAFClient/src/features/admin/departments/components/ChangeDepartmentHeadDialog.tsx` | Dialog to change head via employee search |
| `NAFClient/src/features/admin/departments/components/AddDepartmentEmployeeDialog.tsx` | Dialog to add employee via search |
| `NAFClient/src/features/admin/departments/components/DepartmentEmployeeTable.tsx` | Table with View NAF / Create NAF actions |
| `NAFClient/src/features/admin/departments/pages/DepartmentListPage.tsx` | List page with location filter |
| `NAFClient/src/features/admin/departments/pages/DepartmentDetailPage.tsx` | Detail page with all operations |

### Frontend — modified files
| File | Change |
|------|--------|
| `NAFClient/src/app/routesEnum.ts` | Add `ADMIN_DEPARTMENTS`, `ADMIN_DEPARTMENT_DETAIL` |
| `NAFClient/src/app/router.tsx` | Add two new lazy routes |
| `NAFClient/src/shared/components/layout/AdminLayout.tsx` | Add Departments nav item |
| `NAFClient/src/features/naf/components/createNAFDialog.tsx` | Add optional `initialEmployee` prop |

---

## Task 1: Fix DepartmentRepository bugs + add navigation includes

**Files:**
- Modify: `NAFServer/src/Infrastructure/Persistence/Repositories/DepartmentRepository.cs`

There are two bugs and a missing include:
1. `RemoveAsync` sets to inactive then throws (the throw is a copy-paste error).
2. `GetAllAsync` and `GetByIdAsync` don't include `DepartmentHead` or `Location` navigation properties, so the mapper always gets empty strings.

- [ ] **Step 1: Fix the repository**

Replace the entire file content:

```csharp
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.Department;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class DepartmentRepository : IDepartmentRepository
    {
        private readonly AppDbContext _context;

        public DepartmentRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Department> AddAsync(CreateDepartmentDTO department)
        {
            var dept = await _context.Departments.FirstOrDefaultAsync(d => d.Code == department.Code);
            if (dept != null)
                throw new InvalidOperationException("Department already exists.");

            var entry = await _context.Departments.AddAsync(
                new Department(department.Code, department.Name, department.DepartmentHeadId, department.LocationId));

            await _context.SaveChangesAsync();
            return entry.Entity;
        }

        public async Task RemoveAsync(string code)
        {
            var dept = await _context.Departments.FirstOrDefaultAsync(d => d.Code == code);
            if (dept == null)
                throw new InvalidOperationException("Department doesn't exist.");

            dept.SetToInactive();
            await _context.SaveChangesAsync();
        }

        public async Task<List<Department>> GetAllAsync(int? locationId = null)
        {
            var query = _context.Departments
                .Include(d => d.DepartmentHead)
                .Include(d => d.Location)
                .AsQueryable();

            if (locationId.HasValue)
                query = query.Where(d => d.LocationId == locationId.Value);

            return await query.AsNoTracking().ToListAsync();
        }

        public async Task<Department?> GetByIdAsync(int id)
        {
            return await _context.Departments
                .Include(d => d.DepartmentHead)
                .Include(d => d.Location)
                .FirstOrDefaultAsync(d => d.Id == id)
                ?? throw new KeyNotFoundException("No department found");
        }

        public async Task<Department> GetByCodeAsync(string code)
        {
            return await _context.Departments
                .Include(d => d.DepartmentHead)
                .Include(d => d.Location)
                .FirstOrDefaultAsync(d => d.Code == code)
                ?? throw new KeyNotFoundException("No department found");
        }

        public async Task<Department> SetDepartmentHeadAsync(string departmentCode, string employeeNumber)
        {
            var department = await _context.Departments
                .Include(d => d.DepartmentHead)
                .Include(d => d.Location)
                .FirstOrDefaultAsync(d => d.Code == departmentCode);

            if (department == null)
                throw new KeyNotFoundException($"Department {departmentCode} not found");

            department.SetDepartmentHead(employeeNumber);
            await _context.SaveChangesAsync();
            return department;
        }

        public async Task<Department> SetLocationAsync(string departmentCode, int locationId)
        {
            var department = await _context.Departments
                .Include(d => d.DepartmentHead)
                .Include(d => d.Location)
                .FirstOrDefaultAsync(d => d.Code == departmentCode);

            if (department == null)
                throw new KeyNotFoundException($"Department {departmentCode} not found");

            department.SetLocation(locationId);
            await _context.SaveChangesAsync();
            return department;
        }
    }
}
```

- [ ] **Step 2: Update IDepartmentRepository to match new signature**

Replace `NAFServer/src/Domain/Interface/Repository/IDepartmentRepository.cs`:

```csharp
using NAFServer.src.Application.DTOs.Department;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IDepartmentRepository
    {
        Task<Department?> GetByIdAsync(int id);
        Task<Department> GetByCodeAsync(string departmentCode);
        Task<List<Department>> GetAllAsync(int? locationId = null);
        Task<Department> AddAsync(CreateDepartmentDTO department);
        Task RemoveAsync(string code);
        Task<Department> SetDepartmentHeadAsync(string departmentCode, string employeeNumber);
        Task<Department> SetLocationAsync(string departmentCode, int locationId);
    }
}
```

- [ ] **Step 3: Build to verify no compile errors**

```bash
cd NAFServer && dotnet build
```
Expected: Build succeeded, 0 error(s).

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Infrastructure/Persistence/Repositories/DepartmentRepository.cs
git add NAFServer/src/Domain/Interface/Repository/IDepartmentRepository.cs
git commit -m "fix(departments): fix RemoveAsync bug, add navigation includes, add location filter"
```

---

## Task 2: Update IDepartmentService + DepartmentService

**Files:**
- Modify: `NAFServer/src/Application/Interfaces/IDepartmentService.cs`
- Modify: `NAFServer/src/Application/Services/DepartmentService.cs`

- [ ] **Step 1: Update the service interface**

Replace `NAFServer/src/Application/Interfaces/IDepartmentService.cs`:

```csharp
using NAFServer.src.Application.DTOs.Department;

namespace NAFServer.src.Application.Interfaces
{
    public interface IDepartmentService
    {
        Task<List<DepartmentDTO>> GetAllDepartmentsAsync(int? locationId = null);
        Task<DepartmentDTO> GetDepartmentByIdAsync(int departmentId);
        Task<DepartmentDTO> GetDepartmentByCodeAsync(string code);
        Task<DepartmentDTO> CreateDepartmentAsync(CreateDepartmentDTO req);
        Task RemoveDepartment(string code);
        Task<DepartmentDTO> SetDepartmentHeadAsync(string code, string employeeNumber);
        Task<DepartmentDTO> SetLocationAsync(string code, int locationId);
    }
}
```

- [ ] **Step 2: Implement DepartmentService**

Replace `NAFServer/src/Application/Services/DepartmentService.cs`:

```csharp
using NAFServer.src.Application.DTOs.Department;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Mapper;

namespace NAFServer.src.Application.Services
{
    public class DepartmentService : IDepartmentService
    {
        private readonly IDepartmentRepository _departmentRepository;

        public DepartmentService(IDepartmentRepository departmentRepository)
        {
            _departmentRepository = departmentRepository;
        }

        public async Task<DepartmentDTO> CreateDepartmentAsync(CreateDepartmentDTO req)
        {
            var department = await _departmentRepository.AddAsync(req);
            return DepartmentMapper.ToDTO(department);
        }

        public async Task<List<DepartmentDTO>> GetAllDepartmentsAsync(int? locationId = null)
        {
            return DepartmentMapper.ListToDTO(await _departmentRepository.GetAllAsync(locationId));
        }

        public async Task<DepartmentDTO> GetDepartmentByCodeAsync(string code)
        {
            return DepartmentMapper.ToDTO(await _departmentRepository.GetByCodeAsync(code));
        }

        public async Task<DepartmentDTO> GetDepartmentByIdAsync(int departmentId)
        {
            return DepartmentMapper.ToDTO(await _departmentRepository.GetByIdAsync(departmentId));
        }

        public async Task RemoveDepartment(string code)
        {
            await _departmentRepository.RemoveAsync(code);
        }

        public async Task<DepartmentDTO> SetDepartmentHeadAsync(string code, string employeeNumber)
        {
            return DepartmentMapper.ToDTO(await _departmentRepository.SetDepartmentHeadAsync(code, employeeNumber));
        }

        public async Task<DepartmentDTO> SetLocationAsync(string code, int locationId)
        {
            return DepartmentMapper.ToDTO(await _departmentRepository.SetLocationAsync(code, locationId));
        }
    }
}
```

- [ ] **Step 3: Build**

```bash
cd NAFServer && dotnet build
```
Expected: Build succeeded, 0 error(s).

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Application/Interfaces/IDepartmentService.cs
git add NAFServer/src/Application/Services/DepartmentService.cs
git commit -m "feat(departments): implement CreateDepartmentAsync, add location filter to GetAll"
```

---

## Task 3: Add new DTOs

**Files:**
- Create: `NAFServer/src/Application/DTOs/Department/DepartmentDetailDTO.cs`
- Create: `NAFServer/src/Application/DTOs/Department/DepartmentEmployeeDTO.cs`
- Create: `NAFServer/src/Application/DTOs/Department/AddDepartmentEmployeeDTO.cs`

- [ ] **Step 1: Create DepartmentDetailDTO**

```csharp
namespace NAFServer.src.Application.DTOs.Department
{
    public record DepartmentDetailDTO(
        int Id,
        string Code,
        string Name,
        bool IsActive,
        string DepartmentHeadId,
        string DepartmentHeadName,
        string DepartmentHeadPosition,
        int LocationId,
        string Location
    );
}
```

- [ ] **Step 2: Create DepartmentEmployeeDTO**

```csharp
namespace NAFServer.src.Application.DTOs.Department
{
    public record DepartmentEmployeeDTO(
        string EmployeeId,
        string FirstName,
        string? MiddleName,
        string LastName,
        string Position,
        Guid? NafId,
        string? NafReference,
        string? NafProgress
    );
}
```

- [ ] **Step 3: Create AddDepartmentEmployeeDTO**

```csharp
namespace NAFServer.src.Application.DTOs.Department
{
    public record AddDepartmentEmployeeDTO(string EmployeeId);
}
```

- [ ] **Step 4: Build**

```bash
cd NAFServer && dotnet build
```
Expected: Build succeeded, 0 error(s).

- [ ] **Step 5: Commit**

```bash
git add NAFServer/src/Application/DTOs/Department/
git commit -m "feat(departments): add DepartmentDetailDTO, DepartmentEmployeeDTO, AddDepartmentEmployeeDTO"
```

---

## Task 4: Create DepartmentEmployee entity + migration

**Files:**
- Create: `NAFServer/src/Domain/Entities/DepartmentEmployee.cs`
- Modify: `NAFServer/src/Infrastructure/Persistence/AppDbContext.cs`

- [ ] **Step 1: Create the entity**

```csharp
namespace NAFServer.src.Domain.Entities
{
    public class DepartmentEmployee
    {
        public int Id { get; set; }
        public int DepartmentId { get; set; }
        public string EmployeeId { get; set; }
        public bool IsActive { get; set; }
        public DateTime DateAdded { get; set; }
        public DateTime? DateRemoved { get; set; }
        public Department Department { get; set; }

        private DepartmentEmployee() { }

        public DepartmentEmployee(int departmentId, string employeeId)
        {
            DepartmentId = departmentId;
            EmployeeId = employeeId;
            IsActive = true;
            DateAdded = DateTime.Now;
        }

        public DepartmentEmployee SetToInactive()
        {
            IsActive = false;
            DateRemoved = DateTime.Now;
            return this;
        }
    }
}
```

- [ ] **Step 2: Add DbSet to AppDbContext**

In `NAFServer/src/Infrastructure/Persistence/AppDbContext.cs`, add after the `UserDepartments` line:

```csharp
public DbSet<DepartmentEmployee> DepartmentEmployees { get; set; }
```

Also add the relationship config inside `OnModelCreating`, after the existing `UserDepartment` relationship block:

```csharp
modelBuilder.Entity<DepartmentEmployee>()
    .HasOne(de => de.Department)
    .WithMany()
    .HasForeignKey(de => de.DepartmentId)
    .OnDelete(DeleteBehavior.Cascade);
```

- [ ] **Step 3: Add EF migration**

```bash
cd NAFServer && dotnet ef migrations add AddDepartmentEmployee
```
Expected: A new migration file is created under `Migrations/`.

- [ ] **Step 4: Apply migration**

```bash
cd NAFServer && dotnet ef database update
```
Expected: "Done." with no errors.

- [ ] **Step 5: Build**

```bash
cd NAFServer && dotnet build
```
Expected: Build succeeded, 0 error(s).

- [ ] **Step 6: Commit**

```bash
git add NAFServer/src/Domain/Entities/DepartmentEmployee.cs
git add NAFServer/src/Infrastructure/Persistence/AppDbContext.cs
git add NAFServer/src/Infrastructure/Persistence/Migrations/
git commit -m "feat(departments): add DepartmentEmployee entity and EF migration"
```

---

## Task 5: Create DepartmentEmployee repository

**Files:**
- Create: `NAFServer/src/Domain/Interface/Repository/IDepartmentEmployeeRepository.cs`
- Create: `NAFServer/src/Infrastructure/Persistence/Repositories/DepartmentEmployeeRepository.cs`

- [ ] **Step 1: Create the interface**

```csharp
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IDepartmentEmployeeRepository
    {
        Task<List<DepartmentEmployee>> GetActiveByDepartmentAsync(int departmentId);
        Task<DepartmentEmployee?> GetActiveAsync(int departmentId, string employeeId);
        Task<DepartmentEmployee> AddAsync(int departmentId, string employeeId);
        Task RemoveAsync(int departmentId, string employeeId);
    }
}
```

- [ ] **Step 2: Create the implementation**

```csharp
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class DepartmentEmployeeRepository : IDepartmentEmployeeRepository
    {
        private readonly AppDbContext _context;

        public DepartmentEmployeeRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<DepartmentEmployee>> GetActiveByDepartmentAsync(int departmentId)
        {
            return await _context.DepartmentEmployees
                .Where(de => de.DepartmentId == departmentId && de.IsActive)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<DepartmentEmployee?> GetActiveAsync(int departmentId, string employeeId)
        {
            return await _context.DepartmentEmployees
                .FirstOrDefaultAsync(de => de.DepartmentId == departmentId
                    && de.EmployeeId == employeeId
                    && de.IsActive);
        }

        public async Task<DepartmentEmployee> AddAsync(int departmentId, string employeeId)
        {
            var existing = await GetActiveAsync(departmentId, employeeId);
            if (existing != null)
                throw new InvalidOperationException("Employee is already in this department.");

            var entry = await _context.DepartmentEmployees.AddAsync(
                new DepartmentEmployee(departmentId, employeeId));
            await _context.SaveChangesAsync();
            return entry.Entity;
        }

        public async Task RemoveAsync(int departmentId, string employeeId)
        {
            var record = await GetActiveAsync(departmentId, employeeId);
            if (record == null)
                throw new KeyNotFoundException("Employee assignment not found.");

            record.SetToInactive();
            await _context.SaveChangesAsync();
        }
    }
}
```

- [ ] **Step 3: Build**

```bash
cd NAFServer && dotnet build
```
Expected: Build succeeded, 0 error(s).

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Domain/Interface/Repository/IDepartmentEmployeeRepository.cs
git add NAFServer/src/Infrastructure/Persistence/Repositories/DepartmentEmployeeRepository.cs
git commit -m "feat(departments): add IDepartmentEmployeeRepository and implementation"
```

---

## Task 6: Create DepartmentEmployee service

**Files:**
- Create: `NAFServer/src/Application/Interfaces/IDepartmentEmployeeService.cs`
- Create: `NAFServer/src/Application/Services/DepartmentEmployeeService.cs`

- [ ] **Step 1: Create the interface**

```csharp
using NAFServer.src.Application.DTOs.Department;

namespace NAFServer.src.Application.Interfaces
{
    public interface IDepartmentEmployeeService
    {
        Task<List<DepartmentEmployeeDTO>> GetDepartmentEmployeesAsync(int departmentId);
        Task AddEmployeeToDepartmentAsync(int departmentId, string employeeId);
        Task RemoveEmployeeFromDepartmentAsync(int departmentId, string employeeId);
    }
}
```

- [ ] **Step 2: Create the service**

This service fetches `DepartmentEmployee` records, enriches each with employee details from the `EmployeeRepository` (SP-based + cached), and checks the NAF table for each employee.

```csharp
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.Department;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Application.Services
{
    public class DepartmentEmployeeService : IDepartmentEmployeeService
    {
        private readonly IDepartmentEmployeeRepository _departmentEmployeeRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly AppDbContext _context;

        public DepartmentEmployeeService(
            IDepartmentEmployeeRepository departmentEmployeeRepository,
            IEmployeeRepository employeeRepository,
            AppDbContext context)
        {
            _departmentEmployeeRepository = departmentEmployeeRepository;
            _employeeRepository = employeeRepository;
            _context = context;
        }

        public async Task<List<DepartmentEmployeeDTO>> GetDepartmentEmployeesAsync(int departmentId)
        {
            var assignments = await _departmentEmployeeRepository.GetActiveByDepartmentAsync(departmentId);

            var result = new List<DepartmentEmployeeDTO>();
            foreach (var assignment in assignments)
            {
                var employee = await _employeeRepository.GetByIdAsync(assignment.EmployeeId);
                if (employee == null) continue;

                var naf = await _context.NAFs
                    .Where(n => n.EmployeeId == assignment.EmployeeId)
                    .Select(n => new { n.Id, n.Reference, n.Progress })
                    .FirstOrDefaultAsync();

                result.Add(new DepartmentEmployeeDTO(
                    employee.Id,
                    employee.FirstName,
                    employee.MiddleName,
                    employee.LastName,
                    employee.Position,
                    naf?.Id,
                    naf?.Reference,
                    naf?.Progress.ToString()
                ));
            }

            return result;
        }

        public async Task AddEmployeeToDepartmentAsync(int departmentId, string employeeId)
        {
            var employee = await _employeeRepository.GetByIdAsync(employeeId);
            if (employee == null)
                throw new KeyNotFoundException($"Employee {employeeId} not found.");

            await _departmentEmployeeRepository.AddAsync(departmentId, employeeId);
        }

        public async Task RemoveEmployeeFromDepartmentAsync(int departmentId, string employeeId)
        {
            await _departmentEmployeeRepository.RemoveAsync(departmentId, employeeId);
        }
    }
}
```

- [ ] **Step 3: Build**

```bash
cd NAFServer && dotnet build
```
Expected: Build succeeded, 0 error(s).

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Application/Interfaces/IDepartmentEmployeeService.cs
git add NAFServer/src/Application/Services/DepartmentEmployeeService.cs
git commit -m "feat(departments): add IDepartmentEmployeeService and implementation"
```

---

## Task 7: Add EmployeeRepository transition comment

**Files:**
- Modify: `NAFServer/src/Infrastructure/Persistence/Repositories/EmployeeRepository.cs`

- [ ] **Step 1: Add comment block at the end of the class**

After the closing brace of `SearchEmployee`, before the class closing brace, add:

```csharp
        // FUTURE: When transitioning from stored procedures to a local DB view,
        // replace the SP-based methods above with EF queries against the view.
        // Example for fetching employees by department:
        //
        // public async Task<List<Employee>> GetByDepartmentAsync(string departmentCode)
        // {
        //     return await _context.Employees
        //         .FromSqlRaw(
        //             "SELECT * FROM vw_DepartmentEmployees WHERE DepartmentCode = {0}",
        //             departmentCode)
        //         .ToListAsync();
        // }
        //
        // Also update GetByIdAsync and SearchEmployee to query the Employees table
        // (or view) directly instead of calling stored procedures.
```

- [ ] **Step 2: Commit**

```bash
git add NAFServer/src/Infrastructure/Persistence/Repositories/EmployeeRepository.cs
git commit -m "chore(employees): add view-transition comment for future local DB migration"
```

---

## Task 8: Create DepartmentsController + register services

**Files:**
- Create: `NAFServer/src/API/Controllers/DepartmentsController.cs`
- Modify: `NAFServer/Program.cs`

- [ ] **Step 1: Create the controller**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.Department;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.API.Controllers
{
    [Route("api/admin/departments")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class DepartmentsController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;
        private readonly IDepartmentEmployeeService _departmentEmployeeService;
        private readonly IEmployeeRepository _employeeRepository;

        public DepartmentsController(
            IDepartmentService departmentService,
            IDepartmentEmployeeService departmentEmployeeService,
            IEmployeeRepository employeeRepository)
        {
            _departmentService = departmentService;
            _departmentEmployeeService = departmentEmployeeService;
            _employeeRepository = employeeRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? locationId)
        {
            return Ok(await _departmentService.GetAllDepartmentsAsync(locationId));
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var dept = await _departmentService.GetDepartmentByIdAsync(id);
                var head = dept.DepartmentHeadId != null
                    ? await _employeeRepository.GetByIdAsync(dept.DepartmentHeadId)
                    : null;

                return Ok(new DepartmentDetailDTO(
                    dept.Id,
                    dept.Code,
                    dept.Name,
                    dept.IsActive,
                    dept.DepartmentHeadId,
                    head != null ? $"{head.FirstName} {head.LastName}" : "",
                    head?.Position ?? "",
                    dept.LocationId,
                    dept.Location
                ));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDepartmentDTO dto)
        {
            try
            {
                var dept = await _departmentService.CreateDepartmentAsync(dto);
                return Created("", dept);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPut("{id:int}/head")]
        public async Task<IActionResult> ChangeHead(int id, [FromBody] string employeeId)
        {
            try
            {
                var dept = await _departmentService.GetDepartmentByIdAsync(id);
                var updated = await _departmentService.SetDepartmentHeadAsync(dept.Code, employeeId);
                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPut("{id:int}/inactive")]
        public async Task<IActionResult> SetInactive(int id)
        {
            try
            {
                var dept = await _departmentService.GetDepartmentByIdAsync(id);
                await _departmentService.RemoveDepartment(dept.Code);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("{id:int}/employees")]
        public async Task<IActionResult> GetEmployees(int id)
        {
            return Ok(await _departmentEmployeeService.GetDepartmentEmployeesAsync(id));
        }

        [HttpPost("{id:int}/employees")]
        public async Task<IActionResult> AddEmployee(int id, [FromBody] AddDepartmentEmployeeDTO dto)
        {
            try
            {
                await _departmentEmployeeService.AddEmployeeToDepartmentAsync(id, dto.EmployeeId);
                return Created("", null);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("{id:int}/employees/{employeeId}")]
        public async Task<IActionResult> RemoveEmployee(int id, string employeeId)
        {
            try
            {
                await _departmentEmployeeService.RemoveEmployeeFromDepartmentAsync(id, employeeId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}
```

- [ ] **Step 2: Register services in Program.cs**

After the line `builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();` in `NAFServer/Program.cs`, add:

```csharp
builder.Services.AddScoped<IDepartmentEmployeeRepository, DepartmentEmployeeRepository>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IDepartmentEmployeeService, DepartmentEmployeeService>();
```

Note: Check if `IDepartmentService` / `DepartmentService` is already registered in Program.cs. If not, add it. If it is, skip that line.

- [ ] **Step 3: Build**

```bash
cd NAFServer && dotnet build
```
Expected: Build succeeded, 0 error(s).

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/API/Controllers/DepartmentsController.cs
git add NAFServer/Program.cs
git commit -m "feat(departments): add DepartmentsController and register new services"
```

---

## Task 9: Frontend types + API layer

**Files:**
- Create: `NAFClient/src/features/admin/departments/types.ts`
- Create: `NAFClient/src/features/admin/departments/api.ts`

- [ ] **Step 1: Create types**

```typescript
export interface DepartmentDTO {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  departmentHeadId: string;
  locationId: number;
  location: string;
}

export interface DepartmentDetailDTO extends DepartmentDTO {
  departmentHeadName: string;
  departmentHeadPosition: string;
}

export interface DepartmentEmployeeDTO {
  employeeId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  position: string;
  nafId: string | null;
  nafReference: string | null;
  nafProgress: string | null;
}

export interface CreateDepartmentDTO {
  code: string;
  name: string;
  departmentHeadId: string;
  locationId: number;
}
```

- [ ] **Step 2: Create api.ts**

```typescript
import { api } from "@/shared/api/client";
import type {
  CreateDepartmentDTO,
  DepartmentDTO,
  DepartmentDetailDTO,
  DepartmentEmployeeDTO,
} from "./types";

export const departmentsApi = {
  getAll: (locationId?: number) =>
    api
      .get<DepartmentDTO[]>("/admin/departments", {
        params: locationId ? { locationId } : undefined,
      })
      .then((r) => r.data),

  getById: (id: number) =>
    api.get<DepartmentDetailDTO>(`/admin/departments/${id}`).then((r) => r.data),

  create: (data: CreateDepartmentDTO) =>
    api.post<DepartmentDTO>("/admin/departments", data).then((r) => r.data),

  changeHead: (id: number, employeeId: string) =>
    api
      .put<DepartmentDTO>(`/admin/departments/${id}/head`, JSON.stringify(employeeId))
      .then((r) => r.data),

  setInactive: (id: number) =>
    api.put(`/admin/departments/${id}/inactive`).then((r) => r.data),

  getEmployees: (id: number) =>
    api
      .get<DepartmentEmployeeDTO[]>(`/admin/departments/${id}/employees`)
      .then((r) => r.data),

  addEmployee: (id: number, employeeId: string) =>
    api
      .post(`/admin/departments/${id}/employees`, { employeeId })
      .then((r) => r.data),

  removeEmployee: (id: number, employeeId: string) =>
    api
      .delete(`/admin/departments/${id}/employees/${employeeId}`)
      .then((r) => r.data),
};
```

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/admin/departments/
git commit -m "feat(departments): add frontend types and API layer"
```

---

## Task 10: Frontend hooks

**Files:**
- Create: `NAFClient/src/features/admin/departments/hooks/useDepartments.ts`
- Create: `NAFClient/src/features/admin/departments/hooks/useDepartmentEmployees.ts`

- [ ] **Step 1: Create useDepartments.ts**

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentsApi } from "../api";
import type { CreateDepartmentDTO } from "../types";

export function useDepartments(locationId?: number) {
  return useQuery({
    queryKey: ["admin", "departments", locationId ?? "all"],
    queryFn: () => departmentsApi.getAll(locationId),
  });
}

export function useDepartmentDetail(id: number) {
  return useQuery({
    queryKey: ["admin", "departments", id],
    queryFn: () => departmentsApi.getById(id),
    enabled: !!id,
  });
}

export function useDepartmentMutations() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "departments"] });

  const createMutation = useMutation({
    mutationFn: (data: CreateDepartmentDTO) => departmentsApi.create(data),
    onSuccess: invalidate,
  });

  const changeHeadMutation = useMutation({
    mutationFn: ({ id, employeeId }: { id: number; employeeId: string }) =>
      departmentsApi.changeHead(id, employeeId),
    onSuccess: invalidate,
  });

  const setInactiveMutation = useMutation({
    mutationFn: (id: number) => departmentsApi.setInactive(id),
    onSuccess: invalidate,
  });

  return { createMutation, changeHeadMutation, setInactiveMutation };
}
```

- [ ] **Step 2: Create useDepartmentEmployees.ts**

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentsApi } from "../api";

export function useDepartmentEmployees(departmentId: number) {
  return useQuery({
    queryKey: ["admin", "departments", departmentId, "employees"],
    queryFn: () => departmentsApi.getEmployees(departmentId),
    enabled: !!departmentId,
  });
}

export function useDepartmentEmployeeMutations(departmentId: number) {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["admin", "departments", departmentId, "employees"],
    });

  const addMutation = useMutation({
    mutationFn: (employeeId: string) =>
      departmentsApi.addEmployee(departmentId, employeeId),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (employeeId: string) =>
      departmentsApi.removeEmployee(departmentId, employeeId),
    onSuccess: invalidate,
  });

  return { addMutation, removeMutation };
}
```

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/admin/departments/hooks/
git commit -m "feat(departments): add useDepartments and useDepartmentEmployees hooks"
```

---

## Task 11: Add routes + sidebar nav item

**Files:**
- Modify: `NAFClient/src/app/routesEnum.ts`
- Modify: `NAFClient/src/app/router.tsx`
- Modify: `NAFClient/src/shared/components/layout/AdminLayout.tsx`

- [ ] **Step 1: Add to routesEnum.ts**

After `ADMIN_RESOURCE_REQUESTS`, add:

```typescript
  ADMIN_DEPARTMENTS = "/admin/departments",
  ADMIN_DEPARTMENT_DETAIL = "/admin/departments/:departmentId",
```

- [ ] **Step 2: Add lazy imports + routes to router.tsx**

After the `AdminResourceRequestsPage` lazy import, add:

```typescript
const DepartmentListPage = lazy(
  () => import("@/features/admin/departments/pages/DepartmentListPage"),
);
const DepartmentDetailPage = lazy(
  () => import("@/features/admin/departments/pages/DepartmentDetailPage"),
);
```

After the `ADMIN_RESOURCE_REQUESTS` route block, add:

```tsx
<Route
  path={RoutesEnum.ADMIN_DEPARTMENTS}
  element={
    <ProtectedRoute requiredRole="ADMIN">
      <DepartmentListPage />
    </ProtectedRoute>
  }
/>
<Route
  path={RoutesEnum.ADMIN_DEPARTMENT_DETAIL}
  element={
    <ProtectedRoute requiredRole="ADMIN">
      <DepartmentDetailPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 3: Add Departments nav item to AdminLayout.tsx**

In `AdminLayout.tsx`, add `Building2` to the lucide-react import:

```typescript
import { Home, Users, FileText, ClipboardList, Box, Building2 } from "lucide-react";
```

Add to the `navItems` array after the Resources item:

```typescript
{ label: "Departments", icon: <Building2 className="w-5 h-5" />, href: "/admin/departments" },
```

- [ ] **Step 4: Build check**

```bash
cd NAFClient && npm run build
```
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add NAFClient/src/app/routesEnum.ts NAFClient/src/app/router.tsx NAFClient/src/shared/components/layout/AdminLayout.tsx
git commit -m "feat(departments): add routes and sidebar nav item"
```

---

## Task 12: AddDepartmentDialog component

**Files:**
- Create: `NAFClient/src/features/admin/departments/components/AddDepartmentDialog.tsx`

- [ ] **Step 1: Create the component**

This dialog follows the same employee-search pattern as the existing `UsersPage` "Add User" dialog. It uses a debounced employee ID search with `searchEmployees`.

```tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { searchEmployees } from "@/shared/api/employeeService";
import type { Employee } from "@/shared/types/api/employee";
import type { LocationDTO } from "@/features/admin/types";
import { useDepartmentMutations } from "../hooks/useDepartments";

interface Props {
  locations: LocationDTO[];
}

export function AddDepartmentDialog({ locations }: Props) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState(0);
  const [headId, setHeadId] = useState("");
  const [error, setError] = useState("");

  const [headLookup, setHeadLookup] = useState<{
    state: "idle" | "loading" | "found" | "not_found";
    employee: Employee | null;
  }>({ state: "idle", employee: null });

  const { createMutation } = useDepartmentMutations();

  useEffect(() => {
    if (!headId.trim()) {
      setHeadLookup({ state: "idle", employee: null });
      return;
    }
    const timer = setTimeout(async () => {
      setHeadLookup({ state: "loading", employee: null });
      try {
        const results = await searchEmployees(headId.trim());
        const match = results.find((e) => e.id === headId.trim());
        setHeadLookup(
          match
            ? { state: "found", employee: match }
            : { state: "not_found", employee: null },
        );
      } catch {
        setHeadLookup({ state: "not_found", employee: null });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [headId]);

  const reset = () => {
    setCode("");
    setName("");
    setLocationId(0);
    setHeadId("");
    setError("");
    setHeadLookup({ state: "idle", employee: null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (headLookup.state !== "found") {
      setError("Department head not found. Enter a valid employee ID.");
      return;
    }
    if (!locationId) {
      setError("Please select a location.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        code,
        name,
        departmentHeadId: headId,
        locationId,
      });
      reset();
      setOpen(false);
    } catch {
      setError("Failed to create department. The code may already be in use.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm">Add Department</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Department</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-1">
            <Label>Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. IT" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Information Technology" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Location</Label>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={locationId}
              onChange={(e) => setLocationId(Number(e.target.value))}
              required
            >
              <option value={0}>Select location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Department Head Employee ID</Label>
            <Input value={headId} onChange={(e) => setHeadId(e.target.value)} placeholder="e.g. EMP001" required />
            {headLookup.state === "loading" && <p className="text-xs text-muted-foreground">Looking up employee…</p>}
            {headLookup.state === "found" && headLookup.employee && (
              <p className="text-xs text-green-700">
                {headLookup.employee.firstName} {headLookup.employee.lastName} · {headLookup.employee.position}
              </p>
            )}
            {headLookup.state === "not_found" && <p className="text-xs text-red-500">Employee not found</p>}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? "Creating…" : "Create Department"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add NAFClient/src/features/admin/departments/components/AddDepartmentDialog.tsx
git commit -m "feat(departments): add AddDepartmentDialog component"
```

---

## Task 13: DepartmentListPage

**Files:**
- Create: `NAFClient/src/features/admin/departments/pages/DepartmentListPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { DataTable } from "@/shared/components/ui/datatable";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/api";
import { useDepartments } from "../hooks/useDepartments";
import { AddDepartmentDialog } from "../components/AddDepartmentDialog";
import type { DepartmentDTO } from "../types";
import { RoutesEnum } from "@/app/routesEnum";

const columns: ColumnDef<DepartmentDTO>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  { accessorKey: "code", header: "Code" },
  { accessorKey: "location", header: "Location", cell: ({ row }) => row.original.location || "—" },
  {
    accessorKey: "departmentHeadId",
    header: "Department Head",
    cell: ({ row }) => row.original.departmentHeadId || "—",
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          row.original.isActive
            ? "bg-green-100 text-green-800 border border-green-200"
            : "bg-gray-100 text-gray-500 border border-gray-200"
        }`}
      >
        {row.original.isActive ? "Active" : "Inactive"}
      </span>
    ),
  },
];

export default function DepartmentListPage() {
  const navigate = useNavigate();
  const [locationId, setLocationId] = useState<number | undefined>(undefined);

  const locationsQuery = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: adminApi.getLocations,
  });

  const { data: departments = [], isLoading } = useDepartments(locationId);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-500">Department Management</h1>
          <AddDepartmentDialog locations={locationsQuery.data ?? []} />
        </div>

        <div className="flex items-center gap-3">
          <select
            className="border rounded px-3 py-2 text-sm max-w-xs"
            value={locationId ?? ""}
            onChange={(e) =>
              setLocationId(e.target.value ? Number(e.target.value) : undefined)
            }
          >
            <option value="">All Locations</option>
            {locationsQuery.data?.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <DataTable
          columns={columns}
          data={departments}
          isLoading={isLoading}
          onRowClick={(d) =>
            navigate(
              RoutesEnum.ADMIN_DEPARTMENT_DETAIL.replace(":departmentId", String(d.id)),
            )
          }
          emptyMessage="No departments found."
        />
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Build check**

```bash
cd NAFClient && npm run build
```
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/admin/departments/pages/DepartmentListPage.tsx
git commit -m "feat(departments): add DepartmentListPage"
```

---

## Task 14: ChangeDepartmentHeadDialog + AddDepartmentEmployeeDialog

**Files:**
- Create: `NAFClient/src/features/admin/departments/components/ChangeDepartmentHeadDialog.tsx`
- Create: `NAFClient/src/features/admin/departments/components/AddDepartmentEmployeeDialog.tsx`

- [ ] **Step 1: Create ChangeDepartmentHeadDialog**

```tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { searchEmployees } from "@/shared/api/employeeService";
import type { Employee } from "@/shared/types/api/employee";
import { useDepartmentMutations } from "../hooks/useDepartments";

interface Props {
  departmentId: number;
}

export function ChangeDepartmentHeadDialog({ departmentId }: Props) {
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const [lookup, setLookup] = useState<{
    state: "idle" | "loading" | "found" | "not_found";
    employee: Employee | null;
  }>({ state: "idle", employee: null });

  const { changeHeadMutation } = useDepartmentMutations();

  useEffect(() => {
    if (!employeeId.trim()) {
      setLookup({ state: "idle", employee: null });
      return;
    }
    const timer = setTimeout(async () => {
      setLookup({ state: "loading", employee: null });
      try {
        const results = await searchEmployees(employeeId.trim());
        const match = results.find((e) => e.id === employeeId.trim());
        setLookup(
          match
            ? { state: "found", employee: match }
            : { state: "not_found", employee: null },
        );
      } catch {
        setLookup({ state: "not_found", employee: null });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [employeeId]);

  const reset = () => {
    setEmployeeId("");
    setError("");
    setLookup({ state: "idle", employee: null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (lookup.state !== "found") {
      setError("Employee not found.");
      return;
    }
    try {
      await changeHeadMutation.mutateAsync({ id: departmentId, employeeId });
      reset();
      setOpen(false);
    } catch {
      setError("Failed to change department head.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Change Department Head</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Department Head</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-1">
            <Label>Employee ID</Label>
            <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="e.g. EMP001" required />
            {lookup.state === "loading" && <p className="text-xs text-muted-foreground">Looking up employee…</p>}
            {lookup.state === "found" && lookup.employee && (
              <p className="text-xs text-green-700">
                {lookup.employee.firstName} {lookup.employee.lastName} · {lookup.employee.position}
              </p>
            )}
            {lookup.state === "not_found" && <p className="text-xs text-red-500">Employee not found</p>}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={changeHeadMutation.isPending} className="w-full">
            {changeHeadMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create AddDepartmentEmployeeDialog**

```tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { searchEmployees } from "@/shared/api/employeeService";
import type { Employee } from "@/shared/types/api/employee";
import { useDepartmentEmployeeMutations } from "../hooks/useDepartmentEmployees";

interface Props {
  departmentId: number;
}

export function AddDepartmentEmployeeDialog({ departmentId }: Props) {
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const [lookup, setLookup] = useState<{
    state: "idle" | "loading" | "found" | "not_found";
    employee: Employee | null;
  }>({ state: "idle", employee: null });

  const { addMutation } = useDepartmentEmployeeMutations(departmentId);

  useEffect(() => {
    if (!employeeId.trim()) {
      setLookup({ state: "idle", employee: null });
      return;
    }
    const timer = setTimeout(async () => {
      setLookup({ state: "loading", employee: null });
      try {
        const results = await searchEmployees(employeeId.trim());
        const match = results.find((e) => e.id === employeeId.trim());
        setLookup(
          match
            ? { state: "found", employee: match }
            : { state: "not_found", employee: null },
        );
      } catch {
        setLookup({ state: "not_found", employee: null });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [employeeId]);

  const reset = () => {
    setEmployeeId("");
    setError("");
    setLookup({ state: "idle", employee: null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (lookup.state !== "found") {
      setError("Employee not found. Enter a valid employee ID.");
      return;
    }
    try {
      await addMutation.mutateAsync(employeeId);
      reset();
      setOpen(false);
    } catch {
      setError("Failed to add employee. They may already be in this department.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm">Add Employee</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Employee to Department</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-1">
            <Label>Employee ID</Label>
            <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="e.g. EMP001" required />
            {lookup.state === "loading" && <p className="text-xs text-muted-foreground">Looking up employee…</p>}
            {lookup.state === "found" && lookup.employee && (
              <p className="text-xs text-green-700">
                {lookup.employee.firstName} {lookup.employee.lastName} · {lookup.employee.position}
              </p>
            )}
            {lookup.state === "not_found" && <p className="text-xs text-red-500">Employee not found</p>}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={addMutation.isPending} className="w-full">
            {addMutation.isPending ? "Adding…" : "Add Employee"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/admin/departments/components/
git commit -m "feat(departments): add ChangeDepartmentHeadDialog and AddDepartmentEmployeeDialog"
```

---

## Task 15: DepartmentEmployeeTable component

**Files:**
- Create: `NAFClient/src/features/admin/departments/components/DepartmentEmployeeTable.tsx`

- [ ] **Step 1: Create the component**

This table renders a list of `DepartmentEmployeeDTO`. Each row has:
- "View NAF" button (links to `/admin/NAF/:nafId`) if `nafId` is set
- "Create NAF" button (renders `CreateNAFDialog` with `initialEmployee`) if `nafId` is null
- "Remove" button (with a confirm dialog) that calls `removeMutation`

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DepartmentEmployeeDTO } from "../types";
import { useDepartmentEmployeeMutations } from "../hooks/useDepartmentEmployees";
import { CreateNAFDialog } from "@/features/naf/components/createNAFDialog";
import { RoutesEnum } from "@/app/routesEnum";
import type { Employee } from "@/shared/types/api/employee";

interface Props {
  departmentId: number;
  employees: DepartmentEmployeeDTO[];
}

export function DepartmentEmployeeTable({ departmentId, employees }: Props) {
  const navigate = useNavigate();
  const { removeMutation } = useDepartmentEmployeeMutations(departmentId);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const toEmployee = (dto: DepartmentEmployeeDTO): Employee => ({
    id: dto.employeeId,
    firstName: dto.firstName,
    middleName: dto.middleName ?? undefined,
    lastName: dto.lastName,
    status: "Active",
    company: "",
    position: dto.position,
    location: "",
  });

  return (
    <>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Employee ID</th>
              <th className="px-4 py-3 text-left font-medium">Position</th>
              <th className="px-4 py-3 text-left font-medium">NAF Status</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No employees assigned to this department.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.employeeId} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    {emp.firstName} {emp.middleName ? `${emp.middleName} ` : ""}{emp.lastName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.employeeId}</td>
                  <td className="px-4 py-3">{emp.position}</td>
                  <td className="px-4 py-3">
                    {emp.nafId ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {emp.nafProgress ?? "—"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">No NAF</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {emp.nafId ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(
                              RoutesEnum.ADMIN_NAF_DETAIL.replace(":nafId", emp.nafId!),
                            )
                          }
                        >
                          View NAF
                        </Button>
                      ) : (
                        <CreateNAFDialog initialEmployee={toEmployee(emp)} />
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setConfirmRemove(emp.employeeId)}
                      >
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!confirmRemove} onOpenChange={(o) => { if (!o) setConfirmRemove(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Employee</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove this employee from the department?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={removeMutation.isPending}
              onClick={async () => {
                if (!confirmRemove) return;
                await removeMutation.mutateAsync(confirmRemove);
                setConfirmRemove(null);
              }}
            >
              {removeMutation.isPending ? "Removing…" : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add NAFClient/src/features/admin/departments/components/DepartmentEmployeeTable.tsx
git commit -m "feat(departments): add DepartmentEmployeeTable component"
```

---

## Task 16: Add initialEmployee prop to CreateNAFDialog

**Files:**
- Modify: `NAFClient/src/features/naf/components/createNAFDialog.tsx`

The `DepartmentEmployeeTable` passes an `initialEmployee` to `CreateNAFDialog` so it opens with that employee pre-selected. The dialog should skip the employee search step in that case.

- [ ] **Step 1: Add `initialEmployee` prop**

At the top of `CreateNAFDialog`, change the function signature from:

```tsx
export function CreateNAFDialog() {
```

to:

```tsx
interface CreateNAFDialogProps {
  initialEmployee?: Employee;
}

export function CreateNAFDialog({ initialEmployee }: CreateNAFDialogProps = {}) {
```

- [ ] **Step 2: Initialize selectedEmployee from prop**

Change:

```tsx
const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
```

to:

```tsx
const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(initialEmployee ?? null);
```

- [ ] **Step 3: Reset to initialEmployee (not null) on dialog close**

Change the `reset` function from:

```tsx
const reset = () => {
  setSelectedEmployee(null);
  setShowEmployeeHasNAFAlert(false);
  setHardwareId(0);
  setDateNeeded("");
};
```

to:

```tsx
const reset = () => {
  setSelectedEmployee(initialEmployee ?? null);
  setShowEmployeeHasNAFAlert(false);
  setHardwareId(0);
  setDateNeeded("");
};
```

- [ ] **Step 4: Build check**

```bash
cd NAFClient && npm run build
```
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add NAFClient/src/features/naf/components/createNAFDialog.tsx
git commit -m "feat(naf): add optional initialEmployee prop to CreateNAFDialog"
```

---

## Task 17: DepartmentDetailPage

**Files:**
- Create: `NAFClient/src/features/admin/departments/pages/DepartmentDetailPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { useState } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDepartmentDetail, useDepartmentMutations } from "../hooks/useDepartments";
import { useDepartmentEmployees } from "../hooks/useDepartmentEmployees";
import { ChangeDepartmentHeadDialog } from "../components/ChangeDepartmentHeadDialog";
import { AddDepartmentEmployeeDialog } from "../components/AddDepartmentEmployeeDialog";
import { DepartmentEmployeeTable } from "../components/DepartmentEmployeeTable";

export default function DepartmentDetailPage() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const id = Number(departmentId);

  const { data: department, isLoading } = useDepartmentDetail(id);
  const employeesQuery = useDepartmentEmployees(id);
  const { setInactiveMutation } = useDepartmentMutations();
  const [confirmInactive, setConfirmInactive] = useState(false);

  if (isLoading || !department) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground">Loading…</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-amber-500">{department.name}</h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  department.isActive
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-gray-100 text-gray-500 border border-gray-200"
                }`}
              >
                {department.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Code: {department.code}</p>
            <p className="text-sm text-muted-foreground">Location: {department.location}</p>
            {department.departmentHeadName && (
              <p className="text-sm text-muted-foreground">
                Department Head: {department.departmentHeadName}
                {department.departmentHeadPosition ? ` · ${department.departmentHeadPosition}` : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ChangeDepartmentHeadDialog departmentId={id} />
            {department.isActive && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => setConfirmInactive(true)}
              >
                Set Inactive
              </Button>
            )}
          </div>
        </div>

        {/* Employees section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Employees</h2>
            <AddDepartmentEmployeeDialog departmentId={id} />
          </div>
          <DepartmentEmployeeTable
            departmentId={id}
            employees={employeesQuery.data ?? []}
          />
        </div>
      </div>

      {/* Set Inactive confirmation */}
      <Dialog open={confirmInactive} onOpenChange={setConfirmInactive}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Department Inactive</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to set <strong>{department.name}</strong> to inactive?
            Employee assignments will not be removed.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setConfirmInactive(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={setInactiveMutation.isPending}
              onClick={async () => {
                await setInactiveMutation.mutateAsync(id);
                setConfirmInactive(false);
              }}
            >
              {setInactiveMutation.isPending ? "Saving…" : "Set Inactive"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Build check**

```bash
cd NAFClient && npm run build
```
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/admin/departments/pages/DepartmentDetailPage.tsx
git commit -m "feat(departments): add DepartmentDetailPage"
```

---

## Final Verification

- [ ] Start backend: `cd NAFServer && dotnet run`
- [ ] Start frontend: `cd NAFClient && npm run dev`
- [ ] Open `http://localhost:5173`, log in as ADMIN
- [ ] Verify "Departments" appears in the admin sidebar
- [ ] Open `/admin/departments` — departments table loads with location filter working
- [ ] Click "Add Department" — fill in form, verify department is created and appears in list
- [ ] Click a department row — detail page opens with department info
- [ ] Click "Change Department Head" — search for employee, save, verify head updates
- [ ] Click "Add Employee" — search, add, verify employee appears in table
- [ ] Verify "View NAF" shows for employees with NAFs, "Create NAF" shows for those without
- [ ] Click "Create NAF" — dialog opens with employee pre-selected
- [ ] Click "Remove" on an employee — confirm dialog shown, employee removed
- [ ] Click "Set Inactive" on an active department — confirm, verify badge changes
