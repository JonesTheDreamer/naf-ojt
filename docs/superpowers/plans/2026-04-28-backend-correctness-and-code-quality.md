# Backend Correctness & Code Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the NAF system for production by fixing authorization gaps, inconsistent error handling, missing input validation, and cleaning up code quality issues across backend and frontend.

**Architecture:** Phase 1 fixes correctness (authorization, error handling, validation) as a single reviewable diff. Phase 2 cleans up code quality (dead code, console logs, duplicated logic, magic values) as a separate diff with no behavior changes. Backend verification is `dotnet build` + manual Swagger testing. Frontend verification is `npm run build`.

**Tech Stack:** ASP.NET Core 8, EF Core, React 19, TypeScript, React Query, Sonner (toast)

---

## File Map

### New files
- `NAFServer/src/API/Middleware/ExceptionHandlingMiddleware.cs` — global exception-to-HTTP mapper
- `NAFServer/src/Infrastructure/Persistence/Repositories/Helper/PaginationConstants.cs` — page size constant
- `NAFClient/src/shared/constants/queryConstants.ts` — stale time + page size constants

### Phase 1 modified files
- `NAFServer/src/Application/Interfaces/ICurrentUserService.cs` — add Role, GetDepartmentIdAsync, GetLocationIdAsync
- `NAFServer/src/Application/Services/CurrentUserService.cs` — implement new members
- `NAFServer/src/Application/Services/NAFService.cs` — add AuthorizeNAFAccessAsync, inject ICurrentUserService, remove try-catch wrapping
- `NAFServer/src/Application/Interfaces/INAFService.cs` — remove GetNAFByLocationAsync
- `NAFServer/src/API/Controllers/RequestsController.cs` — re-enable [Authorize], remove try-catch-rethrow
- `NAFServer/src/API/Controllers/NAFsController.cs` — remove try-catch, add [Range] on page params, remove dead GET stub
- `NAFServer/src/API/Controllers/AdminController.cs` — add [Range] on page param
- `NAFServer/src/Application/DTOs/Auth/LoginRequestDTO.cs` — add [Required]
- `NAFServer/src/Application/DTOs/ResourceRequest/CreateResourceRequestDTO.cs` — add [Required], [Range]
- `NAFServer/src/Application/DTOs/ResourceRequest/EditPurposeDTO.cs` — add [Required], [MinLength]
- `NAFServer/Program.cs` — register middleware

### Phase 2 modified files
- `NAFServer/src/API/Controllers/EmployeesController.cs` — remove commented code
- `NAFServer/src/Application/Services/EmployeeService.cs` — remove unused INAFRepository
- `NAFServer/src/Application/Services/ResourceRequestService.cs` — remove commented blocks
- `NAFServer/src/Infrastructure/Persistence/Repositories/NAFRepository.cs` — use PaginationConstants
- `NAFServer/appsettings.json` — add HardwareAutoAddResourceIds
- `NAFClient/src/features/naf/hooks/useNAF.ts` — use STALE_TIME, remove commented import
- `NAFClient/src/features/naf/hooks/useResourceRequest.ts` — extract invalidateNAFQueries helper
- `NAFClient/src/features/naf/pages/ViewNAFDetail.tsx` — remove console logs, use PROGRESS_CONFIG
- `NAFClient/src/features/naf/components/ResourceRequestList.tsx` — remove console logs, replace stubs with toast, use STALE_TIME
- `NAFClient/src/features/naf/components/resource-request/ResourceRequestContent.tsx` — switch on info.type
- `NAFClient/src/features/admin/pages/AdminNAFDetailPage.tsx` — remove console log, use PROGRESS_CONFIG
- `NAFClient/src/features/auth/AuthContext.tsx` — remove console log

---

## PHASE 1: Backend Correctness

---

### Task 1: Extend ICurrentUserService with Role and async lookup methods

**Files:**
- Modify: `NAFServer/src/Application/Interfaces/ICurrentUserService.cs`
- Modify: `NAFServer/src/Application/Services/CurrentUserService.cs`

- [ ] **Step 1: Update the interface**

Replace the entire contents of `NAFServer/src/Application/Interfaces/ICurrentUserService.cs`:

```csharp
namespace NAFServer.src.Application.Interfaces
{
    public interface ICurrentUserService
    {
        string EmployeeId { get; }
        string Role { get; }
        bool IsAuthenticated { get; }
        Task<string> GetDepartmentIdAsync();
        Task<int> GetLocationIdAsync();
    }
}
```

- [ ] **Step 2: Implement new members in CurrentUserService**

Replace the entire contents of `NAFServer/src/Application/Services/CurrentUserService.cs`:

```csharp
namespace NAFServer.src.Application.Services
{
    using NAFServer.src.Application.Interfaces;
    using NAFServer.src.Domain.Interface.Repository;
    using System.Security.Claims;

    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserLocationRepository _userLocationRepository;

        public CurrentUserService(
            IHttpContextAccessor httpContextAccessor,
            IEmployeeRepository employeeRepository,
            IUserRepository userRepository,
            IUserLocationRepository userLocationRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _employeeRepository = employeeRepository;
            _userRepository = userRepository;
            _userLocationRepository = userLocationRepository;
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

        public string Role =>
            _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value ?? "";

        public bool IsAuthenticated =>
            _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

        public async Task<string> GetDepartmentIdAsync()
        {
            var employee = await _employeeRepository.GetByIdAsync(EmployeeId);
            return employee.DepartmentId.ToString();
        }

        public async Task<int> GetLocationIdAsync()
        {
            var user = await _userRepository.GetUserByEmployeeId(EmployeeId);
            var location = await _userLocationRepository.GetUserActiveLocation(user.Id);
            return location.LocationId;
        }
    }
}
```

