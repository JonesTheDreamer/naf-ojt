# Add Resource to Existing NAF — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a modal dialog that lets the requestor add one or more basic and/or special resources to an existing NAF from the NAF detail page.

**Architecture:** Backend exposes four new lookup endpoints (internet purposes, internet resources, group emails, shared folders), a new per-item basic-resource endpoint, and patches duplicate validation. Frontend provides a dialog driven by per-type entry lists, a `useAddResource` hook, and wires into the existing `+ Add Resources` button in `ViewNAFDetail`.

**Tech Stack:** ASP.NET Core 8 (C#), EF Core, React 19, TypeScript, TanStack Query, Tailwind CSS v4, ShadCN, `radix-ui`, `cmdk`.

---

## File Map

**New backend files:**
- `NAFServer/src/Application/DTOs/Lookup/InternetPurposeDTO.cs`
- `NAFServer/src/Application/DTOs/Lookup/InternetResourceItemDTO.cs`
- `NAFServer/src/Application/DTOs/Lookup/GroupEmailDTO.cs`
- `NAFServer/src/Application/DTOs/Lookup/SharedFolderItemDTO.cs`
- `NAFServer/src/Application/DTOs/NAF/AddBasicResourcesDTO.cs`
- `NAFServer/src/Application/DTOs/NAF/AddBasicResourceResultDTO.cs`
- `NAFServer/src/Domain/Interface/Repository/IGroupEmailRepository.cs`
- `NAFServer/src/Domain/Interface/Repository/ISharedFolderRepository.cs`
- `NAFServer/src/Infrastructure/Persistence/Repositories/GroupEmailRepository.cs`
- `NAFServer/src/Infrastructure/Persistence/Repositories/SharedFolderRepository.cs`
- `NAFServer/src/Application/Interfaces/IInternetPurposeService.cs`
- `NAFServer/src/Application/Interfaces/IInternetResourceService.cs`
- `NAFServer/src/Application/Interfaces/IGroupEmailService.cs`
- `NAFServer/src/Application/Interfaces/ISharedFolderService.cs`
- `NAFServer/src/Application/Services/InternetPurposeService.cs`
- `NAFServer/src/Application/Services/InternetResourceService.cs`
- `NAFServer/src/Application/Services/GroupEmailService.cs`
- `NAFServer/src/Application/Services/SharedFolderService.cs`
- `NAFServer/src/API/Controllers/InternetPurposesController.cs`
- `NAFServer/src/API/Controllers/InternetResourcesController.cs`
- `NAFServer/src/API/Controllers/GroupEmailsController.cs`
- `NAFServer/src/API/Controllers/SharedFoldersController.cs`

**Modified backend files:**
- `NAFServer/src/Application/DTOs/ResourceRequest/AdditionalInfo/InternetInfoDTO.cs`
- `NAFServer/src/Application/DTOs/ResourceRequest/AdditionalInfo/SharedFolderInfoDTO.cs`
- `NAFServer/src/Application/DTOs/ResourceRequest/AdditionalInfo/GroupEmailInfoDTO.cs`
- `NAFServer/src/Mapper/Helper/AdditionalInfoMapper.cs`
- `NAFServer/src/Application/Services/ResourceRequestService.cs`
- `NAFServer/src/Application/Interfaces/INAFService.cs`
- `NAFServer/src/Application/Services/NAFService.cs`
- `NAFServer/src/API/Controllers/NAFsController.cs`
- `NAFServer/Program.cs`

**New frontend files:**
- `NAFClient/src/services/EntityAPI/resourceMetadataService.ts`
- `NAFClient/src/features/naf/hooks/useAddResource.ts`
- `NAFClient/src/features/naf/components/addResourceDialog.tsx`

**Modified frontend files:**
- `NAFClient/src/types/api/naf.ts`
- `NAFClient/src/services/EntityAPI/resourceRequestService.ts`
- `NAFClient/src/features/resources/hooks/useResource.tsx` (add `useResourceMetadata` export here)
- `NAFClient/src/features/naf/pages/ViewNAFDetail.tsx`

---

## Task 1: Extend AdditionalInfo DTOs and Update Mapper

Add `InternetResourceId`, `SharedFolderId`/`Remarks`, and `GroupEmailId`/`DepartmentId` to the response DTOs so the frontend can do ID-based duplicate filtering.

**Files:**
- Modify: `NAFServer/src/Application/DTOs/ResourceRequest/AdditionalInfo/InternetInfoDTO.cs`
- Modify: `NAFServer/src/Application/DTOs/ResourceRequest/AdditionalInfo/SharedFolderInfoDTO.cs`
- Modify: `NAFServer/src/Application/DTOs/ResourceRequest/AdditionalInfo/GroupEmailInfoDTO.cs`
- Modify: `NAFServer/src/Mapper/Helper/AdditionalInfoMapper.cs`

- [ ] **Step 1: Update `InternetInfoDTO.cs`**

```csharp
namespace NAFServer.src.Application.DTOs.ResourceRequest.AdditionalInfo
{
    public record InternetInfoDTO(
        int InternetResourceId,
        string Purpose,
        string Resource
    ) : AdditionalInfoDTO
    {
        public override AdditionalInfoType Type => AdditionalInfoType.Internet;
    }
}
```

- [ ] **Step 2: Update `SharedFolderInfoDTO.cs`**

```csharp
namespace NAFServer.src.Application.DTOs.ResourceRequest.AdditionalInfo
{
    public record SharedFolderInfoDTO(
        int SharedFolderId,
        string Name,
        string DepartmentId,
        string Remarks
    ) : AdditionalInfoDTO
    {
        public override AdditionalInfoType Type => AdditionalInfoType.SharedFolder;
    }
}
```

- [ ] **Step 3: Update `GroupEmailInfoDTO.cs`**

```csharp
namespace NAFServer.src.Application.DTOs.ResourceRequest.AdditionalInfo
{
    public record GroupEmailInfoDTO(
        int GroupEmailId,
        string Email,
        string DepartmentId
    ) : AdditionalInfoDTO
    {
        public override AdditionalInfoType Type => AdditionalInfoType.GroupEmail;
    }
}
```

- [ ] **Step 4: Update `AdditionalInfoMapper.cs`**

```csharp
using NAFServer.src.Application.DTOs.ResourceRequest.AdditionalInfo;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface;

namespace NAFServer.src.Mapper.Helper
{
    public class AdditionalInfoMapper
    {
        public static AdditionalInfoDTO MapAdditionalInfo(ResourceRequestAdditionalInfo info)
        {
            return info switch
            {
                InternetRequestInfo internet =>
                    new InternetInfoDTO(
                        internet.InternetResourceId,
                        internet.InternetResource.Purpose.Name,
                        internet.InternetResource.Name
                    ),

                SharedFolderRequestInfo folder =>
                    new SharedFolderInfoDTO(
                        folder.SharedFolderId,
                        folder.SharedFolder.Name,
                        folder.SharedFolder.DepartmentId,
                        folder.SharedFolder.Remarks
                    ),

                GroupEmailRequestInfo email =>
                    new GroupEmailInfoDTO(
                        email.GroupEmailId,
                        email.GroupEmail.Email,
                        email.GroupEmail.DepartmentId
                    ),

                _ => throw new Exception("Unknown AdditionalInfo type")
            };
        }
    }
}
```

- [ ] **Step 5: Build to verify**

```bash
cd NAFServer && dotnet build
```

Expected: Build succeeded with 0 errors.

- [ ] **Step 6: Commit**

```bash
git add NAFServer/src/Application/DTOs/ResourceRequest/AdditionalInfo/InternetInfoDTO.cs
git add NAFServer/src/Application/DTOs/ResourceRequest/AdditionalInfo/SharedFolderInfoDTO.cs
git add NAFServer/src/Application/DTOs/ResourceRequest/AdditionalInfo/GroupEmailInfoDTO.cs
git add NAFServer/src/Mapper/Helper/AdditionalInfoMapper.cs
git commit -m "feat: extend AdditionalInfo DTOs with IDs and missing fields"
```

---

## Task 2: Fix Duplicate Validation in CreateSpecialAsync

`CreateSpecialAsync` never calls `handler.Validate()`. Add the call after `CreateAdditionalInfo` so duplicate special resources are rejected on the backend.

**Files:**
- Modify: `NAFServer/src/Application/Services/ResourceRequestService.cs:48-112`

- [ ] **Step 1: Update `CreateSpecialAsync` in `ResourceRequestService.cs`**

Replace the method body (lines 48–112) with the following. The only addition is the three lines after `additionalInfo.Id = Guid.NewGuid()`:

```csharp
public async Task<ResourceRequestDTO> CreateSpecialAsync(CreateResourceRequestDTO request)
{
    if (request.additionalInfo is not JsonElement element)
        throw new Exception("Additional Info is required.");

    var handler = _resourceRequestHandlerRegistry.GetHandler(request.resourceId);

    var additionalInfo = await handler.CreateAdditionalInfo(element);
    additionalInfo.Id = Guid.NewGuid();

    // Validate for duplicates before opening any transaction
    bool isValid = await handler.Validate(additionalInfo, request.nafId);
    if (!isValid)
        throw new ApplicationException(
            $"Duplicate resource request: this resource is already requested in this NAF.");

    var resource = await _resourceRepository.GetResourceByIdAsync(request.resourceId);
    if (!resource.IsSpecial)
    {
        throw new ArgumentException("Invalid Resource. Using Create Special for basic resource.");
    }
    await using var transaction = await _context.Database.BeginTransactionAsync();

    try
    {
        var naf = await _nafRepository.GetByIdAsync(request.nafId);

        _context.Resources.Attach(resource);
        _context.NAFs.Attach(naf);

        var workflowId = await _approvalWorkflowTemplateRepository
            .GetActiveWorkflowIdOfResourceAsync(request.resourceId);

        var rr = new ResourceRequest(request.nafId, request.resourceId, workflowId, additionalInfo, Progress.OPEN)
        {
            NAF = naf,
            AdditionalInfo = additionalInfo
        };

        additionalInfo.ResourceRequest = rr;

        _context.ResourceRequests.Add(rr);

        await _context.SaveChangesAsync();

        var purpose = new ResourceRequestPurpose(request.purpose, rr.Id, null);
        await _context.ResourceRequestPurposes.AddAsync(purpose);

        var approvers = await FetchApproversAsync(rr);
        if (approvers.Count > 0)
        {
            await _context.ResourceRequestApprovalSteps.AddRangeAsync(approvers);
        }
        else
        {
            rr.SetToAccomplished();
        }

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return ResourceRequestMapper.ToDTO(rr);
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}
```

- [ ] **Step 2: Build to verify**

```bash
cd NAFServer && dotnet build
```

Expected: Build succeeded with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/Application/Services/ResourceRequestService.cs
git commit -m "fix: call handler.Validate before saving special resource request"
```

---

## Task 3: Create GroupEmail and SharedFolder Repositories

These entities are currently accessed via raw `AppDbContext` in handlers. Adding proper repositories follows the project's caching pattern and enables the lookup services.

**Files:**
- Create: `NAFServer/src/Domain/Interface/Repository/IGroupEmailRepository.cs`
- Create: `NAFServer/src/Domain/Interface/Repository/ISharedFolderRepository.cs`
- Create: `NAFServer/src/Infrastructure/Persistence/Repositories/GroupEmailRepository.cs`
- Create: `NAFServer/src/Infrastructure/Persistence/Repositories/SharedFolderRepository.cs`

- [ ] **Step 1: Create `IGroupEmailRepository.cs`**

```csharp
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IGroupEmailRepository
    {
        Task<List<GroupEmail>> GetAllAsync();
    }
}
```

- [ ] **Step 2: Create `ISharedFolderRepository.cs`**

```csharp
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface ISharedFolderRepository
    {
        Task<List<SharedFolder>> GetAllAsync();
    }
}
```

- [ ] **Step 3: Create `GroupEmailRepository.cs`**

```csharp
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class GroupEmailRepository : IGroupEmailRepository
    {
        private readonly AppDbContext _context;
        private readonly CacheService _cacheService;
        private readonly string _cacheKey = "all_GroupEmails";

        public GroupEmailRepository(AppDbContext context, CacheService cacheService)
        {
            _context = context;
            _cacheService = cacheService;
        }

        public async Task<List<GroupEmail>> GetAllAsync()
        {
            return await _cacheService.GetOrSetAsync(_cacheKey, async () =>
                await _context.GroupEmails.ToListAsync());
        }
    }
}
```

- [ ] **Step 4: Create `SharedFolderRepository.cs`**

```csharp
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class SharedFolderRepository : ISharedFolderRepository
    {
        private readonly AppDbContext _context;
        private readonly CacheService _cacheService;
        private readonly string _cacheKey = "all_SharedFolders";

        public SharedFolderRepository(AppDbContext context, CacheService cacheService)
        {
            _context = context;
            _cacheService = cacheService;
        }

        public async Task<List<SharedFolder>> GetAllAsync()
        {
            return await _cacheService.GetOrSetAsync(_cacheKey, async () =>
                await _context.SharedFolders.ToListAsync());
        }
    }
}
```

- [ ] **Step 5: Build to verify**

```bash
cd NAFServer && dotnet build
```

Expected: Build succeeded with 0 errors.

- [ ] **Step 6: Commit**

```bash
git add NAFServer/src/Domain/Interface/Repository/IGroupEmailRepository.cs
git add NAFServer/src/Domain/Interface/Repository/ISharedFolderRepository.cs
git add NAFServer/src/Infrastructure/Persistence/Repositories/GroupEmailRepository.cs
git add NAFServer/src/Infrastructure/Persistence/Repositories/SharedFolderRepository.cs
git commit -m "feat: add GroupEmail and SharedFolder repositories"
```

---

## Task 4: Create Lookup DTOs and Services

Four services that expose reference data to controllers. Each wraps its repository and maps entities to DTOs.

**Files:**
- Create: `NAFServer/src/Application/DTOs/Lookup/InternetPurposeDTO.cs`
- Create: `NAFServer/src/Application/DTOs/Lookup/InternetResourceItemDTO.cs`
- Create: `NAFServer/src/Application/DTOs/Lookup/GroupEmailDTO.cs`
- Create: `NAFServer/src/Application/DTOs/Lookup/SharedFolderItemDTO.cs`
- Create: `NAFServer/src/Application/Interfaces/IInternetPurposeService.cs`
- Create: `NAFServer/src/Application/Interfaces/IInternetResourceService.cs`
- Create: `NAFServer/src/Application/Interfaces/IGroupEmailService.cs`
- Create: `NAFServer/src/Application/Interfaces/ISharedFolderService.cs`
- Create: `NAFServer/src/Application/Services/InternetPurposeService.cs`
- Create: `NAFServer/src/Application/Services/InternetResourceService.cs`
- Create: `NAFServer/src/Application/Services/GroupEmailService.cs`
- Create: `NAFServer/src/Application/Services/SharedFolderService.cs`

- [ ] **Step 1: Create DTOs**

`NAFServer/src/Application/DTOs/Lookup/InternetPurposeDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.Lookup
{
    public record InternetPurposeDTO(int Id, string Name, string Description);
}
```

`NAFServer/src/Application/DTOs/Lookup/InternetResourceItemDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.Lookup
{
    public record InternetResourceItemDTO(int Id, string Name, string Url, string? Description, int PurposeId);
}
```

`NAFServer/src/Application/DTOs/Lookup/GroupEmailDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.Lookup
{
    public record GroupEmailDTO(int Id, string Email, string DepartmentId);
}
```

`NAFServer/src/Application/DTOs/Lookup/SharedFolderItemDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.Lookup
{
    public record SharedFolderItemDTO(int Id, string Name, string Remarks, string DepartmentId);
}
```

- [ ] **Step 2: Create service interfaces**

`NAFServer/src/Application/Interfaces/IInternetPurposeService.cs`:
```csharp
using NAFServer.src.Application.DTOs.Lookup;

