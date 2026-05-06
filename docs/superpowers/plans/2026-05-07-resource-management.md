# Resource Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-only resource management section that lets admins create/deactivate resources, manage approval workflow template versions, and view employees grouped by location who hold each resource.

**Architecture:** New `AdminResourcesController` + `ResourceManagementService` on the backend (Approach B — isolated from existing requestor flow). New `features/resource-management/` module on the frontend with two pages (list + detail), a set of focused components, and a single hooks file. The `ResourceGroupsController` gets a new `POST` endpoint for creating groups inline.

**Tech Stack:** ASP.NET Core 8, EF Core, SQL Server, React 19 + TypeScript, Vite, Tailwind CSS v4, ShadCN, TanStack React Query

---

## File Map

**Create (backend):**
- `NAFServer/src/Application/DTOs/ResourceManagement/AdminResourceListItemDTO.cs`
- `NAFServer/src/Application/DTOs/ResourceManagement/AdminResourceDetailDTO.cs`
- `NAFServer/src/Application/DTOs/ResourceManagement/WorkflowTemplateVersionDTO.cs`
- `NAFServer/src/Application/DTOs/ResourceManagement/WorkflowStepDTO.cs`
- `NAFServer/src/Application/DTOs/ResourceManagement/EmployeesByLocationDTO.cs`
- `NAFServer/src/Application/DTOs/ResourceManagement/EmployeeResourceRequestItemDTO.cs`
- `NAFServer/src/Application/DTOs/ResourceManagement/CreateResourceDTO.cs`
- `NAFServer/src/Application/DTOs/ResourceManagement/CreateWorkflowStepDTO.cs`
- `NAFServer/src/Application/DTOs/ResourceManagement/AddWorkflowTemplateDTO.cs`
- `NAFServer/src/Application/DTOs/ResourceManagement/CreateResourceGroupDTO.cs`
- `NAFServer/src/Application/Interfaces/IResourceManagementService.cs`
- `NAFServer/src/Application/Services/ResourceManagementService.cs`
- `NAFServer/src/API/Controllers/AdminResourcesController.cs`

**Modify (backend):**
- `NAFServer/src/Application/Interfaces/IResourceGroupService.cs` — add `CreateAsync`
- `NAFServer/src/Application/Services/ResourceGroupService.cs` — implement `CreateAsync`
- `NAFServer/src/API/Controllers/ResourceGroupsController.cs` — add `POST /api/ResourceGroups`
- `NAFServer/Program.cs` — register `IResourceManagementService`

**Create (frontend):**
- `NAFClient/src/features/resource-management/api.ts`
- `NAFClient/src/features/resource-management/hooks/useResourceManagement.ts`
- `NAFClient/src/features/resource-management/types.ts`
- `NAFClient/src/features/resource-management/components/WorkflowStepBuilder.tsx`
- `NAFClient/src/features/resource-management/components/CreateResourceGroupDialog.tsx`
- `NAFClient/src/features/resource-management/components/AddResourceDialog.tsx`
- `NAFClient/src/features/resource-management/components/ResourceCard.tsx`
- `NAFClient/src/features/resource-management/components/WorkflowTemplateVersions.tsx`
- `NAFClient/src/features/resource-management/components/AddWorkflowTemplateDialog.tsx`
- `NAFClient/src/features/resource-management/components/EmployeesByLocation.tsx`
- `NAFClient/src/features/resource-management/pages/ResourceListPage.tsx`
- `NAFClient/src/features/resource-management/pages/ResourceDetailPage.tsx`

**Modify (frontend):**
- `NAFClient/src/app/routesEnum.ts` — add resource management routes
- `NAFClient/src/app/router.tsx` — register new routes
- `NAFClient/src/shared/components/layout/AdminLayout.tsx` — add Resources nav item

---

## Task 1: Backend DTOs

**Files:**
- Create: `NAFServer/src/Application/DTOs/ResourceManagement/AdminResourceListItemDTO.cs`
- Create: `NAFServer/src/Application/DTOs/ResourceManagement/AdminResourceDetailDTO.cs`
- Create: `NAFServer/src/Application/DTOs/ResourceManagement/WorkflowTemplateVersionDTO.cs`
- Create: `NAFServer/src/Application/DTOs/ResourceManagement/WorkflowStepDTO.cs`
- Create: `NAFServer/src/Application/DTOs/ResourceManagement/EmployeesByLocationDTO.cs`
- Create: `NAFServer/src/Application/DTOs/ResourceManagement/EmployeeResourceRequestItemDTO.cs`
- Create: `NAFServer/src/Application/DTOs/ResourceManagement/CreateResourceDTO.cs`
- Create: `NAFServer/src/Application/DTOs/ResourceManagement/CreateWorkflowStepDTO.cs`
- Create: `NAFServer/src/Application/DTOs/ResourceManagement/AddWorkflowTemplateDTO.cs`
- Create: `NAFServer/src/Application/DTOs/ResourceManagement/CreateResourceGroupDTO.cs`

- [ ] **Step 1: Create all DTO records**

`AdminResourceListItemDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record AdminResourceListItemDTO(
        int Id,
        string Name,
        string? IconUrl,
        string Color,
        bool IsActive,
        bool IsSpecial,
        string? ResourceGroupName,
        int ActiveWorkflowTemplateVersion
    );
}
```

`AdminResourceDetailDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record AdminResourceDetailDTO(
        int Id,
        string Name,
        string? IconUrl,
        string Color,
        bool IsActive,
        bool IsSpecial,
        int? ResourceGroupId,
        string? ResourceGroupName,
        List<WorkflowTemplateVersionDTO> WorkflowVersions,
        List<EmployeesByLocationDTO> EmployeesByLocation
    );
}
```

`WorkflowTemplateVersionDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record WorkflowTemplateVersionDTO(
        Guid Id,
        int Version,
        bool IsActive,
        List<WorkflowStepDTO> Steps
    );
}
```

`WorkflowStepDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record WorkflowStepDTO(
        int StepOrder,
        string StepAction,
        string ApproverRole,
        string ApproverEntity
    );
}
```

`EmployeesByLocationDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record EmployeesByLocationDTO(
        int LocationId,
        string LocationName,
        List<EmployeeResourceRequestItemDTO> Employees
    );
}
```

`EmployeeResourceRequestItemDTO.cs`:
```csharp
namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record EmployeeResourceRequestItemDTO(
        string EmployeeId,
        string EmployeeName,
        Guid NAFId,
        Guid ResourceRequestId,
        string Progress
    );
}
```