- [ ] **Step 3: Build to verify**

Run in `NAFServer/`:
```
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 4: Commit**

```
git add NAFServer/src/Application/Interfaces/ICurrentUserService.cs NAFServer/src/Application/Services/CurrentUserService.cs
git commit -m "feat: extend ICurrentUserService with Role and async department/location lookups"
```

---

### Task 2: Add department-scoped NAF authorization

**Files:**
- Modify: `NAFServer/src/Application/Services/NAFService.cs`

- [ ] **Step 1: Inject ICurrentUserService into NAFService constructor**

In `NAFServer/src/Application/Services/NAFService.cs`, add `ICurrentUserService` to the class and constructor. Add the field after `_userDepartmentRepository`:

```csharp
private readonly ICurrentUserService _currentUserService;
```

Update the constructor signature — add `ICurrentUserService currentUserService` as the last parameter:

```csharp
public NAFService(
    AppDbContext context,
    IEmployeeRepository employeeRepository,
    INAFRepository nafRepository,
    IApprovalWorkflowTemplateRepository approvalWorkflowTemplateRepository,
    IApprovalWorkflowStepsTemplateRepository approvalWorkflowStepsTemplateRepository,
    IDepartmentRepository departmentRepository,
    IResourceRequestService resourceRequestService,
    IResourceRepository resourceRepository,
    IResourceRequestHandlerRegistry resourceRequestHandlerRegistry,
    IUserRepository userRepository,
    IUserLocationRepository userLocationRepository,
    IUserDepartmentRepository userDepartmentRepository,
    ICurrentUserService currentUserService
)
{
    _context = context;
    _employeeRepository = employeeRepository;
    _nafRepository = nafRepository;
    _approvalWorkflowTemplateRepository = approvalWorkflowTemplateRepository;
    _approvalWorkflowStepsTemplateRepository = approvalWorkflowStepsTemplateRepository;
    _departmentRepository = departmentRepository;
    _resourceRequestService = resourceRequestService;
    _resourceRepository = resourceRepository;
    _resourceRequestHandlerRegistry = resourceRequestHandlerRegistry;
    _userRepository = userRepository;
    _userLocationRepository = userLocationRepository;
    _userDepartmentRepository = userDepartmentRepository;
    _currentUserService = currentUserService;
}
```

- [ ] **Step 2: Add AuthorizeNAFAccessAsync private method**

Add this private method to `NAFService`, after the constructor:

```csharp
private async Task AuthorizeNAFAccessAsync(NAF naf)
{
    var currentUserId = _currentUserService.EmployeeId;

    // Rule 1: requestor owns the NAF
    if (naf.RequestorId == currentUserId || naf.EmployeeId == currentUserId)
        return;

    // Rule 2: same department
    var currentDepartmentId = await _currentUserService.GetDepartmentIdAsync();
    if (naf.DepartmentId.ToString() == currentDepartmentId)
        return;

    // Rule 3: assigned approver on any step
    bool isApprover = naf.ResourceRequests
        .SelectMany(rr => rr.ResourceRequestsApprovalSteps)
        .Any(s => s.ApproverId == currentUserId);
    if (isApprover)
        return;

    // Rule 4: admin whose location matches the NAF requestor's location
    if (_currentUserService.Role == "ADMIN")
    {
        var adminLocationId = await _currentUserService.GetLocationIdAsync();
        var requestorEmployee = await _employeeRepository.GetByIdAsync(naf.EmployeeId);
        // Employee.Location is a string like "Davao" — compare via user location record
        var requestorUser = await _userRepository.GetUserByEmployeeId(naf.EmployeeId);
        var requestorLocation = await _userLocationRepository.GetUserActiveLocation(requestorUser.Id);
        if (requestorLocation.LocationId == adminLocationId)
            return;
    }

    throw new UnauthorizedAccessException("You do not have access to this NAF.");
}
```

- [ ] **Step 3: Update GetNAFByIdAsync to call authorization and remove try-catch wrapping**

Replace the existing `GetNAFByIdAsync` method:

```csharp
public async Task<NAFDTO> GetNAFByIdAsync(Guid id)
{
    var naf = await _nafRepository.GetByIdAsync(id);
    var user = await _userRepository.GetUserByEmployeeId(naf.EmployeeId);

    await AuthorizeNAFAccessAsync(naf);

    var approverIds = naf.ResourceRequests
        .SelectMany(rr => rr.ResourceRequestsApprovalSteps)
        .Select(s => s.ApproverId)
        .Distinct()
        .ToList();

    var approverNames = new Dictionary<string, string>();
    foreach (var approverId in approverIds)
    {
        var approver = await _employeeRepository.GetByIdAsync(approverId);
        if (approver != null)
            approverNames[approver.Id] = $"{approver.FirstName} {approver.LastName}".Trim();
    }

    return NAFMapper.ToDTO(naf, user.Employee, approverNames);
}
```

- [ ] **Step 4: Build to verify**

```
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 5: Commit**