namespace NAFServer.src.Application.Interfaces
{
    public interface IInternetPurposeService
    {
        Task<List<InternetPurposeDTO>> GetAllAsync();
    }
}
```

`NAFServer/src/Application/Interfaces/IInternetResourceService.cs`:
```csharp
using NAFServer.src.Application.DTOs.Lookup;

namespace NAFServer.src.Application.Interfaces
{
    public interface IInternetResourceService
    {
        Task<List<InternetResourceItemDTO>> GetAllAsync();
    }
}
```

`NAFServer/src/Application/Interfaces/IGroupEmailService.cs`:
```csharp
using NAFServer.src.Application.DTOs.Lookup;

namespace NAFServer.src.Application.Interfaces
{
    public interface IGroupEmailService
    {
        Task<List<GroupEmailDTO>> GetAllAsync();
    }
}
```

`NAFServer/src/Application/Interfaces/ISharedFolderService.cs`:
```csharp
using NAFServer.src.Application.DTOs.Lookup;

namespace NAFServer.src.Application.Interfaces
{
    public interface ISharedFolderService
    {
        Task<List<SharedFolderItemDTO>> GetAllAsync();
    }
}
```

- [ ] **Step 3: Create service implementations**

`NAFServer/src/Application/Services/InternetPurposeService.cs`:
```csharp
using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class InternetPurposeService : IInternetPurposeService
    {
        private readonly IInternetPurposeRepository _repo;

        public InternetPurposeService(IInternetPurposeRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<InternetPurposeDTO>> GetAllAsync()
        {
            var items = await _repo.GetAllAsync();
            return items.Select(i => new InternetPurposeDTO(i.Id, i.Name, i.Description)).ToList();
        }
    }
}
```

`NAFServer/src/Application/Services/InternetResourceService.cs`:
```csharp
using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class InternetResourceService : IInternetResourceService
    {
        private readonly IInternetResourceRepository _repo;

        public InternetResourceService(IInternetResourceRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<InternetResourceItemDTO>> GetAllAsync()
        {
            var items = await _repo.GetAllAsync();
            return items.Select(i => new InternetResourceItemDTO(
                i.Id, i.Name, i.Url, i.Description, i.PurposeId)).ToList();
        }
    }
}
```

`NAFServer/src/Application/Services/GroupEmailService.cs`:
```csharp
using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class GroupEmailService : IGroupEmailService
    {
        private readonly IGroupEmailRepository _repo;

        public GroupEmailService(IGroupEmailRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<GroupEmailDTO>> GetAllAsync()
        {
            var items = await _repo.GetAllAsync();
            return items.Select(i => new GroupEmailDTO(i.Id, i.Email, i.DepartmentId)).ToList();
        }
    }
}
```

`NAFServer/src/Application/Services/SharedFolderService.cs`:
```csharp
using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class SharedFolderService : ISharedFolderService
    {
        private readonly ISharedFolderRepository _repo;

        public SharedFolderService(ISharedFolderRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<SharedFolderItemDTO>> GetAllAsync()
        {
            var items = await _repo.GetAllAsync();
            return items.Select(i => new SharedFolderItemDTO(
                i.Id, i.Name, i.Remarks, i.DepartmentId)).ToList();
        }
    }
}
```

- [ ] **Step 4: Build to verify**

```bash
cd NAFServer && dotnet build
```

Expected: Build succeeded with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add NAFServer/src/Application/DTOs/Lookup/
git add NAFServer/src/Application/Interfaces/IInternetPurposeService.cs
git add NAFServer/src/Application/Interfaces/IInternetResourceService.cs
git add NAFServer/src/Application/Interfaces/IGroupEmailService.cs
git add NAFServer/src/Application/Interfaces/ISharedFolderService.cs
git add NAFServer/src/Application/Services/InternetPurposeService.cs
git add NAFServer/src/Application/Services/InternetResourceService.cs
git add NAFServer/src/Application/Services/GroupEmailService.cs
git add NAFServer/src/Application/Services/SharedFolderService.cs
git commit -m "feat: add lookup DTOs and services for internet, group email, shared folder"
```