`CreateResourceDTO.cs`:
```csharp
using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record CreateResourceDTO(
        [Required][MinLength(1)] string Name,
        [Required] string Color,
        bool IsSpecial,
        int? ResourceGroupId,
        List<CreateWorkflowStepDTO>? Steps
    );
}
```

`CreateWorkflowStepDTO.cs`:
```csharp
using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record CreateWorkflowStepDTO(
        [Range(1, int.MaxValue)] int StepOrder,
        [Required] string StepAction,
        [Required] string ApproverRole,
        [Required] string ApproverEntity
    );
}
```

`AddWorkflowTemplateDTO.cs`:
```csharp
using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record AddWorkflowTemplateDTO(
        [Required][MinLength(1)] List<CreateWorkflowStepDTO> Steps
    );
}
```

`CreateResourceGroupDTO.cs`:
```csharp
using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record CreateResourceGroupDTO(
        [Required][MinLength(1)] string Name,
        bool CanOwnMany
    );
}
```

- [ ] **Step 2: Build to verify**

Run from `NAFServer/`:
```
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/Application/DTOs/ResourceManagement/
git commit -m "feat: add resource management DTOs"
```

---

## Task 2: IResourceManagementService and ResourceManagementService

**Files:**
- Create: `NAFServer/src/Application/Interfaces/IResourceManagementService.cs`
- Create: `NAFServer/src/Application/Services/ResourceManagementService.cs`

- [ ] **Step 1: Create the interface**

`NAFServer/src/Application/Interfaces/IResourceManagementService.cs`:
```csharp
using NAFServer.src.Application.DTOs.ResourceManagement;

namespace NAFServer.src.Application.Interfaces
{
    public interface IResourceManagementService
    {
        Task<List<AdminResourceListItemDTO>> GetAllResourcesAsync();
        Task<AdminResourceDetailDTO> GetResourceDetailAsync(int id);
        Task<int> CreateResourceAsync(CreateResourceDTO dto);
        Task DeactivateResourceAsync(int id);
        Task AddWorkflowTemplateAsync(int resourceId, AddWorkflowTemplateDTO dto);
    }
}
```

- [ ] **Step 2: Create the service**

`NAFServer/src/Application/Services/ResourceManagementService.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.ResourceManagement;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Application.Services
{
    public class ResourceManagementService : IResourceManagementService
    {
        private readonly AppDbContext _context;
        private readonly IEmployeeRepository _employeeRepository;

        public ResourceManagementService(AppDbContext context, IEmployeeRepository employeeRepository)
        {
            _context = context;
            _employeeRepository = employeeRepository;
        }

        public async Task<List<AdminResourceListItemDTO>> GetAllResourcesAsync()
        {
            var resources = await _context.Resources
                .Include(r => r.ResourceGroup)
                .OrderByDescending(r => r.IsActive)
                .ThenBy(r => r.Name)
                .ToListAsync();

            var activeTemplates = await _context.ApprovalWorkflowTemplates
                .Where(t => t.IsActive)
                .ToDictionaryAsync(t => t.ResourceId, t => t.Version);

            return resources.Select(r => new AdminResourceListItemDTO(
                r.Id,
                r.Name,
                r.IconUrl,
                r.Color,
                r.IsActive,
                r.IsSpecial,
                r.ResourceGroup?.Name,
                r.IsSpecial && activeTemplates.TryGetValue(r.Id, out var v) ? v : 0
            )).ToList();
        }

        public async Task<AdminResourceDetailDTO> GetResourceDetailAsync(int id)
        {
            var resource = await _context.Resources
                .Include(r => r.ResourceGroup)
                .FirstOrDefaultAsync(r => r.Id == id)
                ?? throw new KeyNotFoundException($"Resource {id} not found");

            var templates = await _context.ApprovalWorkflowTemplates
                .Where(t => t.ResourceId == id)
                .OrderBy(t => t.Version)
                .ToListAsync();

            var templateIds = templates.Select(t => t.Id).ToList();
            var allSteps = await _context.ApprovalWorkflowStepsTemplates
                .Where(s => templateIds.Contains(s.ApprovalWorkflowTemplateId))
                .OrderBy(s => s.StepOrder)
                .ToListAsync();

            var workflowVersions = templates.Select(t => new WorkflowTemplateVersionDTO(
                t.Id,
                t.Version,
                t.IsActive,
                allSteps
                    .Where(s => s.ApprovalWorkflowTemplateId == t.Id)
                    .Select(s => new WorkflowStepDTO(s.StepOrder, s.StepAction.ToString(), s.ApproverRole.ToString(), s.ApproverEntity))
                    .ToList()
            )).ToList();

            var activeProgress = new[] { Progress.OPEN, Progress.IN_PROGRESS, Progress.FOR_SCREENING, Progress.IMPLEMENTATION };
            var requests = await _context.ResourceRequests
                .Where(rr => rr.ResourceId == id && activeProgress.Contains(rr.Progress))
                .Include(rr => rr.NAF)
                .ThenInclude(n => n.Location)
                .ToListAsync();

            var employeeIds = requests.Select(rr => rr.NAF.EmployeeId).Distinct().ToList();
            var employees = new Dictionary<string, Employee>();
            foreach (var eid in employeeIds)
            {
                var emp = await _employeeRepository.GetByIdAsync(eid);
                if (emp != null) employees[eid] = emp;
            }

            var byLocation = requests
                .GroupBy(rr => rr.NAF.LocationId)
                .Select(g =>
                {
                    var locationName = g.First().NAF.Location?.Name ?? "Unknown";
                    var emps = g.Select(rr =>
                    {
                        employees.TryGetValue(rr.NAF.EmployeeId, out var emp);
                        var nameParts = new List<string?> { emp?.FirstName, emp?.MiddleName != null ? emp.MiddleName[0] + "." : null, emp?.LastName };
                        var name = emp != null
                            ? string.Join(" ", nameParts.Where(p => p != null))
                            : rr.NAF.EmployeeId;
                        return new EmployeeResourceRequestItemDTO(rr.NAF.EmployeeId, name, rr.NAFId, rr.Id, rr.Progress.ToString());
                    }).ToList();
                    return new EmployeesByLocationDTO(g.Key, locationName, emps);
                })
                .OrderBy(l => l.LocationName)
                .ToList();

            return new AdminResourceDetailDTO(
                resource.Id, resource.Name, resource.IconUrl, resource.Color,
                resource.IsActive, resource.IsSpecial, resource.ResourceGroupId,
                resource.ResourceGroup?.Name, workflowVersions, byLocation
            );
        }

        public async Task<int> CreateResourceAsync(CreateResourceDTO dto)
        {
            if (dto.IsSpecial && (dto.Steps == null || dto.Steps.Count == 0))
                throw new ArgumentException("Special resources require at least one workflow step.");

            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var resource = new Resource(dto.Name, dto.Color, null, dto.IsSpecial, false);
                if (dto.ResourceGroupId.HasValue)
                    resource.AssignToGroup(dto.ResourceGroupId.Value);

                _context.Resources.Add(resource);
                await _context.SaveChangesAsync();

                if (dto.IsSpecial)
                {
                    var template = new ApprovalWorkflowTemplate(resource.Id, 1);
                    _context.ApprovalWorkflowTemplates.Add(template);
                    await _context.SaveChangesAsync();

                    var steps = dto.Steps!.Select(s => new ApprovalWorkflowStepsTemplate(
                        template.Id,
                        s.StepOrder,
                        Enum.Parse<StepAction>(s.StepAction),
                        Enum.Parse<ApproverRole>(s.ApproverRole),
                        s.ApproverEntity
                    )).ToList();
                    _context.ApprovalWorkflowStepsTemplates.AddRange(steps);
                    await _context.SaveChangesAsync();
                }

                await tx.CommitAsync();
                return resource.Id;
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public async Task DeactivateResourceAsync(int id)
        {
            var resource = await _context.Resources.FindAsync(id)
                ?? throw new KeyNotFoundException($"Resource {id} not found");
            resource.SetToInactive();
            await _context.SaveChangesAsync();
        }

        public async Task AddWorkflowTemplateAsync(int resourceId, AddWorkflowTemplateDTO dto)
        {
            if (dto.Steps == null || dto.Steps.Count == 0)
                throw new ArgumentException("At least one step is required.");

            var resource = await _context.Resources.FindAsync(resourceId)
                ?? throw new KeyNotFoundException($"Resource {resourceId} not found");

            if (!resource.IsSpecial)
                throw new InvalidOperationException("Cannot add workflow templates to non-special resources.");

            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var current = await _context.ApprovalWorkflowTemplates
                    .Where(t => t.ResourceId == resourceId && t.IsActive)
                    .FirstOrDefaultAsync();
                current?.SetToInactive();

                var maxVersion = await _context.ApprovalWorkflowTemplates
                    .Where(t => t.ResourceId == resourceId)
                    .MaxAsync(t => (int?)t.Version) ?? 0;

                var template = new ApprovalWorkflowTemplate(resourceId, maxVersion + 1);
                _context.ApprovalWorkflowTemplates.Add(template);
                await _context.SaveChangesAsync();

                var steps = dto.Steps.Select(s => new ApprovalWorkflowStepsTemplate(
                    template.Id,
                    s.StepOrder,
                    Enum.Parse<StepAction>(s.StepAction),
                    Enum.Parse<ApproverRole>(s.ApproverRole),
                    s.ApproverEntity
                )).ToList();
                _context.ApprovalWorkflowStepsTemplates.AddRange(steps);
                await _context.SaveChangesAsync();

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }
    }
}
```