```
git add NAFServer/src/Application/Services/NAFService.cs
git commit -m "feat: add department-scoped NAF access authorization"
```

---

### Task 3: Re-enable [Authorize] on RequestsController and remove try-catch-rethrow

**Files:**
- Modify: `NAFServer/src/API/Controllers/RequestsController.cs`

- [ ] **Step 1: Replace the entire file**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class RequestsController : ControllerBase
    {
        private readonly IResourceRequestService _resourceRequestService;

        public RequestsController(IResourceRequestService resourceRequestService)
        {
            _resourceRequestService = resourceRequestService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var rr = await _resourceRequestService.GetByIdAsync(id);
            return Ok(rr);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] CreateResourceRequestDTO request)
        {
            var rr = await _resourceRequestService.CreateSpecialAsync(request);
            return CreatedAtAction(nameof(Get), new { id = rr.Id }, new
            {
                success = true,
                message = "Resource request created successfully",
                data = rr
            });
        }

        [HttpPost("change-resource/{requestId:guid}")]
        public async Task<IActionResult> ChangeResource(Guid requestId, [FromBody] int newResource)
        {
            var rr = await _resourceRequestService.ChangeResourceAsync(requestId, newResource);
            return CreatedAtAction(nameof(Get), new { id = rr.Id }, new
            {
                success = true,
                message = "Resource changed successfully",
                data = rr
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _resourceRequestService.DeleteAsync(id);
            return Ok();
        }

        [HttpPut("{id:guid}/cancel")]
        public async Task<IActionResult> Cancel(Guid id)
        {
            await _resourceRequestService.CancelAsync(id);
            return Ok();
        }

        [HttpPost("{id:guid}/purpose")]
        public async Task<IActionResult> RevisePurpose(Guid id, [FromBody] EditPurposeDTO request)
        {
            var rr = await _resourceRequestService.EditPurposeAsync(id, request);
            return Ok(rr);
        }
    }
}
```

- [ ] **Step 2: Build to verify**

```
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```
git add NAFServer/src/API/Controllers/RequestsController.cs
git commit -m "fix: re-enable [Authorize] on RequestsController, remove try-catch-rethrow"
```

---

### Task 4: Global exception handling middleware

**Files:**
- Create: `NAFServer/src/API/Middleware/ExceptionHandlingMiddleware.cs`
- Modify: `NAFServer/Program.cs`

- [ ] **Step 1: Create the middleware file**

Create `NAFServer/src/API/Middleware/ExceptionHandlingMiddleware.cs`:

```csharp
using System.Text.Json;
using NAFServer.src.Domain.Exceptions;

namespace NAFServer.src.API.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionHandlingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception ex)
        {
            int statusCode;
            string message;

            switch (ex)
            {
                case KeyNotFoundException:
                    statusCode = StatusCodes.Status404NotFound;
                    message = ex.Message;
                    break;
                case ArgumentException:
                case ApplicationException:
                case DomainException:
                case InvalidOperationException:
                    statusCode = StatusCodes.Status400BadRequest;
                    message = ex.Message;
                    break;
                case UnauthorizedAccessException:
                    statusCode = StatusCodes.Status403Forbidden;
                    message = "Access denied.";
                    break;
                default:
                    statusCode = StatusCodes.Status500InternalServerError;
                    message = "An unexpected error occurred.";
                    break;
            }

            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";

            var body = JsonSerializer.Serialize(new { error = message });
            await context.Response.WriteAsync(body);
        }
    }
}
```

- [ ] **Step 2: Register middleware as the first step in the pipeline**

In `NAFServer/Program.cs`, add `app.UseMiddleware<ExceptionHandlingMiddleware>();` as the **first** line after `var app = builder.Build();` and the seeder block, before `app.UseCors(...)`. Also add the using at the top of the file.

Add this using at the top of Program.cs (after existing usings):
```csharp
using NAFServer.src.API.Middleware;
```

Add this line immediately after the seeder block (before `if (app.Environment.IsDevelopment())`):
```csharp
app.UseMiddleware<ExceptionHandlingMiddleware>();
```

- [ ] **Step 3: Remove try-catch from NAFsController.Post and AddBasicResources**

In `NAFServer/src/API/Controllers/NAFsController.cs`, replace the `Post` action:

```csharp
[HttpPost]
public async Task<IActionResult> Post([FromBody] CreateNAFRequestDTO request)
{
    var naf = await _nafService.CreateAsync(request);
    return CreatedAtAction(nameof(Get), new { id = naf.Id }, new
    {
        success = true,
        message = "NAF created successfully",
        data = naf
    });
}
```

Replace the `AddBasicResources` action:

```csharp
[HttpPost("{nafId:guid}/resources/basic")]
public async Task<IActionResult> AddBasicResources(Guid nafId, [FromBody] AddBasicResourcesDTO request)
{
    var results = await _nafService.AddBasicResourcesToNAFAsync(nafId, request.Resources);
    return Ok(results);
}
```