---

## Task 5: Create Lookup Controllers and Register DI

Expose the four lookup endpoints and register all new services/repositories in `Program.cs`. Also register `IInternetPurposeRepository` which was missing.

**Files:**
- Create: `NAFServer/src/API/Controllers/InternetPurposesController.cs`
- Create: `NAFServer/src/API/Controllers/InternetResourcesController.cs`
- Create: `NAFServer/src/API/Controllers/GroupEmailsController.cs`
- Create: `NAFServer/src/API/Controllers/SharedFoldersController.cs`
- Modify: `NAFServer/Program.cs`

- [ ] **Step 1: Create the four controllers**

`NAFServer/src/API/Controllers/InternetPurposesController.cs`:
```csharp
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InternetPurposesController : ControllerBase
    {
        private readonly IInternetPurposeService _service;

        public InternetPurposesController(IInternetPurposeService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            return Ok(await _service.GetAllAsync());
        }
    }
}
```

`NAFServer/src/API/Controllers/InternetResourcesController.cs`:
```csharp
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InternetResourcesController : ControllerBase
    {
        private readonly IInternetResourceService _service;

        public InternetResourcesController(IInternetResourceService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            return Ok(await _service.GetAllAsync());
        }
    }
}
```

`NAFServer/src/API/Controllers/GroupEmailsController.cs`:
```csharp
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GroupEmailsController : ControllerBase
    {
        private readonly IGroupEmailService _service;

        public GroupEmailsController(IGroupEmailService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            return Ok(await _service.GetAllAsync());
        }
    }
}
```

`NAFServer/src/API/Controllers/SharedFoldersController.cs`:
```csharp
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SharedFoldersController : ControllerBase
    {
        private readonly ISharedFolderService _service;

        public SharedFoldersController(ISharedFolderService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            return Ok(await _service.GetAllAsync());
        }
    }
}
```

- [ ] **Step 2: Register new services and repositories in `Program.cs`**

Add the following lines after the existing `builder.Services.AddScoped<IResourceService, ResourceService>();` line:

```csharp
builder.Services.AddScoped<IInternetPurposeRepository, InternetPurposeRepository>();
builder.Services.AddScoped<IGroupEmailRepository, GroupEmailRepository>();
builder.Services.AddScoped<ISharedFolderRepository, SharedFolderRepository>();
builder.Services.AddScoped<IInternetPurposeService, InternetPurposeService>();
builder.Services.AddScoped<IInternetResourceService, InternetResourceService>();
builder.Services.AddScoped<IGroupEmailService, GroupEmailService>();
builder.Services.AddScoped<ISharedFolderService, SharedFolderService>();
```

Also add the missing using statements at the top of `Program.cs` if needed (the compiler will tell you).

- [ ] **Step 3: Build to verify**

```bash
cd NAFServer && dotnet build
```

Expected: Build succeeded with 0 errors.

- [ ] **Step 4: Manual smoke test**

```bash
cd NAFServer && dotnet run
```

Visit `http://localhost:5186/swagger` and confirm all four new GET endpoints appear:
- `GET /api/InternetPurposes`
- `GET /api/InternetResources`
- `GET /api/GroupEmails`
- `GET /api/SharedFolders`

