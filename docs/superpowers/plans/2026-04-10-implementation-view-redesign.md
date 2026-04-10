# Implementation View Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change `GetForImplementationsAsync` and `GetMyTasksAsync` to return `List<NAFDTO>`, then replace the flat card lists on For Implementations and My Tasks pages with grouped accordions (per NAF / per resource) with info modal, assign, and task-action buttons.

**Architecture:** Backend queries NAFs with filtered resource requests (IMPLEMENTATION progress only), maps to the existing NAFDTO shape. Frontend uses 6 new focused components in `features/tech/components/` shared across both pages; pages own only layout and mutations.

**Tech Stack:** ASP.NET Core 8 / EF Core, React 19 + TypeScript, Vite, Tailwind CSS v4, ShadCN, React Query

---

## File Map

### Backend — files to modify
| File | Change |
|---|---|
| `NAFServer/src/Application/DTOs/ResourceRequest/ResourceRequestDTO.cs` | Add `DateTime CreatedAt` parameter |
| `NAFServer/src/Mapper/NAFMapper.cs` | Pass `rr.CreatedAt` in ResourceRequestDTO construction |
| `NAFServer/src/Mapper/ResourceRequestMapper.cs` | Pass `rr.CreatedAt` in ResourceRequestDTO construction |
| `NAFServer/src/Domain/Interface/Repository/IImplementationRepository.cs` | Return types → `Task<List<NAF>>` for both query methods; rename GetMyTasks method |
| `NAFServer/src/Infrastructure/Persistence/Repositories/ImplementationRepository.cs` | Rewrite both query methods |
| `NAFServer/src/Application/Interfaces/IImplementationService.cs` | Return types → `Task<List<NAFDTO>>` |
| `NAFServer/src/Application/Services/ImplementationService.cs` | Add `IEmployeeRepository` dep, rewrite both query methods |

### Frontend — files to modify
| File | Change |
|---|---|
| `NAFClient/src/types/api/naf.ts` | Add `Implementation` interface, add `createdAt` + `implementation?` to `ResourceRequest` |
| `NAFClient/src/services/EntityAPI/implementationService.ts` | Update return types; remove `ForImplementationItemDTO` |

### Frontend — files to create
| File | Purpose |
|---|---|
| `NAFClient/src/features/tech/components/ImplementationViewToggle.tsx` | Per NAF / Per Resource toggle |
| `NAFClient/src/features/tech/components/ResourceRequestInfoModal.tsx` | Read-only info modal: purpose + approval history + purpose history |
| `NAFClient/src/features/tech/components/DelayedReasonModal.tsx` | Required-textarea modal for delay reason |
| `NAFClient/src/features/tech/components/ImplementationResourceRequestRow.tsx` | Single RR row, mode-aware actions |
| `NAFClient/src/features/tech/components/ImplementationNAFAccordion.tsx` | Accordion grouped by NAF |
| `NAFClient/src/features/tech/components/ImplementationResourceAccordion.tsx` | Accordion grouped by resource |

### Frontend — files to modify
| File | Change |
|---|---|
| `NAFClient/src/features/tech/hooks/useForImplementations.ts` | Return type → `NAF[]` |
| `NAFClient/src/features/tech/hooks/useMyTasks.ts` | Return type → `NAF[]` |
| `NAFClient/src/features/tech/pages/ForImplementationsPage.tsx` | Full rewrite with toggle + accordions |
| `NAFClient/src/features/tech/pages/MyTasksPage.tsx` | Full rewrite with toggle + accordions |

---

## Task 1: Add `CreatedAt` to `ResourceRequestDTO` and update mappers

**Files:**
- Modify: `NAFServer/src/Application/DTOs/ResourceRequest/ResourceRequestDTO.cs`
- Modify: `NAFServer/src/Mapper/NAFMapper.cs`
- Modify: `NAFServer/src/Mapper/ResourceRequestMapper.cs`

- [ ] **Step 1: Update `ResourceRequestDTO` to include `CreatedAt`**

Replace the entire file:

```csharp
using NAFServer.src.Application.DTOs.ResourceRequestApprovalStep;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record ResourceRequestDTO
    (
        Guid Id,
        int CurrentStep,
        Progress Progress,
        DateTime AccomplishedAt,
        Guid NAFId,
        Guid ApprovalWorkflowTemplateId,
        ResourceDTO Resource,
        object? AdditionalInfo,
        List<ResourceRequestPurposeDTO> Purposes,
        List<ResourceRequestApprovalStepDTO> Steps,
        ResourceRequestImplementationDTO? Implementation,
        DateTime CreatedAt
    );
}
```

- [ ] **Step 2: Update `NAFMapper.cs` — pass `rr.CreatedAt` as last argument**

In `NAFMapper.cs`, the `ResourceRequestDTO` construction in `NAFMapper.ToDTO` ends with `) : null`. Add `rr.CreatedAt` as the last argument, changing:

```csharp
                     rr.ResourceRequestImplementation != null ?
                     new ResourceRequestImplementationDTO
                     (
                         rr.ResourceRequestImplementation.Id,
                         rr.ResourceRequestImplementation.ResourceRequestId,
                         rr.ResourceRequestImplementation.AcceptedAt,
                         rr.ResourceRequestImplementation.AccomplishedAt,
                         rr.ResourceRequestImplementation.EmployeeId,
                         rr.ResourceRequestImplementation.Status,
                         rr.ResourceRequestImplementation.DelayReason,
                         rr.ResourceRequestImplementation.DelayedAt,
                         rr.ResourceRequestImplementation.CreatedAt,
                         rr.ResourceRequestImplementation.UpdatedAt
                     ) : null
                );
```