Also remove the dead stub `Get()` that returns `new string[] { "value1", "value2" }` (the parameterless one at line 22).

- [ ] **Step 4: Build to verify**

```
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 5: Commit**

```
git add NAFServer/src/API/Middleware/ExceptionHandlingMiddleware.cs NAFServer/Program.cs NAFServer/src/API/Controllers/NAFsController.cs
git commit -m "feat: add global exception handling middleware, remove controller try-catch-rethrow"
```

---

### Task 5: DTO input validation

**Files:**
- Modify: `NAFServer/src/Application/DTOs/Auth/LoginRequestDTO.cs`
- Modify: `NAFServer/src/Application/DTOs/ResourceRequest/CreateResourceRequestDTO.cs`
- Modify: `NAFServer/src/Application/DTOs/ResourceRequest/EditPurposeDTO.cs`

- [ ] **Step 1: Add validation to LoginRequestDTO**

Replace `NAFServer/src/Application/DTOs/Auth/LoginRequestDTO.cs`:

```csharp
using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.Application.DTOs.Auth
{
    public record LoginRequestDTO([Required][MinLength(1)] string EmployeeId);
}
```

- [ ] **Step 2: Add validation to CreateResourceRequestDTO**

Replace `NAFServer/src/Application/DTOs/ResourceRequest/CreateResourceRequestDTO.cs`:

```csharp
using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record CreateResourceRequestDTO(
        Guid nafId,
        [Range(1, int.MaxValue)] int resourceId,
        [Required][MinLength(1)] string purpose,
        JsonElement? additionalInfo,
        DateTime dateNeeded
    );
}
```

- [ ] **Step 3: Add validation to EditPurposeDTO**

Replace `NAFServer/src/Application/DTOs/ResourceRequest/EditPurposeDTO.cs`:

```csharp
using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record EditPurposeDTO(
        [Required][MinLength(1)] string purpose
    );
}
```

- [ ] **Step 4: Build to verify**

```
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 5: Commit**

```
git add NAFServer/src/Application/DTOs/Auth/LoginRequestDTO.cs NAFServer/src/Application/DTOs/ResourceRequest/CreateResourceRequestDTO.cs NAFServer/src/Application/DTOs/ResourceRequest/EditPurposeDTO.cs
git commit -m "feat: add input validation annotations to LoginRequestDTO, CreateResourceRequestDTO, EditPurposeDTO"
```

---

### Task 6: Remove NotImplementedException, add pagination validation, extract page size constant

**Files:**
- Create: `NAFServer/src/Infrastructure/Persistence/Repositories/Helper/PaginationConstants.cs`
- Modify: `NAFServer/src/Application/Interfaces/INAFService.cs`
- Modify: `NAFServer/src/Application/Services/NAFService.cs`
- Modify: `NAFServer/src/Infrastructure/Persistence/Repositories/NAFRepository.cs`
- Modify: `NAFServer/src/API/Controllers/NAFsController.cs`
- Modify: `NAFServer/src/API/Controllers/AdminController.cs`

- [ ] **Step 1: Create PaginationConstants**

Create `NAFServer/src/Infrastructure/Persistence/Repositories/Helper/PaginationConstants.cs`:

```csharp
namespace NAFServer.src.Infrastructure.Persistence.Repositories.Helper
{
    public static class PaginationConstants
    {
        public const int PageSize = 6;
    }
}
```

- [ ] **Step 2: Remove GetNAFByLocationAsync from interface**

In `NAFServer/src/Application/Interfaces/INAFService.cs`, remove this line:

```csharp
public Task<List<NAFDTO>> GetNAFByLocationAsync(int locationId);
```

- [ ] **Step 3: Remove GetNAFByLocationAsync from NAFService**

In `NAFServer/src/Application/Services/NAFService.cs`, remove the entire method:

```csharp
public Task<List<NAFDTO>> GetNAFByLocationAsync(int locationId)
{
    throw new NotImplementedException();
}
```

Also remove the commented-out method block just above it:
```csharp
//public async Task<List<NAFDTO>> GetNAFByLocationIdAsync(int departmentId)
//{
//    var nafs = await _nafRepository.GetByDepartmentIdAsync(departmentId);
//    return nafs;
//}
```

- [ ] **Step 4: Use PaginationConstants in NAFRepository**

In `NAFServer/src/Infrastructure/Persistence/Repositories/NAFRepository.cs`, add the using at the top:

```csharp
using NAFServer.src.Infrastructure.Persistence.Repositories.Helper;
```

Replace the two `int pageSize = 6;` lines (in `GetNAFUnderEmployee` and `GetNAFToApprove`) with:

```csharp
int pageSize = PaginationConstants.PageSize;
```

- [ ] **Step 5: Add [Range] to page parameters in NAFsController**

In `NAFServer/src/API/Controllers/NAFsController.cs`, add `using System.ComponentModel.DataAnnotations;` at the top and update the two actions:

```csharp
[HttpGet("{employeeId}/subordinates")]
public async Task<IActionResult> GetNAFsUnderEmployee(string employeeId, [Range(1, int.MaxValue)] int page = 1)
{
    var nafs = await _nafService.GetNAFsUnderEmployeeAsync(employeeId, page);
    return Ok(nafs);
}

[HttpGet("{employeeId}/approver/")]
public async Task<IActionResult> GetNAFsToApprove(string employeeId, [Range(1, int.MaxValue)] int page = 1)
{
    var nafs = await _nafService.GetNAFToApproveAsync(employeeId, page);
    return Ok(nafs);
}
```

- [ ] **Step 6: Add [Range] to page parameter in AdminController**

In `NAFServer/src/API/Controllers/AdminController.cs`, update the `GetAdminNAFs` action:

```csharp
[HttpGet("nafs")]
public async Task<IActionResult> GetAdminNAFs(
    [FromQuery] int locationId,
    [FromQuery] string status = "all",
    [FromQuery][Range(1, int.MaxValue)] int page = 1)
{
    return Ok(await _nafService.GetNAFsByLocationPagedAsync(locationId, status, page));
}
```

- [ ] **Step 7: Build to verify**

```
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 8: Commit**

```
git add NAFServer/src/Infrastructure/Persistence/Repositories/Helper/PaginationConstants.cs NAFServer/src/Application/Interfaces/INAFService.cs NAFServer/src/Application/Services/NAFService.cs NAFServer/src/Infrastructure/Persistence/Repositories/NAFRepository.cs NAFServer/src/API/Controllers/NAFsController.cs NAFServer/src/API/Controllers/AdminController.cs
git commit -m "fix: remove NotImplementedException, add pagination validation, extract PaginationConstants"
```

---

## PHASE 2: Code Quality

---

### Task 7: Backend dead code removal

**Files:**
- Modify: `NAFServer/src/API/Controllers/EmployeesController.cs`
- Modify: `NAFServer/src/Application/Services/EmployeeService.cs`
- Modify: `NAFServer/src/Application/Services/ResourceRequestService.cs`

- [ ] **Step 1: Remove commented code from EmployeesController**

Replace the entire file `NAFServer/src/API/Controllers/EmployeesController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class EmployeesController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;

        public EmployeesController(IEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }

        [HttpGet("search/{match}")]
        public async Task<IActionResult> Search(string match)
        {
            var employee = await _employeeService.SearchEmployee(match);
            return Ok(employee);
        }
    }
}
```

- [ ] **Step 2: Remove unused INAFRepository from EmployeeService**

Replace the entire file `NAFServer/src/Application/Services/EmployeeService.cs`:

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

        public async Task<List<Employee>> SearchEmployee(string match)
        {
            return await _employeeRepository.SearchEmployee(match);
        }
    }
}
```

- [ ] **Step 3: Remove commented blocks from ResourceRequestService**

In `NAFServer/src/Application/Services/ResourceRequestService.cs`, find and delete the following commented block (it appears inside `FetchApproversAsync`):

```csharp
//case ApproverRole.POSITION:
//    approverId = step.ApproverEntity switch
//    {
//        "Network Admin" => "9229523",
//        //_ => (await _departmentRepository.GetByIdAsync(employee.DepartmentId))
//        //.PositionHeadId
//    };
//    break;
```

- [ ] **Step 4: Build to verify**

```
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 5: Commit**

```
git add NAFServer/src/API/Controllers/EmployeesController.cs NAFServer/src/Application/Services/EmployeeService.cs NAFServer/src/Application/Services/ResourceRequestService.cs
git commit -m "chore: remove dead code from EmployeesController, EmployeeService, ResourceRequestService"
```

---

### Task 8: Move hard-coded resource names to configuration

**Files:**
- Modify: `NAFServer/appsettings.json`
- Modify: `NAFServer/src/Application/Services/NAFService.cs`

- [ ] **Step 1: Add resource IDs to appsettings.json**

Open `NAFServer/appsettings.json` and add the following section. Replace the ID values with the actual integer IDs from your database for those resources (query: `SELECT Id, Name FROM Resources WHERE Name IN ('Microsoft 365 (E1)', 'Basic Internet', 'Active Directory', 'Printer Access (Black and White)')`):

```json
"HardwareAutoAdd": {
  "WithHardwareResourceIds": [ 1, 2, 3, 4 ],
  "NoHardwareResourceIds": [ 3 ]
}
```

*Note: Replace `1, 2, 3, 4` with the real IDs from your DB. The current names are:*
- *WithHardware: "Microsoft 365 (E1)", "Basic Internet", "Active Directory", "Printer Access (Black and White)"*
- *NoHardware: "Active Directory"*

- [ ] **Step 2: Update NAFService to read from configuration**

In `NAFServer/src/Application/Services/NAFService.cs`, add `IConfiguration` as a dependency:

Add the field:
```csharp
private readonly IConfiguration _configuration;
```

Add `IConfiguration configuration` as the last constructor parameter and assign it:
```csharp
_configuration = configuration;
```

- [ ] **Step 3: Remove static name arrays and update CreateAsync**

Remove these two lines from `NAFService`:
```csharp
private static readonly string[] _withHardwareAutoAddNames = { "Microsoft 365 (E1)", "Basic Internet", "Active Directory", "Printer Access (Black and White)" };
private static readonly string[] _noHardwareAutoAddNames = { "Active Directory" };
```

In `CreateAsync`, replace the two `.Where(r => _withHardwareAutoAddNames.Contains(r.Name))` / `_noHardwareAutoAddNames.Contains(r.Name)` queries with ID-based lookups:

```csharp
var withHardwareIds = _configuration
    .GetSection("HardwareAutoAdd:WithHardwareResourceIds")
    .Get<List<int>>() ?? new List<int>();