- [ ] **Step 3: Build to verify**

Run from `NAFServer/`:
```
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Application/Interfaces/IResourceManagementService.cs
git add NAFServer/src/Application/Services/ResourceManagementService.cs
git commit -m "feat: add ResourceManagementService"
```

---

## Task 3: AdminResourcesController + ResourceGroup create endpoint + Program.cs

**Files:**
- Create: `NAFServer/src/API/Controllers/AdminResourcesController.cs`
- Modify: `NAFServer/src/Application/Interfaces/IResourceGroupService.cs`
- Modify: `NAFServer/src/Application/Services/ResourceGroupService.cs`
- Modify: `NAFServer/src/API/Controllers/ResourceGroupsController.cs`
- Modify: `NAFServer/Program.cs`

- [ ] **Step 1: Create AdminResourcesController**

`NAFServer/src/API/Controllers/AdminResourcesController.cs`:
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.ResourceManagement;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/admin/resources")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class AdminResourcesController : ControllerBase
    {
        private readonly IResourceManagementService _resourceManagementService;

        public AdminResourcesController(IResourceManagementService resourceManagementService)
        {
            _resourceManagementService = resourceManagementService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _resourceManagementService.GetAllResourcesAsync());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            try
            {
                return Ok(await _resourceManagementService.GetResourceDetailAsync(id));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateResourceDTO dto)
        {
            try
            {
                var id = await _resourceManagementService.CreateResourceAsync(dto);
                return Created($"api/admin/resources/{id}", new { id });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}/deactivate")]
        public async Task<IActionResult> Deactivate(int id)
        {
            try
            {
                await _resourceManagementService.DeactivateResourceAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{id}/workflow-templates")]
        public async Task<IActionResult> AddWorkflowTemplate(int id, [FromBody] AddWorkflowTemplateDTO dto)
        {
            try
            {
                await _resourceManagementService.AddWorkflowTemplateAsync(id, dto);
                return Created("", null);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
```

- [ ] **Step 2: Add CreateAsync to IResourceGroupService**

In `NAFServer/src/Application/Interfaces/IResourceGroupService.cs`, add the new method signature. The file after modification:
```csharp
using NAFServer.src.Application.DTOs.ResourceGroup;
using NAFServer.src.Application.DTOs.ResourceManagement;

namespace NAFServer.src.Application.Interfaces
{
    public interface IResourceGroupService
    {
        Task<List<ResourceGroupDTO>> GetAllGroupsAsync();
        Task<ResourceGroupDTO> AddResourceToGroupAsync(int groupId, int resourceId);
        Task<ResourceGroupDTO> RemoveResourceFromGroupAsync(int groupId, int resourceId);
        Task<ResourceGroupDTO> CreateAsync(CreateResourceGroupDTO dto);
    }
}
```

- [ ] **Step 3: Implement CreateAsync in ResourceGroupService**

Add the following method to `NAFServer/src/Application/Services/ResourceGroupService.cs` (inside the class, before the private `ToDTO` method):
```csharp
public async Task<ResourceGroupDTO> CreateAsync(CreateResourceGroupDTO dto)
{
    if (string.IsNullOrWhiteSpace(dto.Name))
        throw new ArgumentException("Group name is required.");

    var group = new Domain.Entities.ResourceGroup(dto.Name, dto.CanOwnMany, false);
    _context.ResourceGroups.Add(group);
    await _context.SaveChangesAsync();

    var created = await _resourceGroupRepository.GetGroupByIdAsync(group.Id)
        ?? throw new InvalidOperationException("Failed to retrieve created group.");
    return ToDTO(created);
}
```

Also add the using at the top of `ResourceGroupService.cs`:
```csharp
using NAFServer.src.Application.DTOs.ResourceManagement;
```

- [ ] **Step 4: Add POST endpoint to ResourceGroupsController**

Add the following action to `NAFServer/src/API/Controllers/ResourceGroupsController.cs` (inside the class):
```csharp
[HttpPost]
public async Task<IActionResult> Create([FromBody] CreateResourceGroupDTO dto)
{
    try
    {
        var group = await _resourceGroupService.CreateAsync(dto);
        return Created("", group);
    }
    catch (ArgumentException ex)
    {
        return BadRequest(ex.Message);
    }
    catch (Exception ex)
    {
        return BadRequest(ex.Message);
    }
}
```

Also add the using at the top of `ResourceGroupsController.cs`:
```csharp
using NAFServer.src.Application.DTOs.ResourceManagement;
```

- [ ] **Step 5: Register IResourceManagementService in Program.cs**

In `NAFServer/Program.cs`, after the existing `AddScoped<IResourceGroupService, ResourceGroupService>()` line, add:
```csharp
builder.Services.AddScoped<IResourceManagementService, ResourceManagementService>();
```

- [ ] **Step 6: Build to verify**

Run from `NAFServer/`:
```
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 7: Commit**

```bash
git add NAFServer/src/API/Controllers/AdminResourcesController.cs
git add NAFServer/src/Application/Interfaces/IResourceGroupService.cs
git add NAFServer/src/Application/Services/ResourceGroupService.cs
git add NAFServer/src/API/Controllers/ResourceGroupsController.cs
git add NAFServer/Program.cs
git commit -m "feat: add AdminResourcesController and resource group create endpoint"
```

---

## Task 4: Frontend Types

**Files:**
- Create: `NAFClient/src/features/resource-management/types.ts`

- [ ] **Step 1: Create types file**

`NAFClient/src/features/resource-management/types.ts`:
```typescript
export interface AdminResourceListItem {
  id: number;
  name: string;
  iconUrl?: string;
  color: string;
  isActive: boolean;
  isSpecial: boolean;
  resourceGroupName?: string;
  activeWorkflowTemplateVersion: number;
}

export interface WorkflowStep {
  stepOrder: number;
  stepAction: string;
  approverRole: string;
  approverEntity: string;
}

export interface WorkflowTemplateVersion {
  id: string;
  version: number;
  isActive: boolean;
  steps: WorkflowStep[];
}

export interface EmployeeResourceRequestItem {
  employeeId: string;
  employeeName: string;
  nafId: string;
  resourceRequestId: string;
  progress: string;
}

export interface EmployeesByLocation {
  locationId: number;
  locationName: string;
  employees: EmployeeResourceRequestItem[];
}

export interface AdminResourceDetail {
  id: number;
  name: string;
  iconUrl?: string;
  color: string;
  isActive: boolean;
  isSpecial: boolean;
  resourceGroupId?: number;
  resourceGroupName?: string;
  workflowVersions: WorkflowTemplateVersion[];
  employeesByLocation: EmployeesByLocation[];
}

export interface StepRow {
  stepAction: string;
  approverRole: string;
  approverEntity: string;
}

export interface CreateResourcePayload {
  name: string;
  color: string;
  isSpecial: boolean;
  resourceGroupId?: number;
  steps?: Array<{ stepOrder: number; stepAction: string; approverRole: string; approverEntity: string }>;
}

export interface AddWorkflowTemplatePayload {
  steps: Array<{ stepOrder: number; stepAction: string; approverRole: string; approverEntity: string }>;
}

export interface CreateResourceGroupPayload {
  name: string;
  canOwnMany: boolean;
}
```

- [ ] **Step 2: Build to verify TypeScript**

Run from `NAFClient/`:
```
npm run build
```
Expected: Build completed without TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/resource-management/types.ts
git commit -m "feat: add resource management frontend types"
```

---

## Task 5: Frontend API layer and hooks

**Files:**
- Create: `NAFClient/src/features/resource-management/api.ts`
- Create: `NAFClient/src/features/resource-management/hooks/useResourceManagement.ts`

- [ ] **Step 1: Create api.ts**

`NAFClient/src/features/resource-management/api.ts`:
```typescript
import api from "@/shared/api/client";
import type {
  AdminResourceListItem,
  AdminResourceDetail,
  CreateResourcePayload,
  AddWorkflowTemplatePayload,
  CreateResourceGroupPayload,
} from "./types";
import type { ResourceGroup } from "@/shared/types/api/naf";

export const resourceManagementApi = {
  async getAll(): Promise<AdminResourceListItem[]> {
    try {
      const res = await api.get<AdminResourceListItem[]>("/admin/resources");
      return res.data;
    } catch (e) {
      console.log(e);
      return [];
    }
  },

  async getDetail(id: number): Promise<AdminResourceDetail | null> {
    try {
      const res = await api.get<AdminResourceDetail>(`/admin/resources/${id}`);
      return res.data;
    } catch (e) {
      console.log(e);
      return null;
    }
  },

  async createResource(payload: CreateResourcePayload): Promise<{ id: number }> {
    const res = await api.post<{ id: number }>("/admin/resources", payload);
    return res.data;
  },

  async deactivateResource(id: number): Promise<void> {
    await api.put(`/admin/resources/${id}/deactivate`);
  },

  async addWorkflowTemplate(resourceId: number, payload: AddWorkflowTemplatePayload): Promise<void> {
    await api.post(`/admin/resources/${resourceId}/workflow-templates`, payload);
  },

  async createResourceGroup(payload: CreateResourceGroupPayload): Promise<ResourceGroup> {
    const res = await api.post<ResourceGroup>("/ResourceGroups", payload);
    return res.data;
  },
};
```

- [ ] **Step 2: Create hooks file**

`NAFClient/src/features/resource-management/hooks/useResourceManagement.ts`:
```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resourceManagementApi } from "../api";
import type { AddWorkflowTemplatePayload, CreateResourceGroupPayload, CreateResourcePayload } from "../types";

const KEYS = {
  list: ["admin", "resources"] as const,
  detail: (id: number) => ["admin", "resources", id] as const,
};

export function useAdminResources() {
  return useQuery({
    queryKey: KEYS.list,
    queryFn: resourceManagementApi.getAll,
  });
}

export function useAdminResourceDetail(id: number) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => resourceManagementApi.getDetail(id),
    enabled: id > 0,
  });
}

export function useCreateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateResourcePayload) => resourceManagementApi.createResource(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list }),
  });
}