to:

```csharp
                     rr.ResourceRequestImplementation != null ?
                     new ResourceRequestImplementationDTO
                     (
                         rr.ResourceRequestImplementation.Id,
                         rr.ResourceRequestImplementation.ResourceRequestId,
                         rr.ResourceRequestImplementation.AcceptedAt,
                         rr.ResourceRequestImplementation.AccomplishedAt,
                         rr.ResourceRequestImplementation.EmployeeId,
                         rr.ResourceRequestImplementation.Status,
                         rr.ResourceRequestImplementation.DelayReason,
                         rr.ResourceRequestImplementation.DelayedAt,
                         rr.ResourceRequestImplementation.CreatedAt,
                         rr.ResourceRequestImplementation.UpdatedAt
                     ) : null,
                     rr.CreatedAt
                );
```

- [ ] **Step 3: Update `ResourceRequestMapper.cs` — pass `rr.CreatedAt`**

At the end of `ResourceRequestMapper.ToDTO`, after `) : null`, add `, rr.CreatedAt`:

```csharp
                     rr.ResourceRequestImplementation != null ?
                     new ResourceRequestImplementationDTO
                     (
                         rr.ResourceRequestImplementation.Id,
                         rr.ResourceRequestImplementation.ResourceRequestId,
                         rr.ResourceRequestImplementation.AcceptedAt,
                         rr.ResourceRequestImplementation.AccomplishedAt,
                         rr.ResourceRequestImplementation.EmployeeId,
                         rr.ResourceRequestImplementation.Status,
                         rr.ResourceRequestImplementation.DelayReason,
                         rr.ResourceRequestImplementation.DelayedAt,
                         rr.ResourceRequestImplementation.CreatedAt,
                         rr.ResourceRequestImplementation.UpdatedAt
                     ) : null,
                     rr.CreatedAt
            );
```

- [ ] **Step 4: Verify backend builds**

```bash
cd NAFServer && dotnet build
```

Expected: Build succeeded, 0 errors.

- [ ] **Step 5: Commit**

```bash
git add NAFServer/src/Application/DTOs/ResourceRequest/ResourceRequestDTO.cs NAFServer/src/Mapper/NAFMapper.cs NAFServer/src/Mapper/ResourceRequestMapper.cs
git commit -m "feat: add CreatedAt to ResourceRequestDTO"
```

---

## Task 2: Update `IImplementationRepository` and `ImplementationRepository`

**Files:**
- Modify: `NAFServer/src/Domain/Interface/Repository/IImplementationRepository.cs`
- Modify: `NAFServer/src/Infrastructure/Persistence/Repositories/ImplementationRepository.cs`

- [ ] **Step 1: Update `IImplementationRepository`**

Replace the entire file:

```csharp
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IImplementationRepository
    {
        Task<ResourceRequestImplementation> GetByIdAsync(string id);
        Task<List<NAF>> GetForImplementationsAsync();
        Task<List<NAF>> GetMyTasksByEmployeeIdAsync(string employeeId);
        Task<ResourceRequestImplementation?> GetByResourceRequestIdAsync(Guid resourceRequestId);
        Task<ResourceRequestImplementation> CreateAsync(Guid resourceRequestId);
    }
}
```

- [ ] **Step 2: Rewrite `ImplementationRepository`**

Replace the entire file:

```csharp
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;

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

        public async Task<List<NAF>> GetForImplementationsAsync()
        {
            var nafs = await _context.NAFs
                .Where(n => n.ResourceRequests.Any(rr => rr.Progress == Progress.IMPLEMENTATION))
                .Include(n => n.ResourceRequests.Where(rr => rr.Progress == Progress.IMPLEMENTATION))
                    .ThenInclude(rr => rr.Resource)
                .Include(n => n.ResourceRequests.Where(rr => rr.Progress == Progress.IMPLEMENTATION))
                    .ThenInclude(rr => rr.ResourceRequestPurposes)
                .Include(n => n.ResourceRequests.Where(rr => rr.Progress == Progress.IMPLEMENTATION))
                    .ThenInclude(rr => rr.ResourceRequestsApprovalSteps)
                        .ThenInclude(step => step.Histories)
                .Include(n => n.ResourceRequests.Where(rr => rr.Progress == Progress.IMPLEMENTATION))
                    .ThenInclude(rr => rr.ResourceRequestImplementation)
                .ToListAsync();

            var rrIds = nafs.SelectMany(n => n.ResourceRequests).Select(rr => rr.Id).ToList();

            if (rrIds.Any())
            {
                await _context.ResourceRequests
                    .Where(rr => rrIds.Contains(rr.Id) && rr.AdditionalInfo is InternetRequestInfo)
                    .Include(rr => ((InternetRequestInfo)rr.AdditionalInfo).InternetResource)
                        .ThenInclude(ir => ir.Purpose)
                    .LoadAsync();

                await _context.ResourceRequests
                    .Where(rr => rrIds.Contains(rr.Id) && rr.AdditionalInfo is SharedFolderRequestInfo)
                    .Include(rr => ((SharedFolderRequestInfo)rr.AdditionalInfo).SharedFolder)
                    .LoadAsync();

                await _context.ResourceRequests
                    .Where(rr => rrIds.Contains(rr.Id) && rr.AdditionalInfo is GroupEmailRequestInfo)
                    .Include(rr => ((GroupEmailRequestInfo)rr.AdditionalInfo).GroupEmail)
                    .LoadAsync();
            }

            return nafs;
        }

        public async Task<List<NAF>> GetMyTasksByEmployeeIdAsync(string employeeId)
        {
            var resourceRequestIds = await _context.Implementations
                .Where(i => i.EmployeeId == employeeId)
                .Select(i => i.ResourceRequestId)
                .ToListAsync();

            if (!resourceRequestIds.Any())
                return new List<NAF>();

            var nafs = await _context.NAFs
                .Where(n => n.ResourceRequests.Any(rr => resourceRequestIds.Contains(rr.Id)))
                .Include(n => n.ResourceRequests.Where(rr => resourceRequestIds.Contains(rr.Id)))
                    .ThenInclude(rr => rr.Resource)
                .Include(n => n.ResourceRequests.Where(rr => resourceRequestIds.Contains(rr.Id)))
                    .ThenInclude(rr => rr.ResourceRequestPurposes)
                .Include(n => n.ResourceRequests.Where(rr => resourceRequestIds.Contains(rr.Id)))
                    .ThenInclude(rr => rr.ResourceRequestsApprovalSteps)
                        .ThenInclude(step => step.Histories)
                .Include(n => n.ResourceRequests.Where(rr => resourceRequestIds.Contains(rr.Id)))
                    .ThenInclude(rr => rr.ResourceRequestImplementation)
                .ToListAsync();

            var rrIds = nafs.SelectMany(n => n.ResourceRequests).Select(rr => rr.Id).ToList();

            if (rrIds.Any())
            {
                await _context.ResourceRequests
                    .Where(rr => rrIds.Contains(rr.Id) && rr.AdditionalInfo is InternetRequestInfo)
                    .Include(rr => ((InternetRequestInfo)rr.AdditionalInfo).InternetResource)
                        .ThenInclude(ir => ir.Purpose)
                    .LoadAsync();

                await _context.ResourceRequests
                    .Where(rr => rrIds.Contains(rr.Id) && rr.AdditionalInfo is SharedFolderRequestInfo)
                    .Include(rr => ((SharedFolderRequestInfo)rr.AdditionalInfo).SharedFolder)
                    .LoadAsync();

                await _context.ResourceRequests
                    .Where(rr => rrIds.Contains(rr.Id) && rr.AdditionalInfo is GroupEmailRequestInfo)
                    .Include(rr => ((GroupEmailRequestInfo)rr.AdditionalInfo).GroupEmail)
                    .LoadAsync();
            }

            return nafs;
        }

        public async Task<ResourceRequestImplementation?> GetByResourceRequestIdAsync(Guid resourceRequestId)
        {
            return await _context.Implementations
                .FirstOrDefaultAsync(i => i.ResourceRequestId == resourceRequestId);
        }

        public async Task<ResourceRequestImplementation> CreateAsync(Guid resourceRequestId)
        {
            var implementation = new ResourceRequestImplementation(resourceRequestId);
            _context.Implementations.Add(implementation);
            await _context.SaveChangesAsync();
            return implementation;
        }
    }
}
```

- [ ] **Step 3: Verify backend builds**

```bash
cd NAFServer && dotnet build
```

Expected: Build succeeded, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Domain/Interface/Repository/IImplementationRepository.cs NAFServer/src/Infrastructure/Persistence/Repositories/ImplementationRepository.cs
git commit -m "feat: update implementation repository to return NAF entities"
```

---

## Task 3: Update `IImplementationService` and `ImplementationService`

**Files:**
- Modify: `NAFServer/src/Application/Interfaces/IImplementationService.cs`
- Modify: `NAFServer/src/Application/Services/ImplementationService.cs`

- [ ] **Step 1: Update `IImplementationService`**

Replace the entire file:

```csharp
using NAFServer.src.Application.DTOs.NAF;
using NAFServer.src.Application.DTOs.ResourceRequest;

namespace NAFServer.src.Application.Interfaces
{
    public interface IImplementationService
    {
        Task<ResourceRequestImplementationDTO> SetToInProgress(string request, string employeeId);
        Task<ResourceRequestImplementationDTO> SetToDelayed(string request, string delayReason);
        Task<ResourceRequestImplementationDTO> SetToAccomplished(string request);
        Task<List<NAFDTO>> GetMyTasksAsync(string employeeId);
        Task<List<NAFDTO>> GetForImplementationsAsync();
        Task<ForImplementationItemDTO> AssignToMeAsync(Guid resourceRequestId, string employeeId);
    }
}
```

- [ ] **Step 2: Rewrite `ImplementationService`**

Replace the entire file:

```csharp
using NAFServer.src.Application.DTOs.NAF;
using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;
using NAFServer.src.Mapper;
using static NAFServer.src.Domain.Entities.ResourceRequestImplementation;

namespace NAFServer.src.Application.Services
{
    public class ImplementationService : IImplementationService
    {
        private readonly IImplementationRepository _implementationRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly AppDbContext _context;

        public ImplementationService(
            IImplementationRepository implementationRepository,
            IEmployeeRepository employeeRepository,
            AppDbContext context)
        {
            _implementationRepository = implementationRepository;
            _employeeRepository = employeeRepository;
            _context = context;
        }

        public async Task<ResourceRequestImplementationDTO> SetToAccomplished(string request)
        {
            var implementation = await _implementationRepository.GetByIdAsync(request);
            implementation.SetToAccomplished();
            await _context.SaveChangesAsync();
            return ResourceRequestImplementationMapper.ToDTO(implementation);
        }

        public async Task<ResourceRequestImplementationDTO> SetToDelayed(string request, string delayReason)
        {
            var implementation = await _implementationRepository.GetByIdAsync(request);
            implementation.SetToDelayed(delayReason);
            await _context.SaveChangesAsync();
            return ResourceRequestImplementationMapper.ToDTO(implementation);
        }