var noHardwareIds = _configuration
    .GetSection("HardwareAutoAdd:NoHardwareResourceIds")
    .Get<List<int>>() ?? new List<int>();
```

Remove the old EF queries for `withHardwareIds` and `noHardwareIds` (the two `await _context.Resources.Where(...).Select(r => r.Id).ToListAsync()` blocks). The rest of the method (`resourcesToAdd` logic) stays the same.

- [ ] **Step 4: Build to verify**

```
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 5: Commit**

```
git add NAFServer/appsettings.json NAFServer/src/Application/Services/NAFService.cs
git commit -m "chore: move hard-coded resource names to appsettings.json as resource IDs"
```

---

### Task 9: Frontend — create queryConstants and fix stale times

**Files:**
- Create: `NAFClient/src/shared/constants/queryConstants.ts`
- Modify: `NAFClient/src/features/naf/hooks/useNAF.ts`
- Modify: `NAFClient/src/features/naf/components/ResourceRequestList.tsx`

- [ ] **Step 1: Create queryConstants.ts**

Create `NAFClient/src/shared/constants/queryConstants.ts`:

```ts
export const STALE_TIME = {
  MEDIUM: 1000 * 60 * 5,
  LONG: 1000 * 60 * 10,
} as const;

export const PAGE_SIZE = 6;
```

- [ ] **Step 2: Update useNAF.ts**

In `NAFClient/src/features/naf/hooks/useNAF.ts`:

Remove the commented import on line 2:
```ts
// import { queryClient } from "@/app/queryClient";
```

Add this import at the top:
```ts
import { STALE_TIME } from "@/shared/constants/queryConstants";
```

Replace the three `staleTime: 1000 * 60 * 5` occurrences with `staleTime: STALE_TIME.MEDIUM`.

Also remove the two `console.error` calls in the `createNAFMutation` and `deactivate` mutation `onError` handlers — replace each with just the toast (the error is already shown to the user via toast):

```ts
onError: () => toast.error("Failed to create NAF"),
```

```ts
onError: () => toast.error("Failed to deactivate NAF"),
```

- [ ] **Step 3: Update ResourceRequestList.tsx stale time**

In `NAFClient/src/features/naf/components/ResourceRequestList.tsx`, add the import:

```ts
import { STALE_TIME } from "@/shared/constants/queryConstants";
```

Replace `staleTime: 1000 * 60 * 10` with `staleTime: STALE_TIME.LONG`.

- [ ] **Step 4: Build to verify**

Run in `NAFClient/`:
```
npm run build
```
Expected: ✓ built successfully, 0 TypeScript errors.

- [ ] **Step 5: Commit**

```
git add NAFClient/src/shared/constants/queryConstants.ts NAFClient/src/features/naf/hooks/useNAF.ts NAFClient/src/features/naf/components/ResourceRequestList.tsx
git commit -m "chore: extract STALE_TIME constants, remove commented import from useNAF"
```

---

### Task 10: Remove console statements and fix stubs

**Files:**
- Modify: `NAFClient/src/features/naf/pages/ViewNAFDetail.tsx`
- Modify: `NAFClient/src/features/admin/pages/AdminNAFDetailPage.tsx`
- Modify: `NAFClient/src/features/auth/AuthContext.tsx`
- Modify: `NAFClient/src/features/naf/components/ResourceRequestList.tsx`

- [ ] **Step 1: ViewNAFDetail.tsx — remove console statements**

In `NAFClient/src/features/naf/pages/ViewNAFDetail.tsx`:

Remove line 72: `console.log(naf.data);`

In `handleDeactivateNAF`, remove the try-catch wrapper entirely — the `deactivateNAFAsync` mutation already handles errors via `onError: toast.error`. Replace:

```ts
const handleDeactivateNAF = async () => {
  if (!nafId) return;
  try {
    await deactivateNAFAsync(nafId);
  } catch (error) {
    console.error("Failed to deactivate NAF:", error);
  }
};
```

With:

```ts
const handleDeactivateNAF = async () => {
  if (!nafId) return;
  await deactivateNAFAsync(nafId);
};
```

- [ ] **Step 2: AdminNAFDetailPage.tsx — remove console statement**

In `NAFClient/src/features/admin/pages/AdminNAFDetailPage.tsx`, remove line 42: `console.log(naf);`

- [ ] **Step 3: AuthContext.tsx — remove console statement**

In `NAFClient/src/features/auth/AuthContext.tsx`, remove the entire second `useEffect`:

```ts
useEffect(() => {
  console.log(user);
}, [user]);
```

- [ ] **Step 4: ResourceRequestList.tsx — remove console.error from catch blocks, replace stubs with toast**

In `NAFClient/src/features/naf/components/ResourceRequestList.tsx`:

Add `import { toast } from "sonner";` at the top if not already present.