export function useDeactivateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => resourceManagementApi.deactivateResource(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: KEYS.list });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

export function useAddWorkflowTemplate(resourceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddWorkflowTemplatePayload) =>
      resourceManagementApi.addWorkflowTemplate(resourceId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.detail(resourceId) }),
  });
}

export function useCreateResourceGroup() {
  return useMutation({
    mutationFn: (payload: CreateResourceGroupPayload) =>
      resourceManagementApi.createResourceGroup(payload),
  });
}
```

- [ ] **Step 3: Build to verify TypeScript**

Run from `NAFClient/`:
```
npm run build
```
Expected: Build completed without TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/features/resource-management/api.ts
git add NAFClient/src/features/resource-management/hooks/useResourceManagement.ts
git commit -m "feat: add resource management API layer and hooks"
```

---

## Task 6: WorkflowStepBuilder component

**Files:**
- Create: `NAFClient/src/features/resource-management/components/WorkflowStepBuilder.tsx`

- [ ] **Step 1: Create the component**

`NAFClient/src/features/resource-management/components/WorkflowStepBuilder.tsx`:
```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import type { StepRow } from "../types";

const STEP_ACTIONS = ["APPROVER", "FOR_SCREENING"] as const;
const APPROVER_ROLES = ["SUPERVISOR", "DEPARTMENT_HEAD", "POSITION", "TECHNICAL_HEAD"] as const;

interface WorkflowStepBuilderProps {
  steps: StepRow[];
  onChange: (steps: StepRow[]) => void;
}

export function WorkflowStepBuilder({ steps, onChange }: WorkflowStepBuilderProps) {
  const addStep = () =>
    onChange([...steps, { stepAction: "APPROVER", approverRole: "DEPARTMENT_HEAD", approverEntity: "EMPLOYEE" }]);

  const removeStep = (index: number) =>
    onChange(steps.filter((_, i) => i !== index));

  const updateStep = (index: number, field: keyof StepRow, value: string) =>
    onChange(steps.map((s, i) => (i === index ? { ...s, [field]: value } : s)));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 text-xs font-medium text-muted-foreground px-1">
        <span>#</span>
        <span>Action</span>
        <span>Role</span>
        <span>Entity</span>
        <span />
      </div>
      {steps.map((step, i) => (
        <div key={i} className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 items-center">
          <span className="text-sm text-muted-foreground text-center">{i + 1}</span>

          <Select value={step.stepAction} onValueChange={(v) => updateStep(i, "stepAction", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STEP_ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={step.approverRole} onValueChange={(v) => updateStep(i, "approverRole", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPROVER_ROLES.map((r) => (
                <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={step.approverEntity}
            onChange={(e) => updateStep(i, "approverEntity", e.target.value)}
            placeholder="e.g. EMPLOYEE"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeStep(i)}
            disabled={steps.length === 1}
            className="h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addStep} className="w-full">
        <Plus className="h-4 w-4 mr-1" /> Add Step
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Build to verify**

Run from `NAFClient/`:
```
npm run build
```
Expected: Build completed without TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/resource-management/components/WorkflowStepBuilder.tsx
git commit -m "feat: add WorkflowStepBuilder component"
```