Execute each and verify they return arrays (even if empty).

- [ ] **Step 5: Commit**

```bash
git add NAFServer/src/API/Controllers/InternetPurposesController.cs
git add NAFServer/src/API/Controllers/InternetResourcesController.cs
git add NAFServer/src/API/Controllers/GroupEmailsController.cs
git add NAFServer/src/API/Controllers/SharedFoldersController.cs
git add NAFServer/Program.cs
git commit -m "feat: add lookup controllers and register DI for internet, group email, shared folder"
```

---

## Task 6: Add Basic Resources Endpoint to Existing NAF

`POST /api/NAFs/{nafId}/resources/basic` loops through resource IDs, calls `CreateBasicAsync` for each, and returns per-item success/failure results.

**Files:**
- Create: `NAFServer/src/Application/DTOs/NAF/AddBasicResourcesDTO.cs`
- Create: `NAFServer/src/Application/DTOs/NAF/AddBasicResourceResultDTO.cs`
- Modify: `NAFServer/src/Application/Interfaces/INAFService.cs`
- Modify: `NAFServer/src/Application/Services/NAFService.cs`
- Modify: `NAFServer/src/API/Controllers/NAFsController.cs`

- [ ] **Step 1: Create DTOs**

`NAFServer/src/Application/DTOs/NAF/AddBasicResourcesDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.NAF
{
    public record AddBasicResourcesDTO(List<int> ResourceIds);
}
```

`NAFServer/src/Application/DTOs/NAF/AddBasicResourceResultDTO.cs`:
```csharp
using NAFServer.src.Application.DTOs.ResourceRequest;

namespace NAFServer.src.Application.DTOs.NAF
{
    public record AddBasicResourceResultDTO(
        int ResourceId,
        bool Success,
        string? Error,
        ResourceRequestDTO? Data
    );
}
```

- [ ] **Step 2: Add method to `INAFService.cs`**

Add this line to the interface:

```csharp
Task<List<AddBasicResourceResultDTO>> AddBasicResourcesToNAFAsync(Guid nafId, List<int> resourceIds);
```

Full updated file:
```csharp
using NAFServer.src.Application.DTOs.NAF;
using static NAFServer.src.Application.DTOs.Common.PaginatedDTO;

namespace NAFServer.src.Application.Interfaces
{
    public interface INAFService
    {
        public Task<NAFDTO> GetNAFByIdAsync(Guid id);
        public Task<NAFDTO> CreateAsync(CreateNAFRequestDTO request);
        public Task<PagedResult<NAFDTO>> GetNAFsUnderEmployeeAsync(string employeeId, int page);
        public Task<NAFDTO> DeactivateNAFAsync(Guid nafId);
        public Task<NAFDTO> ActivateNAFAsync(Guid nafId);
        public Task<PagedResult<NAFDTO>> GetNAFToApproveAsync(string employeeId, int page);
        public Task<bool> EmployeeHasNAFForDepartmentAsync(string employeeId, string departmentId);
        public Task<List<NAFDTO>> GetNAFByEmployeeIdAsync(string employeeId);
        public Task<List<AddBasicResourceResultDTO>> AddBasicResourcesToNAFAsync(Guid nafId, List<int> resourceIds);
    }
}
```

- [ ] **Step 3: Implement in `NAFService.cs`**

Add the following method to the `NAFService` class (after `GetNAFByEmployeeIdAsync`):

```csharp
public async Task<List<AddBasicResourceResultDTO>> AddBasicResourcesToNAFAsync(Guid nafId, List<int> resourceIds)
{
    var results = new List<AddBasicResourceResultDTO>();

    foreach (var resourceId in resourceIds.Distinct())
    {
        try
        {
            bool alreadyExists = await _context.ResourceRequests
                .AnyAsync(rr => rr.NAFId == nafId && rr.ResourceId == resourceId);

            if (alreadyExists)
            {
                results.Add(new AddBasicResourceResultDTO(
                    resourceId, false, "Resource already exists in this NAF", null));
                continue;
            }

            var rr = await _resourceRequestService.CreateBasicAsync(
                new CreateResourceRequestDTO(nafId, resourceId, "Basic resource needed", null));

            results.Add(new AddBasicResourceResultDTO(resourceId, true, null, rr));
        }
        catch (Exception ex)
        {
            results.Add(new AddBasicResourceResultDTO(resourceId, false, ex.Message, null));
        }
    }

    return results;
}
```

Also add the missing `using Microsoft.EntityFrameworkCore;` at the top if not already present.

- [ ] **Step 4: Add endpoint to `NAFsController.cs`**

Add this action to the `NAFsController` class:

```csharp
[HttpPost("{nafId:guid}/resources/basic")]
public async Task<IActionResult> AddBasicResources(Guid nafId, [FromBody] AddBasicResourcesDTO request)
{
    try
    {
        var results = await _nafService.AddBasicResourcesToNAFAsync(nafId, request.ResourceIds);
        return Ok(results);
    }
    catch (Exception ex)
    {
        return BadRequest(ex.Message);
    }
}
```

Add `using NAFServer.src.Application.DTOs.NAF;` at the top of the controller file if not already present.

- [ ] **Step 5: Build to verify**

```bash
cd NAFServer && dotnet build
```

Expected: Build succeeded with 0 errors.

- [ ] **Step 6: Manual smoke test**

Run the server (`dotnet run`), open Swagger, and call `POST /api/NAFs/{nafId}/resources/basic` with a valid NAF GUID and `{ "resourceIds": [3] }`. Verify it returns a results array.

- [ ] **Step 7: Commit**

```bash
git add NAFServer/src/Application/DTOs/NAF/AddBasicResourcesDTO.cs
git add NAFServer/src/Application/DTOs/NAF/AddBasicResourceResultDTO.cs
git add NAFServer/src/Application/Interfaces/INAFService.cs
git add NAFServer/src/Application/Services/NAFService.cs
git add NAFServer/src/API/Controllers/NAFsController.cs
git commit -m "feat: add POST /api/NAFs/{nafId}/resources/basic endpoint"
```

---

## Task 7: Update Frontend Types

Add the new ID fields to the existing `AdditionalInfo` union types so the frontend can filter already-used options. Add types for the four lookup responses.

**Files:**
- Modify: `NAFClient/src/types/api/naf.ts`

- [ ] **Step 1: Update `naf.ts`**

Replace the three `AdditionalInfo` interfaces and add new lookup types. The full updated file:

```typescript
import type { Progress } from "../enum/progress";
import type { Status } from "../enum/status";
import type { Employee } from "./employee";
import type { Entity } from "./entity";

export interface NAF extends Entity<string> {
  reference: string;
  requestorId: string;
  employee: Employee;
  accomplishedAt?: string;
  submittedAt: string;
  progress: Progress;
  createdAt: string;
  updatedAt: string;
  departmentId: string;
  resourceRequests: ResourceRequest[];
}

export interface ResourceRequest extends Entity<string> {
  currentStep: number;
  progress: Progress;
  accomplishedAt?: string;
  nafId: string;
  resource: Resource;
  approvalWorkflowTemplateId: string;
  additionalInfo?: AdditionalInfo;
  purposes: Purpose[];
  steps: Step[];
}

export interface Resource extends Entity<number> {
  name: string;
  color?: string;
  iconUrl: string;
  isActive: boolean;
  isSpecial: boolean;
}

export interface Purpose extends Entity<string> {
  id: string;
  purpose: string;
  resourceRequestId: string;
  resourceRequestApprovalStepHistoryId?: null;
  createdAt: string;
}

export interface Step extends Entity<string> {
  id: string;
  resourceRequestId: string;
  stepOrder: number;
  approverId: string;
  progress: number;
  approvedAt?: string;
  histories: History[];
}

export interface History extends Entity<string> {
  id: string;
  status: Status;
  comment?: string;
  reasonForRejection?: string;
  actionAt: string;
  resourceRequestApprovalStepId: string;
}

export type AdditionalInfo =
  | InternetRequestInfo
  | SharedFolderInfo
  | GroupEmailInfo;

interface BaseAdditionalInfo {
  type: number;
}

export interface InternetRequestInfo extends BaseAdditionalInfo {
  type: 0;
  internetResourceId: number;
  purpose: string;
  resource: string;
}

export interface SharedFolderInfo extends BaseAdditionalInfo {
  type: 1;
  sharedFolderId: number;
  name: string;
  departmentId: string;
  remarks: string;
}

export interface GroupEmailInfo extends BaseAdditionalInfo {
  type: 2;
  groupEmailId: number;
  email: string;
  departmentId: string;
}

export function handleAdditionalInfoStructured(info: AdditionalInfo) {
  switch (info.type) {
    case 0:
      return {
        label: "Internet Request",
        data: {
          purpose: info.purpose,
          resource: info.resource,
        },
      };

    case 1:
      return {
        label: "Shared Folder",
        data: {
          name: info.name,
          departmentId: info.departmentId,
        },
      };

    case 2:
      return {
        label: "Group Email",
        data: {
          email: info.email,
        },
      };

    default: {
      const _exhaustive: never = info;
      return _exhaustive;
    }
  }
}

export enum ProgressStatus {
  "Open" = 0,
  "In Progress" = 1,
  "Rejected" = 2,
  "For Screening" = 3,
  "Accomplished" = 4,
  "Not Accomplished" = 5,
}

export type PurposeProps = {
  purpose: string;
  resourceRequestApprovalStepHistoryId?: string;
};

// ── Lookup types (used by Add Resource modal) ─────────────────────────────────

export interface InternetPurposeItem {
  id: number;
  name: string;
  description: string;
}

export interface InternetResourceItem {
  id: number;
  name: string;
  url: string;
  description?: string;
  purposeId: number;
}

export interface GroupEmailItem {
  id: number;
  email: string;
  departmentId: string;
}

export interface SharedFolderItem {
  id: number;
  name: string;
  remarks: string;
  departmentId: string;
}

export interface AddBasicResourceResult {
  resourceId: number;
  success: boolean;
  error?: string;
  data?: ResourceRequest;
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd NAFClient && npm run build 2>&1 | head -40
```

Expected: No type errors related to `naf.ts`.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/types/api/naf.ts
git commit -m "feat: update AdditionalInfo types with IDs and add lookup types"
```

---

## Task 8: Create `resourceMetadataService.ts` and Add `createResourceRequest`

**Files:**
- Create: `NAFClient/src/services/EntityAPI/resourceMetadataService.ts`
- Modify: `NAFClient/src/services/EntityAPI/resourceRequestService.ts`

- [ ] **Step 1: Create `resourceMetadataService.ts`**

```typescript
import { api } from "../api";
import type {
  InternetPurposeItem,
  InternetResourceItem,
  GroupEmailItem,
  SharedFolderItem,
  AddBasicResourceResult,
} from "@/types/api/naf";

export const getInternetPurposes = async (): Promise<InternetPurposeItem[]> => {
  return (await api.get("/InternetPurposes")).data;
};

export const getInternetResources = async (): Promise<InternetResourceItem[]> => {
  return (await api.get("/InternetResources")).data;
};

export const getGroupEmails = async (): Promise<GroupEmailItem[]> => {
  return (await api.get("/GroupEmails")).data;
};

export const getSharedFolders = async (): Promise<SharedFolderItem[]> => {
  return (await api.get("/SharedFolders")).data;
};

export const addBasicResourcesToNAF = async (
  nafId: string,
  resourceIds: number[],
): Promise<AddBasicResourceResult[]> => {
  return (await api.post(`/NAFs/${nafId}/resources/basic`, { resourceIds })).data;
};
```

- [ ] **Step 2: Add `createResourceRequest` to `resourceRequestService.ts`**

Add this function at the top of `resourceRequestService.ts` (before the existing functions):

```typescript
export const createResourceRequest = async (payload: {
  nafId: string;
  resourceId: number;
  purpose: string;
  additionalInfo: Record<string, unknown>;
}): Promise<ResourceRequest> => {
  return (await api.post("/Requests", payload)).data;
};
```

Also add `ResourceRequest` to the import at the top of the file:

```typescript
import type { NAF, PurposeProps, ResourceRequest } from "@/types/api/naf";
```

- [ ] **Step 3: TypeScript check**

```bash
cd NAFClient && npm run build 2>&1 | head -40
```

Expected: No new type errors.

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/services/EntityAPI/resourceMetadataService.ts
git add NAFClient/src/services/EntityAPI/resourceRequestService.ts
git commit -m "feat: add resourceMetadataService and createResourceRequest service function"
```

---

## Task 9: Add `useResourceMetadata` to `useResource.tsx`

Add queries for internet purposes, internet resources, group emails, and shared folders as a new exported hook in the existing file. These use a long `staleTime` since they are reference data that rarely changes.

**Files:**
- Modify: `NAFClient/src/features/resources/hooks/useResource.tsx`

- [ ] **Step 1: Replace the file contents** (the existing `useResource` export is preserved unchanged; `useResourceMetadata` is added below it)

```typescript
import {
  getInternetPurposes,
  getInternetResources,
  getGroupEmails,
  getSharedFolders,
} from "@/services/EntityAPI/resourceMetadataService";
import { getAllResources } from "@/services/EntityAPI/resourceService";
import type {
  InternetPurposeItem,
  InternetResourceItem,
  GroupEmailItem,
  SharedFolderItem,
  Resource,
} from "@/types/api/naf";
import { useQuery } from "@tanstack/react-query";

const STALE_24H = 24 * 60 * 60 * 1000;

export const useResource = () => {
  const getAllResource = useQuery<Resource[], Error>({
    queryKey: ["allResources"],
    queryFn: () => getAllResources(),
    staleTime: STALE_24H,
  });

  return {
    getAllResource,
    isLoading: getAllResource.isLoading,
    isError: getAllResource.isError,
  };
};

export const useResourceMetadata = () => {
  const internetPurposes = useQuery<InternetPurposeItem[], Error>({
    queryKey: ["internetPurposes"],
    queryFn: getInternetPurposes,
    staleTime: STALE_24H,
  });

  const internetResources = useQuery<InternetResourceItem[], Error>({
    queryKey: ["internetResources"],
    queryFn: getInternetResources,
    staleTime: STALE_24H,
  });

  const groupEmails = useQuery<GroupEmailItem[], Error>({
    queryKey: ["groupEmails"],
    queryFn: getGroupEmails,
    staleTime: STALE_24H,
  });

  const sharedFolders = useQuery<SharedFolderItem[], Error>({
    queryKey: ["sharedFolders"],
    queryFn: getSharedFolders,
    staleTime: STALE_24H,
  });

  return {
    internetPurposes,
    internetResources,
    groupEmails,
    sharedFolders,
    isLoading:
      internetPurposes.isLoading ||
      internetResources.isLoading ||
      groupEmails.isLoading ||
      sharedFolders.isLoading,
  };
};
```

- [ ] **Step 2: TypeScript check**

```bash
cd NAFClient && npm run build 2>&1 | head -40
```