For each handler that has a `catch (error) { console.error(...) }` block, remove the try-catch entirely (mutations already call `onError: toast.error(...)`). The handlers become:

```ts
const handleEdit = async (_requestId: string, _nafId: string, purpose: PurposeProps) => {
  await updateResourceRequestAsync(purpose);
};

const handleResubmit = async (_requestId: string, _nafId: string, purpose: PurposeProps) => {
  await updateResourceRequestAsync({ purpose: purpose.purpose });
};

const handleDelete = async (id: string) => {
  await deleteResourceRequestAsync(id);
};

const handleApprove = async (_id: string, comment: string) => {
  if (!isApproverForThisRequest || !activeStep) return;
  await approveRequestAsync({ stepId: activeStep.id, comment });
};

const handleReject = async (_id: string, reason: string) => {
  if (!isApproverForThisRequest || !activeStep) return;
  await rejectRequestAsync({ stepId: activeStep.id, reasonForRejection: reason });
};

const handleCancel = async (_id: string) => {
  await cancelRequestAsync();
};

const handleChangeResource = async (_requestId: string, newResourceId: number) => {
  await changeResourceAsync(newResourceId);
};
```

Replace the two TODO stub handlers:

```ts
const handleRemind = (_id: string) => toast.error("This feature is not yet available.");
const handleDeactivate = (_id: string) => toast.error("This feature is not yet available.");
```

- [ ] **Step 5: Build to verify**

```
npm run build
```
Expected: ✓ built successfully, 0 TypeScript errors.

- [ ] **Step 6: Commit**

```
git add NAFClient/src/features/naf/pages/ViewNAFDetail.tsx NAFClient/src/features/admin/pages/AdminNAFDetailPage.tsx NAFClient/src/features/auth/AuthContext.tsx NAFClient/src/features/naf/components/ResourceRequestList.tsx
git commit -m "chore: remove console statements, replace TODO stubs with toast"
```

---

### Task 11: Extract invalidateNAFQueries helper in useResourceRequest

**Files:**
- Modify: `NAFClient/src/features/naf/hooks/useResourceRequest.ts`

- [ ] **Step 1: Add invalidateNAFQueries helper and update all mutations**

Replace the entire contents of `NAFClient/src/features/naf/hooks/useResourceRequest.ts`:

```ts
import {
  approveResourceRequest,
  cancelResourceRequest,
  changeResource,
  createResourceRequest,
  deleteResourceRequest,
  editResourceRequestPurpose,
  rejectResourceRequest,
} from "../api";
import type { NAF, PurposeProps } from "@/shared/types/api/naf";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useResourceRequest = (resourceRequestId: string, NAFId?: string) => {
  const queryClient = useQueryClient();

  function invalidateNAFQueries() {
    queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
    queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
    queryClient.invalidateQueries({ queryKey: ["approverNAFs"] });
  }

  const updateResourceRequest = useMutation({
    mutationFn: (purpose: PurposeProps) => editResourceRequestPurpose(resourceRequestId, purpose),
    onSuccess: (updatedRequest) => {
      queryClient.setQueryData<NAF | undefined>(["naf", NAFId], (oldNAF) => {
        if (!oldNAF) return oldNAF;
        return {
          ...oldNAF,
          resourceRequests: oldNAF.resourceRequests.map((req) =>
            req.id === updatedRequest.id ? updatedRequest : req,
          ),
        };
      });
      toast.success("Purpose updated");
    },
    onError: () => toast.error("Failed to update purpose"),
  });

  const removeResourceRequest = useMutation({
    mutationFn: deleteResourceRequest,
    onSuccess: () => {
      invalidateNAFQueries();
      toast.success("Resource removed");
    },
    onError: () => toast.error("Failed to remove resource"),
  });

  const changeResourceRequest = useMutation({
    mutationFn: (resourceId: number) => changeResource(resourceRequestId, resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
      toast.success("Resource request changed!");
    },
    onError: () => toast.error("Failed to change resource"),
  });

  const approveRequest = useMutation({
    mutationFn: ({ stepId, comment }: { stepId: string; comment?: string }) =>
      approveResourceRequest(stepId, comment),
    onSuccess: () => {
      invalidateNAFQueries();
      toast.success("Request approved");
    },
    onError: () => toast.error("Failed to approve request"),
  });

  const rejectRequest = useMutation({
    mutationFn: ({ stepId, reasonForRejection }: { stepId: string; reasonForRejection: string }) =>
      rejectResourceRequest(stepId, reasonForRejection),
    onSuccess: () => {
      invalidateNAFQueries();
      toast.success("Request rejected");
    },
    onError: () => toast.error("Failed to reject request"),
  });

  const cancelRequest = useMutation({
    mutationFn: () => cancelResourceRequest(resourceRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      toast.success("Request cancelled");
    },
    onError: () => toast.error("Failed to cancel request"),
  });

  const createRequest = useMutation({
    mutationFn: (payload: {
      nafId: string;
      resourceId: number;
      purpose: string;
      dateNeeded?: string | null;
    }) => createResourceRequest({ ...payload, additionalInfo: {} }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      toast.success("New resource request created");
    },
    onError: () => toast.error("Failed to create resource request"),
  });

  return {
    updateResourceRequestAsync: updateResourceRequest.mutateAsync,
    updateError: updateResourceRequest.isError,
    deleteResourceRequestAsync: removeResourceRequest.mutateAsync,
    deleteError: removeResourceRequest.isError,
    approveRequestAsync: approveRequest.mutateAsync,
    approveRequestError: approveRequest.isError,
    rejectRequestAsync: rejectRequest.mutateAsync,
    rejectRequestError: rejectRequest.isError,
    cancelRequestAsync: cancelRequest.mutateAsync,
    cancelRequestError: cancelRequest.isError,
    createRequestAsync: createRequest.mutateAsync,
    createRequestError: createRequest.isError,
    changeResourceAsync: changeResourceRequest.mutateAsync,
    changeResourceError: changeResourceRequest.isError,
  };
};
```