---

## Task 7: CreateResourceGroupDialog component

**Files:**
- Create: `NAFClient/src/features/resource-management/components/CreateResourceGroupDialog.tsx`

- [ ] **Step 1: Create the component**

`NAFClient/src/features/resource-management/components/CreateResourceGroupDialog.tsx`:
```tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCreateResourceGroup } from "../hooks/useResourceManagement";
import type { ResourceGroup } from "@/shared/types/api/naf";

interface CreateResourceGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (group: ResourceGroup) => void;
}

export function CreateResourceGroupDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateResourceGroupDialogProps) {
  const [name, setName] = useState("");
  const [canOwnMany, setCanOwnMany] = useState(false);
  const { mutate, isPending } = useCreateResourceGroup();

  const handleSubmit = () => {
    if (!name.trim()) return;
    mutate(
      { name: name.trim(), canOwnMany },
      {
        onSuccess: (group) => {
          onCreated(group);
          onOpenChange(false);
          setName("");
          setCanOwnMany(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Resource Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hardware"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="can-own-many"
              checked={canOwnMany}
              onCheckedChange={setCanOwnMany}
            />
            <Label htmlFor="can-own-many">Can own many resources of this group</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isPending}>
            {isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Build to verify**

Run from `NAFClient/`:
```
npm run build
```
Expected: Build completed without TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/resource-management/components/CreateResourceGroupDialog.tsx
git commit -m "feat: add CreateResourceGroupDialog component"
```

---

## Task 8: AddResourceDialog component

**Files:**
- Create: `NAFClient/src/features/resource-management/components/AddResourceDialog.tsx`

- [ ] **Step 1: Create the component**