Expected: No errors. The existing `createNAFDialog.tsx` import (`from "@/features/resources/hooks/useResource"`) still works because `useResource` is still exported from the same file.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/resources/hooks/useResource.tsx
git commit -m "feat: add useResourceMetadata hook with lookup queries"
```

---

## Task 10: Create `useAddResource` Hook

Handles all submission logic: basic resources via the batch endpoint, special resources via individual `POST /api/Requests` calls, partial-success reporting via `Promise.allSettled`-style error collection.

**Files:**
- Create: `NAFClient/src/features/naf/hooks/useAddResource.ts`

- [ ] **Step 1: Create `useAddResource.ts`**

```typescript
import { useQueryClient } from "@tanstack/react-query";
import {
  addBasicResourcesToNAF,
} from "@/services/EntityAPI/resourceMetadataService";
import { createResourceRequest } from "@/services/EntityAPI/resourceRequestService";

export type InternetEntry = {
  _id: string;
  internetPurposeId: number | null;
  internetResourceId: number | null;
  purpose: string;
};

export type GroupEmailEntry = {
  _id: string;
  groupEmailId: number | null;
  purpose: string;
};

export type SharedFolderEntry = {
  _id: string;
  sharedFolderId: number | null;
  purpose: string;
};

type AddResourcesParams = {
  nafId: string;
  basicResourceIds: number[];
  internetEntries: InternetEntry[];
  groupEmailEntries: GroupEmailEntry[];
  sharedFolderEntries: SharedFolderEntry[];
};

export type AddResult = {
  errors: string[];
  allSucceeded: boolean;
};