- [ ] **Step 2: Build to verify**

```
npm run build
```
Expected: ✓ built successfully, 0 TypeScript errors.

- [ ] **Step 3: Commit**

```
git add NAFClient/src/features/naf/hooks/useResourceRequest.ts
git commit -m "chore: extract invalidateNAFQueries helper in useResourceRequest"
```

---

### Task 12: Replace duplicated progress logic with PROGRESS_CONFIG and fix AdditionalInfoBlock

**Files:**
- Modify: `NAFClient/src/features/naf/pages/ViewNAFDetail.tsx`
- Modify: `NAFClient/src/features/admin/pages/AdminNAFDetailPage.tsx`
- Modify: `NAFClient/src/features/naf/components/resource-request/ResourceRequestContent.tsx`

- [ ] **Step 1: Update ViewNAFDetail.tsx**

In `NAFClient/src/features/naf/pages/ViewNAFDetail.tsx`:

Remove the imports of `ProgressStatus` and the two local functions `nafProgressLabel` and `nafProgressColor`.

Add this import:
```ts
import { PROGRESS_CONFIG } from "../components/progressBadge";
import { Progress } from "@/shared/types/enum/progress";
```

Replace the progress display JSX (the `<span>` that calls `nafProgressColor`/`nafProgressLabel`):

```tsx
<div className="flex flex-col items-start sm:items-end gap-0.5 shrink-0">
  <span className="text-xs text-muted-foreground">Status</span>
  <span className={`text-sm font-bold ${PROGRESS_CONFIG[naf.data.progress as Progress]?.className.split(" ").find(c => c.startsWith("text-")) ?? "text-amber-500"}`}>
    {PROGRESS_CONFIG[naf.data.progress as Progress]?.label ?? String(naf.data.progress)}
  </span>
</div>
```

- [ ] **Step 2: Update AdminNAFDetailPage.tsx**

In `NAFClient/src/features/admin/pages/AdminNAFDetailPage.tsx`:

Remove the `ProgressStatus` import and the local `nafProgressColor` function.

Add this import:
```ts
import { PROGRESS_CONFIG } from "@/features/naf/components/progressBadge";
import { Progress } from "@/shared/types/enum/progress";
```

Replace the progress display JSX:

```tsx
<div className="flex flex-col items-start sm:items-end gap-0.5 shrink-0">
  <span className="text-xs text-muted-foreground">Status</span>
  <span className={`text-sm font-bold ${PROGRESS_CONFIG[naf.progress as Progress]?.className.split(" ").find(c => c.startsWith("text-")) ?? "text-amber-500"}`}>
    {PROGRESS_CONFIG[naf.progress as Progress]?.label ?? String(naf.progress)}
  </span>
</div>
```

- [ ] **Step 3: Fix AdditionalInfoBlock to use switch**

In `NAFClient/src/features/naf/components/resource-request/ResourceRequestContent.tsx`, replace the `AdditionalInfoBlock` function:

```tsx
export function AdditionalInfoBlock({ info }: { info: NonNullable<ResourceRequest["additionalInfo"]> }) {
  switch (info.type) {
    case 0:
      return (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Access</p>
          <Select value={info.resource} disabled>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={info.resource}>{info.resource}</SelectItem></SelectContent>
          </Select>
        </div>
      );
    case 1:
      return (
        <div className="text-sm space-y-1">
          <p className="font-semibold">Shared Folder</p>
          <p className="text-muted-foreground">{info.name}</p>
        </div>
      );
    case 2:
      return (
        <div className="text-sm space-y-1">
          <p className="font-semibold">Group Email</p>
          <p className="text-muted-foreground">{info.email}</p>
        </div>
      );
  }
}
```

- [ ] **Step 4: Build to verify**

```
npm run build
```
Expected: ✓ built successfully, 0 TypeScript errors.

- [ ] **Step 5: Commit**

```
git add NAFClient/src/features/naf/pages/ViewNAFDetail.tsx NAFClient/src/features/admin/pages/AdminNAFDetailPage.tsx NAFClient/src/features/naf/components/resource-request/ResourceRequestContent.tsx
git commit -m "chore: replace duplicated progress logic with PROGRESS_CONFIG, refactor AdditionalInfoBlock to switch"
```

---

## Done

All tasks complete. Phase 1 (correctness) and Phase 2 (quality) are each a clean series of commits that can be reviewed independently.