`NAFClient/src/features/resource-management/components/AddResourceDialog.tsx`:
```tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkflowStepBuilder } from "./WorkflowStepBuilder";
import { CreateResourceGroupDialog } from "./CreateResourceGroupDialog";
import { useCreateResource } from "../hooks/useResourceManagement";
import type { StepRow } from "../types";
import type { ResourceGroup } from "@/shared/types/api/naf";
import { useQuery } from "@tanstack/react-query";
import { getResourceGroups } from "@/shared/api/resourceService";

interface AddResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddResourceDialog({ open, onOpenChange }: AddResourceDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [isSpecial, setIsSpecial] = useState(false);
  const [resourceGroupId, setResourceGroupId] = useState<number | undefined>();
  const [steps, setSteps] = useState<StepRow[]>([
    { stepAction: "APPROVER", approverRole: "DEPARTMENT_HEAD", approverEntity: "EMPLOYEE" },
  ]);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [extraGroups, setExtraGroups] = useState<ResourceGroup[]>([]);

  const { data: groups = [] } = useQuery({
    queryKey: ["resourceGroups"],
    queryFn: getResourceGroups,
  });

  const allGroups = [...groups, ...extraGroups.filter((eg) => !groups.some((g) => g.id === eg.id))];

  const { mutate, isPending } = useCreateResource();

  const isValid = name.trim().length > 0 && (!isSpecial || steps.every((s) => s.stepAction && s.approverRole && s.approverEntity.trim()));

  const handleSubmit = () => {
    if (!isValid) return;
    mutate(
      {
        name: name.trim(),
        color,
        isSpecial,
        resourceGroupId,
        steps: isSpecial
          ? steps.map((s, i) => ({ stepOrder: i + 1, stepAction: s.stepAction, approverRole: s.approverRole, approverEntity: s.approverEntity }))
          : undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setName("");
    setColor("#3b82f6");
    setIsSpecial(false);
    setResourceGroupId(undefined);
    setSteps([{ stepAction: "APPROVER", approverRole: "DEPARTMENT_HEAD", approverEntity: "EMPLOYEE" }]);
    setExtraGroups([]);
  };

  const handleGroupChange = (value: string) => {
    if (value === "__add_other__") {
      setShowGroupDialog(true);
    } else {
      setResourceGroupId(Number(value));
    }
  };

  const handleGroupCreated = (group: ResourceGroup) => {
    setExtraGroups((prev) => [...prev, group]);
    setResourceGroupId(group.id);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="resource-name">Name *</Label>
              <Input
                id="resource-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Microsoft 365 E3"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="resource-color">Color</Label>
              <div className="flex items-center gap-3">
                <input
                  id="resource-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-16 cursor-pointer rounded border border-input bg-background"
                />
                <span className="text-sm text-muted-foreground">{color}</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Resource Group</Label>
              <Select
                value={resourceGroupId?.toString() ?? ""}
                onValueChange={handleGroupChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a group (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {allGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>
                      {g.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="__add_other__" className="text-primary font-medium">
                    + Add other...
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="is-special"
                checked={isSpecial}
                onCheckedChange={setIsSpecial}
              />
              <Label htmlFor="is-special">Requires approval (Special resource)</Label>
            </div>

            {isSpecial && (
              <div className="space-y-2 border rounded-md p-3">
                <Label className="text-sm font-medium">Approval Workflow Steps</Label>
                <WorkflowStepBuilder steps={steps} onChange={setSteps} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid || isPending}>
              {isPending ? "Creating..." : "Create Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateResourceGroupDialog
        open={showGroupDialog}
        onOpenChange={setShowGroupDialog}
        onCreated={handleGroupCreated}
      />
    </>
  );
}
```

- [ ] **Step 2: Build to verify**

Run from `NAFClient/`:
```
npm run build
```
Expected: Build completed without TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/resource-management/components/AddResourceDialog.tsx
git commit -m "feat: add AddResourceDialog component"
```

---

## Task 9: ResourceCard and ResourceListPage

**Files:**
- Create: `NAFClient/src/features/resource-management/components/ResourceCard.tsx`
- Create: `NAFClient/src/features/resource-management/pages/ResourceListPage.tsx`

- [ ] **Step 1: Create ResourceCard**

`NAFClient/src/features/resource-management/components/ResourceCard.tsx`:
```tsx
import { Badge } from "@/components/ui/badge";
import type { AdminResourceListItem } from "../types";

interface ResourceCardProps {
  resource: AdminResourceListItem;
  onClick: () => void;
}