export const useAddResource = () => {
  const queryClient = useQueryClient();

  const submit = async (params: AddResourcesParams): Promise<AddResult> => {
    const errors: string[] = [];
    let anySuccess = false;

    // ── Basic resources ───────────────────────────────────────────────────────
    if (params.basicResourceIds.length > 0) {
      try {
        const results = await addBasicResourcesToNAF(
          params.nafId,
          params.basicResourceIds,
        );
        results.forEach((r) => {
          if (r.success) {
            anySuccess = true;
          } else {
            errors.push(`Resource ${r.resourceId}: ${r.error ?? "Failed"}`);
          }
        });
      } catch (e: any) {
        errors.push(`Basic resources: ${e.message ?? "Unknown error"}`);
      }
    }

    // ── Special resources (fired in parallel, non-blocking per item) ──────────
    const specialTasks: Promise<void>[] = [];

    params.internetEntries.forEach((entry) => {
      specialTasks.push(
        createResourceRequest({
          nafId: params.nafId,
          resourceId: 1,
          purpose: entry.purpose,
          additionalInfo: { InternetResourceId: entry.internetResourceId! },
        })
          .then(() => {
            anySuccess = true;
          })
          .catch((e: any) => {
            const msg = e?.response?.data ?? e?.message ?? "Unknown error";
            errors.push(`Internet resource: ${msg}`);
          }),
      );
    });

    params.groupEmailEntries.forEach((entry) => {
      specialTasks.push(
        createResourceRequest({
          nafId: params.nafId,
          resourceId: 2,
          purpose: entry.purpose,
          additionalInfo: { GroupEmailId: entry.groupEmailId! },
        })
          .then(() => {
            anySuccess = true;
          })
          .catch((e: any) => {
            const msg = e?.response?.data ?? e?.message ?? "Unknown error";
            errors.push(`Group email: ${msg}`);
          }),
      );
    });

    params.sharedFolderEntries.forEach((entry) => {
      specialTasks.push(
        createResourceRequest({
          nafId: params.nafId,
          resourceId: 3,
          purpose: entry.purpose,
          additionalInfo: { SharedFolderId: entry.sharedFolderId! },
        })
          .then(() => {
            anySuccess = true;
          })
          .catch((e: any) => {
            const msg = e?.response?.data ?? e?.message ?? "Unknown error";
            errors.push(`Shared folder: ${msg}`);
          }),
      );
    });

    await Promise.all(specialTasks);

    if (anySuccess) {
      queryClient.invalidateQueries({ queryKey: ["naf", params.nafId] });
    }

    return { errors, allSucceeded: errors.length === 0 };
  };

  return { submit };
};
```

- [ ] **Step 2: TypeScript check**

```bash
cd NAFClient && npm run build 2>&1 | head -40
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/naf/hooks/useAddResource.ts
git commit -m "feat: add useAddResource hook with partial-success submit logic"
```

---

## Task 11: Create `AddResourceDialog` Component

The modal with two sections: basic resource checkboxes and three special resource multi-entry sections (Internet, Group Email, Shared Folder). Each special resource entry has a remove button and a type-specific form.

**Files:**
- Create: `NAFClient/src/features/naf/components/addResourceDialog.tsx`

- [ ] **Step 1: Create `addResourceDialog.tsx`**

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Select as SelectPrimitive, Popover as PopoverPrimitive } from "radix-ui";
import { Command } from "cmdk";
import { X, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NAF, InternetRequestInfo, GroupEmailInfo, SharedFolderInfo } from "@/types/api/naf";
import { useResource, useResourceMetadata } from "@/features/resources/hooks/useResource";
import {
  useAddResource,
  type InternetEntry,
  type GroupEmailEntry,
  type SharedFolderEntry,
} from "../hooks/useAddResource";

// ── Searchable Combobox ────────────────────────────────────────────────────────

interface ComboboxOption {
  value: number;
  label: string;
}

function SearchableCombobox({
  options,
  value,
  onValueChange,
  placeholder,
  disabled,
}: {
  options: ComboboxOption[];
  value: number | null;
  onValueChange: (v: number) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between font-normal"
          disabled={disabled}
          type="button"
        >
          <span className={selected ? "" : "text-muted-foreground"}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-md border bg-popover p-1 shadow-md"
          sideOffset={4}
        >
          <Command>
            <div className="flex items-center border-b px-2 pb-1 mb-1">
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground py-1"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="px-2 py-3 text-sm text-muted-foreground text-center">
                  No results found
                </p>
              )}
              {filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent cursor-pointer",
                    value === o.value && "bg-accent",
                  )}
                  onClick={() => {
                    onValueChange(o.value);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "h-3.5 w-3.5",
                      value === o.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {o.label}
                </button>
              ))}
            </div>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

// ── Internet Entry Card ────────────────────────────────────────────────────────

function InternetEntryCard({
  entry,
  allInternetResources,
  allInternetPurposes,
  usedInternetResourceIds,
  onChange,
  onRemove,
}: {
  entry: InternetEntry;
  allInternetResources: { id: number; name: string; purposeId: number }[];
  allInternetPurposes: { id: number; name: string }[];
  usedInternetResourceIds: number[];
  onChange: (patch: Partial<InternetEntry>) => void;
  onRemove: () => void;
}) {
  // Purposes that actually have at least one resource
  const availablePurposeIds = Array.from(
    new Set(allInternetResources.map((r) => r.purposeId)),
  );

  const resourcesForPurpose = allInternetResources.filter(
    (r) =>
      r.purposeId === entry.internetPurposeId &&
      !usedInternetResourceIds.includes(r.id),
  );

  return (
    <div className="border rounded-md p-3 space-y-2 relative">
      <button
        type="button"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </button>
      <div className="space-y-1">
        <FieldLabel>Purpose Category</FieldLabel>
        <SelectPrimitive.Root
          value={entry.internetPurposeId?.toString() ?? ""}
          onValueChange={(v) =>
            onChange({ internetPurposeId: Number(v), internetResourceId: null })
          }
        >
          <SelectPrimitive.Trigger className="flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <SelectPrimitive.Value placeholder="Select purpose category" />
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
              <SelectPrimitive.Viewport className="p-1">
                {availablePurposeIds.map((purposeId) => {
                  const purpose = allInternetPurposes.find(
                    (p) => p.id === purposeId,
                  );
                  return (
                    <SelectPrimitive.Item
                      key={purposeId}
                      value={purposeId.toString()}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                    >
                      <SelectPrimitive.ItemText>
                        {purpose?.name ?? `Purpose ${purposeId}`}
                      </SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  );
                })}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>

      <div className="space-y-1">
        <FieldLabel>Internet Resource</FieldLabel>
        <SearchableCombobox
          options={resourcesForPurpose.map((r) => ({
            value: r.id,
            label: r.name,
          }))}
          value={entry.internetResourceId}
          onValueChange={(v) => onChange({ internetResourceId: v })}
          placeholder="Select internet resource"
          disabled={entry.internetPurposeId === null}
        />
      </div>

      <div className="space-y-1">
        <FieldLabel>Purpose of Access</FieldLabel>
        <Textarea
          placeholder="Describe the purpose of access"
          value={entry.purpose}
          onChange={(e) => onChange({ purpose: e.target.value })}
          rows={2}
        />
      </div>
    </div>
  );
}

// ── Group Email Entry Card ────────────────────────────────────────────────────

function GroupEmailEntryCard({
  entry,
  allGroupEmails,
  usedGroupEmailIds,
  onChange,
  onRemove,
}: {
  entry: GroupEmailEntry;
  allGroupEmails: { id: number; email: string; departmentId: string }[];
  usedGroupEmailIds: number[];
  onChange: (patch: Partial<GroupEmailEntry>) => void;
  onRemove: () => void;
}) {
  const options = allGroupEmails
    .filter((g) => !usedGroupEmailIds.includes(g.id))
    .map((g) => ({
      value: g.id,
      label: `${g.email} — ${g.departmentId}`,
    }));

  return (
    <div className="border rounded-md p-3 space-y-2 relative">
      <button
        type="button"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="space-y-1">
        <FieldLabel>Group Email</FieldLabel>
        <SearchableCombobox
          options={options}
          value={entry.groupEmailId}
          onValueChange={(v) => onChange({ groupEmailId: v })}
          placeholder="Search group emails"
        />
      </div>

      <div className="space-y-1">
        <FieldLabel>Purpose of Access</FieldLabel>
        <Textarea
          placeholder="Describe the purpose of access"
          value={entry.purpose}
          onChange={(e) => onChange({ purpose: e.target.value })}
          rows={2}
        />
      </div>
    </div>
  );
}

// ── Shared Folder Entry Card ──────────────────────────────────────────────────

function SharedFolderEntryCard({
  entry,
  allSharedFolders,
  usedSharedFolderIds,
  onChange,
  onRemove,
}: {
  entry: SharedFolderEntry;
  allSharedFolders: { id: number; name: string; departmentId: string; remarks: string }[];
  usedSharedFolderIds: number[];
  onChange: (patch: Partial<SharedFolderEntry>) => void;
  onRemove: () => void;
}) {
  const options = allSharedFolders
    .filter((f) => !usedSharedFolderIds.includes(f.id))
    .map((f) => ({
      value: f.id,
      label: `${f.name} — ${f.departmentId} — ${f.remarks}`,
    }));

  return (
    <div className="border rounded-md p-3 space-y-2 relative">
      <button
        type="button"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="space-y-1">
        <FieldLabel>Shared Folder</FieldLabel>
        <SearchableCombobox
          options={options}
          value={entry.sharedFolderId}
          onValueChange={(v) => onChange({ sharedFolderId: v })}
          placeholder="Search shared folders"
        />
      </div>

      <div className="space-y-1">
        <FieldLabel>Purpose of Access</FieldLabel>
        <Textarea
          placeholder="Describe the purpose of access"
          value={entry.purpose}
          onChange={(e) => onChange({ purpose: e.target.value })}
          rows={2}
        />
      </div>
    </div>
  );
}

// ── Main Dialog ───────────────────────────────────────────────────────────────

interface AddResourceDialogProps {
  naf: NAF;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddResourceDialog({
  naf,
  open,
  onOpenChange,
}: AddResourceDialogProps) {
  const [selectedBasic, setSelectedBasic] = useState<number[]>([]);
  const [internetEntries, setInternetEntries] = useState<InternetEntry[]>([]);
  const [groupEmailEntries, setGroupEmailEntries] = useState<GroupEmailEntry[]>(
    [],
  );
  const [sharedFolderEntries, setSharedFolderEntries] = useState<
    SharedFolderEntry[]
  >([]);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getAllResource } = useResource();
  const { internetPurposes, internetResources, groupEmails, sharedFolders } =
    useResourceMetadata();
  const { submit } = useAddResource();

  // IDs already requested in this NAF
  const existingResourceIds = naf.resourceRequests.map((rr) => rr.resource.id);

  const usedInternetResourceIds = naf.resourceRequests
    .filter((rr) => rr.additionalInfo?.type === 0)
    .map((rr) => (rr.additionalInfo as InternetRequestInfo).internetResourceId);

  const usedGroupEmailIds = naf.resourceRequests
    .filter((rr) => rr.additionalInfo?.type === 2)
    .map((rr) => (rr.additionalInfo as GroupEmailInfo).groupEmailId);

  const usedSharedFolderIds = naf.resourceRequests
    .filter((rr) => rr.additionalInfo?.type === 1)
    .map((rr) => (rr.additionalInfo as SharedFolderInfo).sharedFolderId);

  const availableBasic = (getAllResource.data ?? []).filter(
    (r) => !r.isSpecial && !existingResourceIds.includes(r.id),
  );

  const newEntry = () => crypto.randomUUID();

  const addInternetEntry = () =>
    setInternetEntries((prev) => [
      ...prev,
      { _id: newEntry(), internetPurposeId: null, internetResourceId: null, purpose: "" },
    ]);

  const addGroupEmailEntry = () =>
    setGroupEmailEntries((prev) => [
      ...prev,
      { _id: newEntry(), groupEmailId: null, purpose: "" },
    ]);

  const addSharedFolderEntry = () =>
    setSharedFolderEntries((prev) => [
      ...prev,
      { _id: newEntry(), sharedFolderId: null, purpose: "" },
    ]);

  const patchInternetEntry = (_id: string, patch: Partial<InternetEntry>) =>
    setInternetEntries((prev) =>
      prev.map((e) => (e._id === _id ? { ...e, ...patch } : e)),
    );

  const patchGroupEmailEntry = (_id: string, patch: Partial<GroupEmailEntry>) =>
    setGroupEmailEntries((prev) =>
      prev.map((e) => (e._id === _id ? { ...e, ...patch } : e)),
    );

  const patchSharedFolderEntry = (
    _id: string,
    patch: Partial<SharedFolderEntry>,
  ) =>
    setSharedFolderEntries((prev) =>
      prev.map((e) => (e._id === _id ? { ...e, ...patch } : e)),
    );

  const isInternetEntryComplete = (e: InternetEntry) =>
    e.internetResourceId !== null && e.purpose.trim().length > 0;

  const isGroupEmailEntryComplete = (e: GroupEmailEntry) =>
    e.groupEmailId !== null && e.purpose.trim().length > 0;

  const isSharedFolderEntryComplete = (e: SharedFolderEntry) =>
    e.sharedFolderId !== null && e.purpose.trim().length > 0;

  const hasAnything =
    selectedBasic.length > 0 ||
    internetEntries.length > 0 ||
    groupEmailEntries.length > 0 ||
    sharedFolderEntries.length > 0;

  const allComplete =
    internetEntries.every(isInternetEntryComplete) &&
    groupEmailEntries.every(isGroupEmailEntryComplete) &&
    sharedFolderEntries.every(isSharedFolderEntryComplete);

  const canSubmit = hasAnything && allComplete && !isSubmitting;

  const reset = () => {
    setSelectedBasic([]);
    setInternetEntries([]);
    setGroupEmailEntries([]);
    setSharedFolderEntries([]);
    setSubmitErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitErrors([]);

    const result = await submit({
      nafId: naf.id,
      basicResourceIds: selectedBasic,
      internetEntries,
      groupEmailEntries,
      sharedFolderEntries,
    });

    setIsSubmitting(false);

    if (result.allSucceeded) {
      reset();
      onOpenChange(false);
    } else {
      setSubmitErrors(result.errors);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="w-full max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-amber-600 font-bold">
            Add Resources
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{naf.reference}</p>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1"
        >
          {/* Basic Resources */}
          {availableBasic.length > 0 && (
            <section className="space-y-2">
              <p className="text-sm font-semibold text-amber-500">
                BASIC RESOURCES
              </p>
              <div className="flex flex-wrap gap-4">
                {availableBasic.map((r) => (
                  <div key={r.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`basic-${r.id}`}
                      checked={selectedBasic.includes(r.id)}
                      onCheckedChange={(checked) =>
                        setSelectedBasic((prev) =>
                          checked
                            ? [...prev, r.id]
                            : prev.filter((id) => id !== r.id),
                        )
                      }
                    />
                    <FieldLabel htmlFor={`basic-${r.id}`}>{r.name}</FieldLabel>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Internet Access */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-500">
                INTERNET ACCESS
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addInternetEntry}
              >
                + Add Entry
              </Button>
            </div>
            {internetEntries.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No entries yet
              </p>
            )}
            {internetEntries.map((entry) => (
              <InternetEntryCard
                key={entry._id}
                entry={entry}
                allInternetResources={internetResources.data ?? []}
                allInternetPurposes={internetPurposes.data ?? []}
                usedInternetResourceIds={[
                  ...usedInternetResourceIds,
                  ...internetEntries
                    .filter(
                      (e) =>
                        e._id !== entry._id && e.internetResourceId !== null,
                    )
                    .map((e) => e.internetResourceId!),
                ]}
                onChange={(patch) => patchInternetEntry(entry._id, patch)}
                onRemove={() =>
                  setInternetEntries((prev) =>
                    prev.filter((e) => e._id !== entry._id),
                  )
                }
              />
            ))}
          </section>

          {/* Group Email */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-500">
                GROUP EMAIL
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGroupEmailEntry}
              >
                + Add Entry
              </Button>
            </div>
            {groupEmailEntries.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No entries yet
              </p>
            )}
            {groupEmailEntries.map((entry) => (
              <GroupEmailEntryCard
                key={entry._id}
                entry={entry}
                allGroupEmails={groupEmails.data ?? []}
                usedGroupEmailIds={[
                  ...usedGroupEmailIds,
                  ...groupEmailEntries
                    .filter(
                      (e) => e._id !== entry._id && e.groupEmailId !== null,
                    )
                    .map((e) => e.groupEmailId!),
                ]}
                onChange={(patch) => patchGroupEmailEntry(entry._id, patch)}
                onRemove={() =>
                  setGroupEmailEntries((prev) =>
                    prev.filter((e) => e._id !== entry._id),
                  )
                }
              />
            ))}
          </section>

          {/* Shared Folder */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-500">
                SHARED FOLDER
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSharedFolderEntry}
              >
                + Add Entry
              </Button>
            </div>
            {sharedFolderEntries.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No entries yet
              </p>
            )}
            {sharedFolderEntries.map((entry) => (
              <SharedFolderEntryCard
                key={entry._id}
                entry={entry}
                allSharedFolders={sharedFolders.data ?? []}
                usedSharedFolderIds={[
                  ...usedSharedFolderIds,
                  ...sharedFolderEntries
                    .filter(
                      (e) => e._id !== entry._id && e.sharedFolderId !== null,
                    )
                    .map((e) => e.sharedFolderId!),
                ]}
                onChange={(patch) => patchSharedFolderEntry(entry._id, patch)}
                onRemove={() =>
                  setSharedFolderEntries((prev) =>
                    prev.filter((e) => e._id !== entry._id),
                  )
                }
              />
            ))}
          </section>

          {/* Errors */}
          {submitErrors.length > 0 && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 space-y-1">
              {submitErrors.map((err, i) => (
                <p key={i} className="text-xs text-red-600">
                  • {err}
                </p>
              ))}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isSubmitting ? "Adding..." : "Add Resources"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd NAFClient && npm run build 2>&1 | head -60
```