        public async Task<ResourceRequestImplementationDTO> SetToInProgress(string request, string employeeId)
        {
            var implementation = await _implementationRepository.GetByIdAsync(request);
            implementation.SetToInProgress(employeeId);
            await _context.SaveChangesAsync();
            return ResourceRequestImplementationMapper.ToDTO(implementation);
        }

        public async Task<List<NAFDTO>> GetForImplementationsAsync()
        {
            var nafs = await _implementationRepository.GetForImplementationsAsync();
            return await MapNAFsToDTO(nafs);
        }

        public async Task<List<NAFDTO>> GetMyTasksAsync(string employeeId)
        {
            var nafs = await _implementationRepository.GetMyTasksByEmployeeIdAsync(employeeId);
            return await MapNAFsToDTO(nafs);
        }

        public async Task<ForImplementationItemDTO> AssignToMeAsync(Guid resourceRequestId, string employeeId)
        {
            var existing = await _implementationRepository.GetByResourceRequestIdAsync(resourceRequestId);

            if (existing != null && existing.EmployeeId != null)
                throw new InvalidOperationException("This resource request is already assigned.");

            var implementation = existing ?? await _implementationRepository.CreateAsync(resourceRequestId);
            implementation.SetToInProgress(employeeId);
            await _context.SaveChangesAsync();

            return new ForImplementationItemDTO(
                resourceRequestId,
                Guid.Empty,
                "IMPLEMENTATION",
                string.Empty,
                implementation.Id,
                implementation.Status,
                implementation.EmployeeId
            );
        }

        private async Task<List<NAFDTO>> MapNAFsToDTO(List<NAF> nafs)
        {
            var employeeIds = nafs.Select(n => n.EmployeeId).Distinct().ToList();
            var employees = new List<Employee>();
            foreach (var id in employeeIds)
            {
                var employee = await _employeeRepository.GetByIdAsync(id);
                if (employee != null) employees.Add(employee);
            }
            var employeeLookup = employees.ToDictionary(e => e.Id);

            var result = new List<NAFDTO>();
            foreach (var naf in nafs)
            {
                if (!employeeLookup.TryGetValue(naf.EmployeeId, out var employee)) continue;
                result.Add(NAFMapper.ToDTO(naf, employee));
            }
            return result;
        }
    }
}
```

- [ ] **Step 3: Verify backend builds**

```bash
cd NAFServer && dotnet build
```

Expected: Build succeeded, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Application/Interfaces/IImplementationService.cs NAFServer/src/Application/Services/ImplementationService.cs
git commit -m "feat: update implementation service to return NAFDTO list"
```

---

## Task 4: Update frontend types

**Files:**
- Modify: `NAFClient/src/types/api/naf.ts`

- [ ] **Step 1: Add `Implementation` interface and update `ResourceRequest`**

In `NAFClient/src/types/api/naf.ts`, add the `Implementation` interface after the `History` interface, and add `createdAt` and `implementation?` to `ResourceRequest`.

Add after the `History` interface block (after line 64):

```typescript
export interface Implementation {
  id: string;
  resourceRequestId: string;
  acceptedAt?: string;
  accomplishedAt?: string;
  employeeId?: string;
  status: "OPEN" | "IN_PROGRESS" | "DELAYED" | "ACCOMPLISHED";
  delayReason?: string;
  delayedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

Update the `ResourceRequest` interface (add `createdAt` and `implementation?`):

```typescript
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
  createdAt: string;
  implementation?: Implementation;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd NAFClient && npm run build 2>&1 | head -30
```

Expected: No type errors related to `naf.ts`.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/types/api/naf.ts
git commit -m "feat: add Implementation type and createdAt to ResourceRequest"
```

---

## Task 5: Update `implementationService.ts`

**Files:**
- Modify: `NAFClient/src/services/EntityAPI/implementationService.ts`

- [ ] **Step 1: Update service to return `NAF[]`**

Replace the entire file:

```typescript
import type { NAF } from "@/types/api/naf";
import { api } from "../api";
import type { ForImplementationItemDTO } from "@/features/tech/types";

export const implementationService = {
  getMyTasks: () =>
    api.get<NAF[]>("/implementations/my-tasks").then((r) => r.data),

  getForImplementations: () =>
    api.get<NAF[]>("/implementations/for-implementations").then((r) => r.data),

  assignToMe: (resourceRequestId: string) =>
    api
      .post<ForImplementationItemDTO>(`/implementations/resource-requests/${resourceRequestId}/assign`)
      .then((r) => r.data),

  setToInProgress: (implementationId: string) =>
    api.patch(`/implementations/${implementationId}/in-progress`).then((r) => r.data),

  setToDelayed: (implementationId: string, delayReason: string) =>
    api.patch(`/implementations/${implementationId}/delayed`, JSON.stringify(delayReason)).then((r) => r.data),

  setToAccomplished: (implementationId: string) =>
    api.patch(`/implementations/${implementationId}/accomplished`).then((r) => r.data),
};
```

- [ ] **Step 2: Create `features/tech/types.ts` for the remaining `ForImplementationItemDTO`**

Create `NAFClient/src/features/tech/types.ts`:

```typescript
import type { ImplementationStatus } from "../../types/api/naf";

export interface ForImplementationItemDTO {
  id: string;
  nafId: string;
  progress: string;
  resourceName: string;
  implementationId: string | null;
  implementationStatus: ImplementationStatus | null;
  assignedTo: string | null;
}
```

Wait — `ImplementationStatus` doesn't exist yet in the types. The `assignToMe` response is still using the old shape. Add the literal union instead:

```typescript
export interface ForImplementationItemDTO {
  id: string;
  nafId: string;
  progress: string;
  resourceName: string;
  implementationId: string | null;
  implementationStatus: "OPEN" | "IN_PROGRESS" | "DELAYED" | "ACCOMPLISHED" | null;
  assignedTo: string | null;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd NAFClient && npm run build 2>&1 | head -30
```

Expected: No errors from `implementationService.ts`.

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/services/EntityAPI/implementationService.ts NAFClient/src/features/tech/types.ts
git commit -m "feat: update implementation service return types to NAF[]"
```

---

## Task 6: Create `ImplementationViewToggle` component

**Files:**
- Create: `NAFClient/src/features/tech/components/ImplementationViewToggle.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { Button } from "@/components/ui/button";

interface Props {
  value: "per-naf" | "per-resource";
  onChange: (value: "per-naf" | "per-resource") => void;
}

export function ImplementationViewToggle({ value, onChange }: Props) {
  return (
    <div className="flex border rounded-lg overflow-hidden w-fit">
      <Button
        size="sm"
        variant={value === "per-naf" ? "default" : "ghost"}
        className="rounded-none border-0"
        onClick={() => onChange("per-naf")}
      >
        Per NAF
      </Button>
      <Button
        size="sm"
        variant={value === "per-resource" ? "default" : "ghost"}
        className="rounded-none border-0"
        onClick={() => onChange("per-resource")}
      >
        Per Resource
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd NAFClient && npm run build 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/tech/components/ImplementationViewToggle.tsx
git commit -m "feat: add ImplementationViewToggle component"
```

---

## Task 7: Create `ResourceRequestInfoModal` component

**Files:**
- Create: `NAFClient/src/features/tech/components/ResourceRequestInfoModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { ResourceRequest } from "@/types/api/naf";
import { Status } from "@/types/enum/status";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ResourceRequest | null;
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function statusLabel(status: Status) {
  if (status === Status.APPROVED) return "Approved";
  if (status === Status.REJECTED) return "Rejected";
  return String(status);
}

function statusClass(status: Status) {
  if (status === Status.APPROVED) return "text-emerald-600 font-semibold";
  if (status === Status.REJECTED) return "text-red-500 font-semibold";
  return "text-gray-500";
}

export function ResourceRequestInfoModal({ open, onOpenChange, request }: Props) {
  if (!request) return null;

  const sortedPurposes = [...request.purposes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const latestPurpose = sortedPurposes[sortedPurposes.length - 1]?.purpose;

  const stepHistories = request.steps
    .flatMap((step) =>
      step.histories.map((h) => ({
        stepOrder: step.stepOrder,
        status: h.status,
        comment: h.comment,
        reasonForRejection: h.reasonForRejection,
        actionAt: h.actionAt,
      }))
    )
    .sort((a, b) => new Date(a.actionAt).getTime() - new Date(b.actionAt).getTime());

  const purposeHistory = sortedPurposes.map((p, index) => ({
    purpose: p.purpose,
    createdAt: p.createdAt,
    label:
      index === 0
        ? "Initial Submission"
        : p.resourceRequestApprovalStepHistoryId
        ? "Edited after rejection"
        : "Edited while open",
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Request Information — {request.resource.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Latest Purpose */}
          {latestPurpose && (
            <section>
              <h3 className="text-sm font-semibold mb-2">Latest Purpose</h3>
              <Textarea
                readOnly
                value={latestPurpose}
                className="resize-none text-sm bg-muted"
                rows={3}
              />
            </section>
          )}

          {/* Approval Step History */}
          {stepHistories.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2">Approval History</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Approver</TableHead>
                    <TableHead className="text-xs">Action</TableHead>
                    <TableHead className="text-xs">Comment</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stepHistories.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">
                        Step {h.stepOrder} Approver
                      </TableCell>
                      <TableCell>
                        <span className={cn("text-sm", statusClass(h.status))}>
                          {statusLabel(h.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[160px]">
                        {h.reasonForRejection
                          ? h.reasonForRejection
                          : h.comment || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDateTime(h.actionAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          )}

          {/* Purpose Change History */}
          {purposeHistory.length > 1 && (
            <section>
              <h3 className="text-sm font-semibold mb-2">
                Purpose Change History
              </h3>
              <div className="space-y-3">
                {purposeHistory.map((p, i) => (
                  <div key={i} className="border rounded p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {p.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(p.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm">{p.purpose}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd NAFClient && npm run build 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/tech/components/ResourceRequestInfoModal.tsx
git commit -m "feat: add ResourceRequestInfoModal component"
```

---

## Task 8: Create `DelayedReasonModal` component

**Files:**
- Create: `NAFClient/src/features/tech/components/DelayedReasonModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
}

export function DelayedReasonModal({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: Props) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const isInvalid = touched && reason.trim() === "";

  const handleClose = (val: boolean) => {
    if (!val) {
      setReason("");
      setTouched(false);
    }
    onOpenChange(val);
  };

  const handleConfirm = () => {
    setTouched(true);
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason("");
    setTouched(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-yellow-700">Mark as Delayed</DialogTitle>
          <DialogDescription>
            Provide a reason for the delay before confirming.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="delay-reason" className="text-sm font-semibold">
            Reason for Delay <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="delay-reason"
            placeholder="State the reason for delay..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (touched) setTouched(false);
            }}
            onBlur={() => setTouched(true)}
            className={cn(
              "resize-none",
              isInvalid && "border-red-400 focus-visible:ring-red-400"
            )}
            rows={3}
          />
          {isInvalid && (
            <p className="text-xs text-red-500">Reason for delay is required.</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd NAFClient && npm run build 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/tech/components/DelayedReasonModal.tsx
git commit -m "feat: add DelayedReasonModal component"
```

---

## Task 9: Create `ImplementationResourceRequestRow` component

**Files:**
- Create: `NAFClient/src/features/tech/components/ImplementationResourceRequestRow.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState } from "react";
import { Info, UserPlus, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResourceRequest } from "@/types/api/naf";
import { handleAdditionalInfoStructured } from "@/types/api/naf";
import { ResourceRequestInfoModal } from "./ResourceRequestInfoModal";
import { DelayedReasonModal } from "./DelayedReasonModal";

interface Props {
  request: ResourceRequest;
  mode: "for-implementations" | "my-tasks";
  onAssign?: (requestId: string) => void;
  onMarkDelayed?: (implementationId: string, reason: string) => void;
  onMarkAccomplished?: (implementationId: string) => void;
  isSubmitting?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DELAYED: "bg-yellow-100 text-yellow-700",
  ACCOMPLISHED: "bg-green-100 text-green-700",
};

function ImplementationStatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  if (!status)
    return <span className="text-xs text-muted-foreground italic">Unassigned</span>;
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function ImplementationResourceRequestRow({
  request,
  mode,
  onAssign,
  onMarkDelayed,
  onMarkAccomplished,
  isSubmitting,
}: Props) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [delayOpen, setDelayOpen] = useState(false);

  const impl = request.implementation;
  const isAccomplished = impl?.status === "ACCOMPLISHED";
  const isDelayed = impl?.status === "DELAYED";

  const additionalInfoSummary =
    request.additionalInfo
      ? handleAdditionalInfoStructured(request.additionalInfo)
      : null;

  const additionalInfoText = additionalInfoSummary
    ? `${additionalInfoSummary.label}: ${Object.values(additionalInfoSummary.data).filter(Boolean).join(", ")}`
    : null;

  return (
    <>
      <div className="flex items-start justify-between gap-3 py-3 border-b last:border-b-0">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {request.resource.iconUrl && (
              <img
                src={request.resource.iconUrl}
                alt={request.resource.name}
                className="h-4 w-4 object-contain shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <span className="text-sm font-medium">{request.resource.name}</span>
            <ImplementationStatusBadge status={impl?.status} />
          </div>

          {request.resource.isSpecial && additionalInfoText && (
            <p className="text-xs text-muted-foreground">{additionalInfoText}</p>
          )}

          {mode === "for-implementations" && (
            <p className="text-xs text-muted-foreground">
              {impl?.employeeId
                ? `Assigned to: ${impl.employeeId}`
                : "Unassigned"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-7"
            onClick={() => setInfoOpen(true)}
          >
            <Info className="h-3 w-3" />
            More Info
          </Button>

          {mode === "for-implementations" && !impl?.employeeId && (
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5 text-xs h-7"
              onClick={() => onAssign?.(request.id)}
              disabled={isSubmitting}
            >
              <UserPlus className="h-3 w-3" />
              Assign to Me
            </Button>
          )}

          {mode === "my-tasks" && !isAccomplished && (
            <>
              {!isDelayed && (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100 gap-1.5 text-xs h-7"
                  onClick={() => setDelayOpen(true)}
                  disabled={isSubmitting}
                >
                  <Clock className="h-3 w-3" />
                  Delayed
                </Button>
              )}
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 text-xs h-7"
                onClick={() => impl?.id && onMarkAccomplished?.(impl.id)}
                disabled={isSubmitting || !impl?.id}
              >
                <CheckCircle className="h-3 w-3" />
                Accomplished
              </Button>
            </>
          )}
        </div>
      </div>

      <ResourceRequestInfoModal
        open={infoOpen}
        onOpenChange={setInfoOpen}
        request={request}
      />

      {mode === "my-tasks" && (
        <DelayedReasonModal
          open={delayOpen}
          onOpenChange={setDelayOpen}
          onConfirm={(reason) => {
            if (impl?.id) onMarkDelayed?.(impl.id, reason);
            setDelayOpen(false);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd NAFClient && npm run build 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/tech/components/ImplementationResourceRequestRow.tsx
git commit -m "feat: add ImplementationResourceRequestRow component"
```

---

## Task 10: Create `ImplementationNAFAccordion` component

**Files:**
- Create: `NAFClient/src/features/tech/components/ImplementationNAFAccordion.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { UserPlus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { NAF } from "@/types/api/naf";
import { ImplementationResourceRequestRow } from "./ImplementationResourceRequestRow";

interface Props {
  nafs: NAF[];
  mode: "for-implementations" | "my-tasks";
  onAssign?: (requestId: string) => void;
  onAssignAll?: (requestIds: string[]) => void;
  onMarkDelayed?: (implementationId: string, reason: string) => void;
  onMarkAccomplished?: (implementationId: string) => void;
  isSubmitting?: boolean;
}

export function ImplementationNAFAccordion({
  nafs,
  mode,
  onAssign,
  onAssignAll,
  onMarkDelayed,
  onMarkAccomplished,
  isSubmitting,
}: Props) {
  if (nafs.length === 0) return null;

  return (
    <Accordion type="multiple" className="space-y-2">
      {nafs.map((naf) => {
        const emp = naf.employee;
        const employeeName = [emp.firstName, emp.middleName, emp.lastName]
          .filter(Boolean)
          .join(" ");

        const unassignedIds = naf.resourceRequests
          .filter((rr) => !rr.implementation?.employeeId)
          .map((rr) => rr.id);

        return (
          <AccordionItem
            key={naf.id}
            value={naf.id}
            className="border rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
              <div className="flex flex-col items-start gap-0.5 text-left">
                <span className="text-sm font-semibold">{naf.reference}</span>
                <span className="text-xs text-muted-foreground">
                  {employeeName}
                </span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-4 pt-2 pb-4">
              {naf.resourceRequests.map((rr) => (
                <ImplementationResourceRequestRow
                  key={rr.id}
                  request={rr}
                  mode={mode}
                  onAssign={onAssign}
                  onMarkDelayed={onMarkDelayed}
                  onMarkAccomplished={onMarkAccomplished}
                  isSubmitting={isSubmitting}
                />
              ))}

              {mode === "for-implementations" && unassignedIds.length > 0 && (
                <div className="flex justify-end mt-3">
                  <Button
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
                    onClick={() => onAssignAll?.(unassignedIds)}
                    disabled={isSubmitting}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Assign All to Me
                  </Button>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd NAFClient && npm run build 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/tech/components/ImplementationNAFAccordion.tsx
git commit -m "feat: add ImplementationNAFAccordion component"
```

---

## Task 11: Create `ImplementationResourceAccordion` component

**Files:**
- Create: `NAFClient/src/features/tech/components/ImplementationResourceAccordion.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { UserPlus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { NAF, ResourceRequest } from "@/types/api/naf";
import { ImplementationResourceRequestRow } from "./ImplementationResourceRequestRow";

type EnrichedRequest = ResourceRequest & {
  nafReference: string;
  employeeName: string;
};

interface ResourceGroup {
  resourceId: number;
  resourceName: string;
  requests: EnrichedRequest[];
}

interface Props {
  nafs: NAF[];
  mode: "for-implementations" | "my-tasks";
  onAssign?: (requestId: string) => void;
  onAssignAll?: (requestIds: string[]) => void;
  onMarkDelayed?: (implementationId: string, reason: string) => void;
  onMarkAccomplished?: (implementationId: string) => void;
  isSubmitting?: boolean;
}

function buildResourceGroups(nafs: NAF[]): ResourceGroup[] {
  const groupMap = new Map<number, ResourceGroup>();

  for (const naf of nafs) {
    const emp = naf.employee;
    const employeeName = [emp.firstName, emp.middleName, emp.lastName]
      .filter(Boolean)
      .join(" ");

    for (const rr of naf.resourceRequests) {
      const resourceId = rr.resource.id;
      if (!groupMap.has(resourceId)) {
        groupMap.set(resourceId, {
          resourceId,
          resourceName: rr.resource.name,
          requests: [],
        });
      }
      groupMap.get(resourceId)!.requests.push({
        ...rr,
        nafReference: naf.reference,
        employeeName,
      });
    }
  }

  const groups = Array.from(groupMap.values());
  for (const group of groups) {
    group.requests.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  return groups;
}

export function ImplementationResourceAccordion({
  nafs,
  mode,
  onAssign,
  onAssignAll,
  onMarkDelayed,
  onMarkAccomplished,
  isSubmitting,
}: Props) {
  const groups = buildResourceGroups(nafs);

  if (groups.length === 0) return null;

  return (
    <Accordion type="multiple" className="space-y-2">
      {groups.map((group) => {
        const unassignedIds = group.requests
          .filter((rr) => !rr.implementation?.employeeId)
          .map((rr) => rr.id);

        return (
          <AccordionItem
            key={group.resourceId}
            value={String(group.resourceId)}
            className="border rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
              <span className="text-sm font-semibold">{group.resourceName}</span>
            </AccordionTrigger>

            <AccordionContent className="px-4 pt-2 pb-4">
              {group.requests.map((rr) => (
                <div key={rr.id}>
                  <p className="text-xs text-muted-foreground pt-2 pb-0.5">
                    NAF {rr.nafReference} — {rr.employeeName}
                  </p>
                  <ImplementationResourceRequestRow
                    request={rr}
                    mode={mode}
                    onAssign={onAssign}
                    onMarkDelayed={onMarkDelayed}
                    onMarkAccomplished={onMarkAccomplished}
                    isSubmitting={isSubmitting}
                  />
                </div>
              ))}

              {mode === "for-implementations" && unassignedIds.length > 0 && (
                <div className="flex justify-end mt-3">
                  <Button
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
                    onClick={() => onAssignAll?.(unassignedIds)}
                    disabled={isSubmitting}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Assign All to Me
                  </Button>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd NAFClient && npm run build 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/tech/components/ImplementationResourceAccordion.tsx
git commit -m "feat: add ImplementationResourceAccordion component"
```

---

## Task 12: Update hooks

**Files:**
- Modify: `NAFClient/src/features/tech/hooks/useForImplementations.ts`
- Modify: `NAFClient/src/features/tech/hooks/useMyTasks.ts`

- [ ] **Step 1: Update `useForImplementations.ts`**

Replace the entire file:

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { implementationService } from "@/services/EntityAPI/implementationService";

export function useForImplementations() {
  const queryClient = useQueryClient();

  const forImplementationsQuery = useQuery({
    queryKey: ["tech", "for-implementations"],
    queryFn: implementationService.getForImplementations,
  });

  const assignToMeMutation = useMutation({
    mutationFn: (resourceRequestId: string) =>
      implementationService.assignToMe(resourceRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tech", "for-implementations"] });
      queryClient.invalidateQueries({ queryKey: ["tech", "my-tasks"] });
    },
  });

  return { forImplementationsQuery, assignToMeMutation };
}
```

- [ ] **Step 2: Update `useMyTasks.ts`**

Replace the entire file:

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { implementationService } from "@/services/EntityAPI/implementationService";

export function useMyTasks() {
  const queryClient = useQueryClient();

  const myTasksQuery = useQuery({
    queryKey: ["tech", "my-tasks"],
    queryFn: implementationService.getMyTasks,
  });

  const setToDelayedMutation = useMutation({
    mutationFn: ({
      implementationId,
      reason,
    }: {
      implementationId: string;
      reason: string;
    }) => implementationService.setToDelayed(implementationId, reason),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["tech", "my-tasks"] }),
  });

  const setToAccomplishedMutation = useMutation({
    mutationFn: (implementationId: string) =>
      implementationService.setToAccomplished(implementationId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["tech", "my-tasks"] }),
  });

  return { myTasksQuery, setToDelayedMutation, setToAccomplishedMutation };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd NAFClient && npm run build 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/features/tech/hooks/useForImplementations.ts NAFClient/src/features/tech/hooks/useMyTasks.ts
git commit -m "feat: update implementation hooks to use NAF[] return type"
```

---

## Task 13: Rewrite `ForImplementationsPage`

**Files:**
- Modify: `NAFClient/src/features/tech/pages/ForImplementationsPage.tsx`

- [ ] **Step 1: Rewrite the page**

Replace the entire file:

```tsx
import { useState } from "react";
import TechTeamLayout from "@/components/layout/TechTeamLayout";
import { useForImplementations } from "../hooks/useForImplementations";
import { ImplementationViewToggle } from "../components/ImplementationViewToggle";
import { ImplementationNAFAccordion } from "../components/ImplementationNAFAccordion";
import { ImplementationResourceAccordion } from "../components/ImplementationResourceAccordion";

export default function ForImplementationsPage() {
  const [viewMode, setViewMode] = useState<"per-naf" | "per-resource">("per-naf");
  const { forImplementationsQuery, assignToMeMutation } = useForImplementations();

  const nafs = forImplementationsQuery.data ?? [];

  const handleAssign = (requestId: string) => {
    assignToMeMutation.mutate(requestId);
  };

  const handleAssignAll = (requestIds: string[]) => {
    for (const id of requestIds) {
      assignToMeMutation.mutate(id);
    }
  };

  return (
    <TechTeamLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-amber-500">For Implementations</h1>
        <ImplementationViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {forImplementationsQuery.isLoading && (
        <p className="text-muted-foreground">Loading...</p>
      )}

      {!forImplementationsQuery.isLoading && nafs.length === 0 && (
        <p className="text-muted-foreground">No items for implementation.</p>
      )}

      {viewMode === "per-naf" ? (
        <ImplementationNAFAccordion
          nafs={nafs}
          mode="for-implementations"
          onAssign={handleAssign}
          onAssignAll={handleAssignAll}
          isSubmitting={assignToMeMutation.isPending}
        />
      ) : (
        <ImplementationResourceAccordion
          nafs={nafs}
          mode="for-implementations"
          onAssign={handleAssign}
          onAssignAll={handleAssignAll}
          isSubmitting={assignToMeMutation.isPending}
        />
      )}
    </TechTeamLayout>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd NAFClient && npm run build 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/tech/pages/ForImplementationsPage.tsx
git commit -m "feat: rewrite ForImplementationsPage with accordion views"
```

---

## Task 14: Rewrite `MyTasksPage`

**Files:**
- Modify: `NAFClient/src/features/tech/pages/MyTasksPage.tsx`

- [ ] **Step 1: Rewrite the page**

Replace the entire file:

```tsx
import { useState } from "react";
import TechTeamLayout from "@/components/layout/TechTeamLayout";
import { useMyTasks } from "../hooks/useMyTasks";
import { ImplementationViewToggle } from "../components/ImplementationViewToggle";
import { ImplementationNAFAccordion } from "../components/ImplementationNAFAccordion";
import { ImplementationResourceAccordion } from "../components/ImplementationResourceAccordion";

export default function MyTasksPage() {
  const [viewMode, setViewMode] = useState<"per-naf" | "per-resource">("per-naf");
  const { myTasksQuery, setToDelayedMutation, setToAccomplishedMutation } =
    useMyTasks();

  const nafs = myTasksQuery.data ?? [];

  const handleMarkDelayed = (implementationId: string, reason: string) => {
    setToDelayedMutation.mutate({ implementationId, reason });
  };

  const handleMarkAccomplished = (implementationId: string) => {
    setToAccomplishedMutation.mutate(implementationId);
  };

  const isSubmitting =
    setToDelayedMutation.isPending || setToAccomplishedMutation.isPending;

  return (
    <TechTeamLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-amber-500">My Tasks</h1>
        <ImplementationViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {myTasksQuery.isLoading && (
        <p className="text-muted-foreground">Loading...</p>
      )}

      {!myTasksQuery.isLoading && nafs.length === 0 && (
        <p className="text-muted-foreground">No tasks assigned to you.</p>
      )}

      {viewMode === "per-naf" ? (
        <ImplementationNAFAccordion
          nafs={nafs}
          mode="my-tasks"
          onMarkDelayed={handleMarkDelayed}
          onMarkAccomplished={handleMarkAccomplished}
          isSubmitting={isSubmitting}
        />
      ) : (
        <ImplementationResourceAccordion
          nafs={nafs}
          mode="my-tasks"
          onMarkDelayed={handleMarkDelayed}
          onMarkAccomplished={handleMarkAccomplished}
          isSubmitting={isSubmitting}
        />
      )}
    </TechTeamLayout>
  );
}
```

- [ ] **Step 2: Verify full TypeScript build is clean**

```bash
cd NAFClient && npm run build 2>&1 | head -50
```

Expected: Build completed with no errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/tech/pages/MyTasksPage.tsx
git commit -m "feat: rewrite MyTasksPage with accordion views"
```