export function ResourceCard({ resource, onClick }: ResourceCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border bg-card transition-colors hover:bg-accent/50 ${
        !resource.isActive ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-full shrink-0 mt-0.5"
            style={{ backgroundColor: resource.color }}
          />
          <div>
            <p className="font-medium leading-tight">{resource.name}</p>
            {resource.resourceGroupName && (
              <p className="text-xs text-muted-foreground mt-0.5">{resource.resourceGroupName}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant={resource.isSpecial ? "default" : "secondary"}>
            {resource.isSpecial ? "Special" : "Basic"}
          </Badge>
          {resource.isSpecial && resource.activeWorkflowTemplateVersion > 0 && (
            <span className="text-xs text-muted-foreground">v{resource.activeWorkflowTemplateVersion}</span>
          )}
          {!resource.isActive && (
            <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
          )}
        </div>
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Create ResourceListPage**

`NAFClient/src/features/resource-management/pages/ResourceListPage.tsx`:
```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useAdminResources } from "../hooks/useResourceManagement";
import { ResourceCard } from "../components/ResourceCard";
import { AddResourceDialog } from "../components/AddResourceDialog";
import { RoutesEnum } from "@/app/routesEnum";

export default function ResourceListPage() {
  const [showInactive, setShowInactive] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { data: resources = [], isLoading } = useAdminResources();

  const active = resources.filter((r) => r.isActive);
  const inactive = resources.filter((r) => !r.isActive);
  const displayed = showInactive ? [...active, ...inactive] : active;

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Resources</h1>
          <Button onClick={() => setAddDialogOpen(true)}>Add Resource</Button>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <Label htmlFor="show-inactive" className="text-sm">
            Show inactive resources
          </Label>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading resources...</p>
        ) : displayed.length === 0 ? (
          <p className="text-muted-foreground text-sm">No resources found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayed.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                onClick={() => navigate(`${RoutesEnum.ADMIN_RESOURCES}/${r.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <AddResourceDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </AdminLayout>
  );
}
```

- [ ] **Step 3: Build to verify**

Run from `NAFClient/`:
```
npm run build
```
Expected: Build completed without TypeScript errors. (ADMIN_RESOURCES route will be missing until Task 11 — that's fine, add a temporary string fallback `"/admin/resources"` if the build fails on that reference.)

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/features/resource-management/components/ResourceCard.tsx
git add NAFClient/src/features/resource-management/pages/ResourceListPage.tsx
git commit -m "feat: add ResourceCard and ResourceListPage"
```

---

## Task 10: WorkflowTemplateVersions and AddWorkflowTemplateDialog

**Files:**
- Create: `NAFClient/src/features/resource-management/components/WorkflowTemplateVersions.tsx`
- Create: `NAFClient/src/features/resource-management/components/AddWorkflowTemplateDialog.tsx`

- [ ] **Step 1: Create WorkflowTemplateVersions**

`NAFClient/src/features/resource-management/components/WorkflowTemplateVersions.tsx`:
```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WorkflowTemplateVersion } from "../types";

interface WorkflowTemplateVersionsProps {
  versions: WorkflowTemplateVersion[];
}

export function WorkflowTemplateVersions({ versions }: WorkflowTemplateVersionsProps) {
  if (versions.length === 0) {
    return <p className="text-sm text-muted-foreground">No workflow templates defined.</p>;
  }

  return (
    <Accordion type="multiple" className="space-y-1">
      {versions.map((v) => (
        <AccordionItem
          key={v.id}
          value={v.id}
          className={`border rounded-md px-3 ${v.isActive ? "border-primary/50 bg-primary/5" : ""}`}
        >
          <AccordionTrigger className="text-sm hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Version {v.version}</span>
              {v.isActive && <Badge className="text-xs">Active</Badge>}
              <span className="text-muted-foreground text-xs">{v.steps.length} step{v.steps.length !== 1 ? "s" : ""}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {v.steps.map((s) => (
                  <TableRow key={s.stepOrder}>
                    <TableCell>{s.stepOrder}</TableCell>
                    <TableCell>{s.stepAction}</TableCell>
                    <TableCell>{s.approverRole.replace(/_/g, " ")}</TableCell>
                    <TableCell>{s.approverEntity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
```

- [ ] **Step 2: Create AddWorkflowTemplateDialog**

`NAFClient/src/features/resource-management/components/AddWorkflowTemplateDialog.tsx`:
```tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WorkflowStepBuilder } from "./WorkflowStepBuilder";
import { useAddWorkflowTemplate } from "../hooks/useResourceManagement";
import type { StepRow } from "../types";

interface AddWorkflowTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: number;
  currentActiveVersion: number;
}

export function AddWorkflowTemplateDialog({
  open,
  onOpenChange,
  resourceId,
  currentActiveVersion,
}: AddWorkflowTemplateDialogProps) {
  const [steps, setSteps] = useState<StepRow[]>([
    { stepAction: "APPROVER", approverRole: "DEPARTMENT_HEAD", approverEntity: "EMPLOYEE" },
  ]);
  const { mutate, isPending } = useAddWorkflowTemplate(resourceId);

  const isValid = steps.length > 0 && steps.every((s) => s.stepAction && s.approverRole && s.approverEntity.trim());

  const handleSubmit = () => {
    if (!isValid) return;
    mutate(
      {
        steps: steps.map((s, i) => ({
          stepOrder: i + 1,
          stepAction: s.stepAction,
          approverRole: s.approverRole,
          approverEntity: s.approverEntity,
        })),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSteps([{ stepAction: "APPROVER", approverRole: "DEPARTMENT_HEAD", approverEntity: "EMPLOYEE" }]);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Workflow Template</DialogTitle>
        </DialogHeader>

        {currentActiveVersion > 0 && (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
            This will replace the current active template (v{currentActiveVersion}).
          </div>
        )}

        <div className="py-2">
          <WorkflowStepBuilder steps={steps} onChange={setSteps} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            {isPending ? "Saving..." : "Save Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Build to verify**

Run from `NAFClient/`:
```
npm run build
```
Expected: Build completed without TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/features/resource-management/components/WorkflowTemplateVersions.tsx
git add NAFClient/src/features/resource-management/components/AddWorkflowTemplateDialog.tsx
git commit -m "feat: add WorkflowTemplateVersions and AddWorkflowTemplateDialog components"
```

---

## Task 11: EmployeesByLocation component

**Files:**
- Create: `NAFClient/src/features/resource-management/components/EmployeesByLocation.tsx`

- [ ] **Step 1: Create the component**

`NAFClient/src/features/resource-management/components/EmployeesByLocation.tsx`:
```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EmployeesByLocation as EmployeesByLocationData } from "../types";

const PROGRESS_COLORS: Record<string, string> = {
  OPEN: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  FOR_SCREENING: "bg-yellow-100 text-yellow-700",
  IMPLEMENTATION: "bg-purple-100 text-purple-700",
};

interface EmployeesByLocationProps {
  groups: EmployeesByLocationData[];
}

export function EmployeesByLocation({ groups }: EmployeesByLocationProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<number>>(new Set(groups.map((g) => g.locationId)));

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">No active requests for this resource.</p>;
  }

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <div key={group.locationId} className="border rounded-md overflow-hidden">
          <button
            onClick={() => toggle(group.locationId)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium bg-muted/40 hover:bg-muted/60 transition-colors"
          >
            <span>{group.locationName}</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">{group.employees.length} employee{group.employees.length !== 1 ? "s" : ""}</span>
              {expanded.has(group.locationId) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </button>

          {expanded.has(group.locationId) && (
            <div className="divide-y">
              {group.employees.map((emp) => (
                <button
                  key={emp.resourceRequestId}
                  onClick={() => navigate(`/NAF/${emp.employeeId}/${emp.nafId}`)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors text-left"
                >
                  <span>{emp.employeeName}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      PROGRESS_COLORS[emp.progress] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {emp.progress.replace(/_/g, " ")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Build to verify**

Run from `NAFClient/`:
```
npm run build
```
Expected: Build completed without TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/resource-management/components/EmployeesByLocation.tsx
git commit -m "feat: add EmployeesByLocation component"
```

---

## Task 12: ResourceDetailPage

**Files:**
- Create: `NAFClient/src/features/resource-management/pages/ResourceDetailPage.tsx`

- [ ] **Step 1: Create the page**

`NAFClient/src/features/resource-management/pages/ResourceDetailPage.tsx`:
```tsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useAdminResourceDetail, useDeactivateResource } from "../hooks/useResourceManagement";
import { WorkflowTemplateVersions } from "../components/WorkflowTemplateVersions";
import { AddWorkflowTemplateDialog } from "../components/AddWorkflowTemplateDialog";
import { EmployeesByLocation } from "../components/EmployeesByLocation";
import { RoutesEnum } from "@/app/routesEnum";

export default function ResourceDetailPage() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const id = Number(resourceId);
  const navigate = useNavigate();
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const { data: resource, isLoading } = useAdminResourceDetail(id);
  const { mutate: deactivate, isPending: deactivating } = useDeactivateResource();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!resource) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-muted-foreground text-sm">Resource not found.</p>
        </div>
      </AdminLayout>
    );
  }

  const activeVersion = resource.workflowVersions.find((v) => v.isActive)?.version ?? 0;

  const handleDeactivate = () => {
    if (!confirm(`Deactivate "${resource.name}"? In-flight requests will continue.`)) return;
    deactivate(id, { onSuccess: () => navigate(RoutesEnum.ADMIN_RESOURCES) });
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(RoutesEnum.ADMIN_RESOURCES)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div
              className="h-5 w-5 rounded-full shrink-0"
              style={{ backgroundColor: resource.color }}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-semibold">{resource.name}</h1>
                <Badge variant={resource.isSpecial ? "default" : "secondary"}>
                  {resource.isSpecial ? "Special" : "Basic"}
                </Badge>
                <Badge variant={resource.isActive ? "outline" : "secondary"}>
                  {resource.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {resource.resourceGroupName && (
                <p className="text-sm text-muted-foreground">{resource.resourceGroupName}</p>
              )}
            </div>
          </div>
          {resource.isActive && (
            <Button variant="destructive" onClick={handleDeactivate} disabled={deactivating}>
              {deactivating ? "Deactivating..." : "Deactivate"}
            </Button>
          )}
        </div>

        {/* Workflow Templates Section */}
        {resource.isSpecial && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Workflow Templates</h2>
              <Button size="sm" variant="outline" onClick={() => setTemplateDialogOpen(true)}>
                Add New Template
              </Button>
            </div>
            <WorkflowTemplateVersions versions={resource.workflowVersions} />
          </section>
        )}

        {/* Employees Section */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Employees with this Resource</h2>
          <EmployeesByLocation groups={resource.employeesByLocation} />
        </section>
      </div>

      <AddWorkflowTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        resourceId={id}
        currentActiveVersion={activeVersion}
      />
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Build to verify**

Run from `NAFClient/`:
```
npm run build
```
Expected: Build completed without TypeScript errors. (ADMIN_RESOURCES route will be missing until Task 13 — temporarily use `"/admin/resources"` if needed.)

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/resource-management/pages/ResourceDetailPage.tsx
git commit -m "feat: add ResourceDetailPage"
```

---

## Task 13: Routes, RoutesEnum, and AdminLayout nav

**Files:**
- Modify: `NAFClient/src/app/routesEnum.ts`
- Modify: `NAFClient/src/app/router.tsx`
- Modify: `NAFClient/src/shared/components/layout/AdminLayout.tsx`

- [ ] **Step 1: Add routes to routesEnum.ts**

In `NAFClient/src/app/routesEnum.ts`, add these two entries inside the `RoutesEnum` enum (after `ADMIN_USER_DETAIL`):
```typescript
ADMIN_RESOURCES = "/admin/resources",
ADMIN_RESOURCE_DETAIL = "/admin/resources/:resourceId",
```

- [ ] **Step 2: Add lazy imports and routes to router.tsx**

At the top of `NAFClient/src/app/router.tsx`, add these lazy imports alongside the existing ones:
```typescript
const ResourceListPage = lazy(
  () => import("@/features/resource-management/pages/ResourceListPage"),
);
const ResourceDetailPage = lazy(
  () => import("@/features/resource-management/pages/ResourceDetailPage"),
);
```

Inside the `<Routes>` block in router.tsx, add these two routes after the `ADMIN_USER_DETAIL` route:
```tsx
<Route
  path={RoutesEnum.ADMIN_RESOURCES}
  element={
    <ProtectedRoute
      requiredRole="ADMIN"
      loginPath={RoutesEnum.LOGIN_ADMIN}
    >
      <ResourceListPage />
    </ProtectedRoute>
  }
/>
<Route
  path={RoutesEnum.ADMIN_RESOURCE_DETAIL}
  element={
    <ProtectedRoute
      requiredRole="ADMIN"
      loginPath={RoutesEnum.LOGIN_ADMIN}
    >
      <ResourceDetailPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 3: Add Resources nav item to AdminLayout**

In `NAFClient/src/shared/components/layout/AdminLayout.tsx`, add `Box` to the lucide-react import and add the Resources nav item to the `navItems` array:

Change the import line:
```typescript
import { Home, Users, FileText, Wrench, Box } from "lucide-react";
```

Add to `navItems`:
```typescript
{ label: "Resources", icon: <Box className="w-5 h-5" />, href: "/admin/resources" },
```

The full updated `navItems` array:
```typescript
const navItems = [
  { label: "Home", icon: <Home className="w-5 h-5" />, href: "/admin" },
  { label: "NAFs", icon: <FileText className="w-5 h-5" />, href: "/admin/NAF" },
  { label: "Implementations", icon: <Wrench className="w-5 h-5" />, href: "/admin/for-implementations" },
  { label: "Users", icon: <Users className="w-5 h-5" />, href: "/admin/users" },
  { label: "Resources", icon: <Box className="w-5 h-5" />, href: "/admin/resources" },
];
```

- [ ] **Step 4: Build to verify**

Run from `NAFClient/`:
```
npm run build
```
Expected: Build completed without TypeScript errors.

- [ ] **Step 5: Final backend build verify**

Run from `NAFServer/`:
```
dotnet build
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 6: Commit**

```bash
git add NAFClient/src/app/routesEnum.ts
git add NAFClient/src/app/router.tsx
git add NAFClient/src/shared/components/layout/AdminLayout.tsx
git commit -m "feat: wire resource management routes and admin nav link"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Display all resources (active first, inactive toggle) → `ResourceListPage` + `useAdminResources` + `GET /api/admin/resources`
- ✅ Add new resource with initial workflow template and steps → `AddResourceDialog` + `useCreateResource` + `POST /api/admin/resources`
- ✅ Resource details (resource info, workflow template versions, steps per version) → `ResourceDetailPage` + `WorkflowTemplateVersions`
- ✅ Employees with resource grouped by location linking to their NAF → `EmployeesByLocation` + `GET /api/admin/resources/{id}` detail endpoint
- ✅ Deactivate resource → "Deactivate" button in `ResourceDetailPage` + `PUT /api/admin/resources/{id}/deactivate`
- ✅ Add new approval workflow template version → `AddWorkflowTemplateDialog` + `POST /api/admin/resources/{id}/workflow-templates`
- ✅ Create resource group inline → `CreateResourceGroupDialog` + `POST /api/ResourceGroups`
- ✅ Resource group dropdown with "Add other" → `AddResourceDialog` `Select` with `__add_other__` value

**Placeholder scan:** No TBDs, TODOs, or incomplete steps.

**Type consistency check:**
- `StepRow` defined in `types.ts` and used by `WorkflowStepBuilder`, `AddResourceDialog`, `AddWorkflowTemplateDialog` — consistent.
- `AdminResourceListItem` used in `ResourceCard` and `ResourceListPage` — consistent.
- `AdminResourceDetail` used in `ResourceDetailPage` — consistent.
- `useAddWorkflowTemplate(resourceId)` takes `resourceId` param in both hook definition and usage — consistent.
- `ADMIN_RESOURCES` and `ADMIN_RESOURCE_DETAIL` added to enum and referenced in `ResourceListPage`, `ResourceDetailPage`, router — consistent.