Expected: No type errors in `addResourceDialog.tsx`.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/naf/components/addResourceDialog.tsx
git commit -m "feat: add AddResourceDialog component"
```

---

## Task 12: Wire `AddResourceDialog` into `ViewNAFDetail`

Replace the `TODO` in `RequestsSection` with the actual state and dialog.

**Files:**
- Modify: `NAFClient/src/features/naf/pages/ViewNAFDetail.tsx`

- [ ] **Step 1: Add import at the top of `ViewNAFDetail.tsx`**

Add after the existing imports:
```typescript
import { AddResourceDialog } from "@/features/naf/components/addResourceDialog";
```

- [ ] **Step 2: Add `addResourceOpen` state and wire the dialog in `RequestsSection`**

`RequestsSection` currently takes `{ naf, currentUserId }`. Update it to also manage the dialog state. Replace the entire `RequestsSection` function (lines 270–328) with:

```tsx
function RequestsSection({
  naf,
  currentUserId,
}: {
  naf: NAF;
  currentUserId: string;
}) {
  const [addResourceOpen, setAddResourceOpen] = useState(false);

  const pendingCount = (naf?.resourceRequests ?? []).filter((r) => {
    const p = r.progress as unknown as ProgressStatus;
    return (
      p !== ProgressStatus.Accomplished &&
      p !== ProgressStatus["Not Accomplished"]
    );
  }).length;

  const handleRemind = (id: string) => console.log("TODO remind", id);
  const handleDeactivate = (id: string) =>
    console.log("TODO deactivate resource request", id);
  const handleResubmit = (id: string) => console.log("TODO resubmit", id);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold">Requests</h2>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="text-sm font-semibold text-amber-500">
              {pendingCount} pending
            </span>
          )}
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            onClick={() => setAddResourceOpen(true)}
          >
            + Add Resources
          </Button>
        </div>
      </div>

      <AddResourceDialog
        naf={naf}
        open={addResourceOpen}
        onOpenChange={setAddResourceOpen}
      />

      <Accordion type="multiple" className="space-y-2">
        {(naf?.resourceRequests ?? []).map((req) => (
          <RequestItemWrapper
            naf={naf}
            key={req.id}
            request={req}
            currentUserId={currentUserId}
            onRemind={handleRemind}
            onDeactivate={handleDeactivate}
            onResubmit={handleResubmit}
          />
        ))}
      </Accordion>
    </div>
  );
}
```

Also add `useState` to the imports at the top if it's not already imported (it's imported via React already in this file via `import { useParams } from "react-router-dom"`; you may need to add `import { useState } from "react"`).

- [ ] **Step 3: Full TypeScript check and build**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds with 0 errors.

- [ ] **Step 4: Manual end-to-end test**

1. Start backend: `cd NAFServer && dotnet run`
2. Start frontend: `cd NAFClient && npm run dev`
3. Navigate to a NAF detail page
4. Click `+ Add Resources`
5. Verify the modal opens showing available basic resources and three special resource sections
6. Add a basic resource (checkbox) and click Add Resources — verify it appears in the NAF
7. Add an Internet entry — pick a purpose category, pick a resource, enter purpose text — submit
8. Verify the new resource request appears in the accordion
9. Attempt to add the same internet resource again — verify it's absent from the dropdown
10. Add two internet entries in the same submission (e.g., Facebook + Claude) — verify both appear

- [ ] **Step 5: Commit**

```bash
git add NAFClient/src/features/naf/pages/ViewNAFDetail.tsx
git commit -m "feat: wire AddResourceDialog into ViewNAFDetail"
```
