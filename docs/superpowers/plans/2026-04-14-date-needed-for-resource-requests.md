# Date Needed for Resource Requests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the existing `DateNeeded` field on `ResourceRequest` through creation forms, display urgency/overdue indicators on all accordion views, and sort the technical team's implementation queue by nearest deadline.

**Architecture:** The `DateNeeded DateTime?` field already exists on the `ResourceRequest` entity and is mapped through `ResourceRequestMapper.ToDTO` and `ResourceRequestDTO`. This plan (1) plumbs it through DTOs and service calls so it gets persisted on creation, (2) adds date pickers to the two creation dialogs with the correct scoping rules (shared date on NAF create; per-resource date on Add Resource), (3) adds a reusable `getDateUrgency` utility and urgency badges to the requestor accordion, and (4) applies the same badges and deadline-based sorting to the technical team views.

**Tech Stack:** ASP.NET Core 8, EF Core, React 19, TypeScript, Tailwind CSS v4, ShadCN, React Query, Vite

---

## File Map

| File                                                                                | Change                                                                        |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `NAFServer/src/Application/DTOs/NAF/CreateNAFRequestDTO.cs`                         | Add `DateTime? DateNeeded`                                                    |
| `NAFServer/src/Application/DTOs/NAF/BasicResourceWithDateDTO.cs`                    | **Create** — per-resource payload for basic add                               |
| `NAFServer/src/Application/DTOs/NAF/AddBasicResourcesDTO.cs`                        | Change `List<int>` → `List<BasicResourceWithDateDTO>`                         |
| `NAFServer/src/Application/DTOs/ResourceRequest/CreateResourceRequestDTO.cs`        | Add `DateTime? dateNeeded = null`                                             |
| `NAFServer/src/Application/DTOs/ResourceRequest/CreateResourceRequestFromAPIDTO.cs` | Add `DateTime? dateNeeded = null`                                             |
| `NAFServer/src/Application/Interfaces/INAFService.cs`                               | Update `AddBasicResourcesToNAFAsync` signature                                |
| `NAFServer/src/Application/Services/NAFService.cs`                                  | Pass `DateNeeded` to `CreateBasicAsync`; update `AddBasicResourcesToNAFAsync` |
| `NAFServer/src/Application/Services/ResourceRequestService.cs`                      | Set `rr.DateNeeded` in `CreateBasicAsync` and `CreateSpecialAsync`            |
| `NAFServer/src/API/Controllers/NAFsController.cs`                                   | Update `AddBasicResources` to use `request.Resources`                         |
| `NAFClient/src/types/api/naf.ts`                                                    | Add `dateNeeded?: string` to `ResourceRequest`                                |
| `NAFClient/src/services/EntityAPI/nafService.ts`                                    | Add `dateNeeded` to `createNAF` payload                                       |
| `NAFClient/src/services/EntityAPI/resourceRequestService.ts`                        | Add `dateNeeded` to `createResourceRequest` payload                           |
| `NAFClient/src/services/EntityAPI/resourceMetadataService.ts`                       | Change `addBasicResourcesToNAF` to accept per-resource dates                  |
| `NAFClient/src/features/naf/hooks/useAddResource.ts`                                | Add `dateNeeded` to all entry types; switch to `basicResources` array         |
| `NAFClient/src/features/naf/components/createNAFDialog.tsx`                         | Add single shared date picker                                                 |
| `NAFClient/src/features/naf/components/addResourceDialog.tsx`                       | Add per-resource date inputs; track `BasicResourceWithDate[]`                 |
| `NAFClient/src/lib/dateUrgency.ts`                                                  | **Create** — `getDateUrgency` utility                                         |
| `NAFClient/src/features/naf/components/resourceRequestAccordion.tsx`                | Add `DateUrgencyBadge`, fix `PurposeBlock`, add overdue highlight             |
| `NAFClient/src/features/tech/components/ImplementationResourceRequestRow.tsx`       | Add urgency badge + overdue row highlight                                     |
| `NAFClient/src/features/tech/components/ImplementationNAFAccordion.tsx`             | Sort by nearest deadline; add overdue NAF border                              |
| `NAFClient/src/features/tech/components/ImplementationResourceAccordion.tsx`        | Sort requests within group by `dateNeeded`                                    |

---

## Task 1: Backend — Pass DateNeeded through Create NAF flow

**Files:**

- Modify: `NAFServer/src/Application/DTOs/NAF/CreateNAFRequestDTO.cs`
- Modify: `NAFServer/src/Application/DTOs/ResourceRequest/CreateResourceRequestDTO.cs`
- Modify: `NAFServer/src/Application/Services/ResourceRequestService.cs`
- Modify: `NAFServer/src/Application/Services/NAFService.cs`

- [ ] **Step 1: Add DateNeeded to CreateNAFRequestDTO**

Replace `NAFServer/src/Application/DTOs/NAF/CreateNAFRequestDTO.cs` entirely:

```csharp
namespace NAFServer.src.Application.DTOs.NAF
{
    public record CreateNAFRequestDTO
    (
        string EmployeeId,
        string RequestorId,
        List<int> resourceIds,
        DateTime? DateNeeded
    );
}
```

- [ ] **Step 2: Add dateNeeded to CreateResourceRequestDTO**

Replace `NAFServer/src/Application/DTOs/ResourceRequest/CreateResourceRequestDTO.cs` entirely:

```csharp
using System.Text.Json;

namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record CreateResourceRequestDTO
    (
        Guid nafId,
        int resourceId,
        string purpose,
        JsonElement? additionalInfo,
        DateTime? dateNeeded = null
    );
}
```

- [ ] **Step 3: Set DateNeeded in ResourceRequestService.CreateBasicAsync**

In `NAFServer/src/Application/Services/ResourceRequestService.cs`, in `CreateBasicAsync`, after the `var rr = new ResourceRequest(...)` call, add the line that sets `DateNeeded`:

```csharp
var rr = new ResourceRequest(
    request.nafId,
    request.resourceId,
    workflow,
    null,
    Progress.IMPLEMENTATION
);
rr.DateNeeded = request.dateNeeded;
```

- [ ] **Step 4: Pass DateNeeded from NAFService.CreateAsync**

In `NAFServer/src/Application/Services/NAFService.cs`, update the `foreach` loop inside `CreateAsync` to pass `request.DateNeeded`:

```csharp
foreach (var r in basicResourcesIds)
{
    await _resourceRequestService.CreateBasicAsync(
        new CreateResourceRequestDTO(
            naf.Id,
            r,
            "Basic resource needed for all employee",
            null,
            request.DateNeeded
        )
    );
}
```

- [ ] **Step 5: Build and verify**

```
cd NAFServer && dotnet build
```

Expected: `Build succeeded` with 0 errors.

- [ ] **Step 6: Commit**

```bash
git add NAFServer/src/Application/DTOs/NAF/CreateNAFRequestDTO.cs NAFServer/src/Application/DTOs/ResourceRequest/CreateResourceRequestDTO.cs NAFServer/src/Application/Services/ResourceRequestService.cs NAFServer/src/Application/Services/NAFService.cs
git commit -m "feat: pass DateNeeded through Create NAF flow"
```

---

## Task 2: Backend — Pass DateNeeded through Add Resource flow

**Files:**

- Create: `NAFServer/src/Application/DTOs/NAF/BasicResourceWithDateDTO.cs`
- Modify: `NAFServer/src/Application/DTOs/NAF/AddBasicResourcesDTO.cs`
- Modify: `NAFServer/src/Application/DTOs/ResourceRequest/CreateResourceRequestFromAPIDTO.cs`
- Modify: `NAFServer/src/Application/Interfaces/INAFService.cs`
- Modify: `NAFServer/src/Application/Services/NAFService.cs`
- Modify: `NAFServer/src/Application/Services/ResourceRequestService.cs`
- Modify: `NAFServer/src/API/Controllers/NAFsController.cs`

- [ ] **Step 1: Create BasicResourceWithDateDTO**

Create `NAFServer/src/Application/DTOs/NAF/BasicResourceWithDateDTO.cs`:

```csharp
namespace NAFServer.src.Application.DTOs.NAF
{
    public record BasicResourceWithDateDTO(int ResourceId, DateTime? DateNeeded);
}
```

- [ ] **Step 2: Update AddBasicResourcesDTO**

Replace `NAFServer/src/Application/DTOs/NAF/AddBasicResourcesDTO.cs` entirely:

```csharp
namespace NAFServer.src.Application.DTOs.NAF
{
    public record AddBasicResourcesDTO(List<BasicResourceWithDateDTO> Resources);
}
```

- [ ] **Step 3: Add dateNeeded to CreateResourceRequestFromAPIDTO**

Replace `NAFServer/src/Application/DTOs/ResourceRequest/CreateResourceRequestFromAPIDTO.cs` entirely:

```csharp
namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record CreateResourceRequestFromAPIDTO
    (
        int resourceId,
        string purpose,
        object? additionalInfo,
        DateTime? dateNeeded = null
    );
}
```

- [ ] **Step 4: Update INAFService signature**

In `NAFServer/src/Application/Interfaces/INAFService.cs`, change `AddBasicResourcesToNAFAsync`:

```csharp
Task<List<AddBasicResourceResultDTO>> AddBasicResourcesToNAFAsync(Guid nafId, List<BasicResourceWithDateDTO> resources);
```

Full file after edit:

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
        Task<List<AddBasicResourceResultDTO>> AddBasicResourcesToNAFAsync(Guid nafId, List<BasicResourceWithDateDTO> resources);
    }
}
```

- [ ] **Step 5: Update NAFService.AddBasicResourcesToNAFAsync to use per-resource dates**

In `NAFServer/src/Application/Services/NAFService.cs`, replace the entire `AddBasicResourcesToNAFAsync` method:

```csharp
public async Task<List<AddBasicResourceResultDTO>> AddBasicResourcesToNAFAsync(Guid nafId, List<BasicResourceWithDateDTO> resources)
{
    var results = new List<AddBasicResourceResultDTO>();

    foreach (var resource in resources.DistinctBy(r => r.ResourceId))
    {
        try
        {
            bool alreadyExists = await _context.ResourceRequests
                .AnyAsync(rr => rr.NAFId == nafId && rr.ResourceId == resource.ResourceId);

            if (alreadyExists)
            {
                results.Add(new AddBasicResourceResultDTO(
                    resource.ResourceId, false, "Resource already exists in this NAF", null));
                continue;
            }

            var rr = await _resourceRequestService.CreateBasicAsync(
                new CreateResourceRequestDTO(nafId, resource.ResourceId, "Basic resource needed", null, resource.DateNeeded));

            results.Add(new AddBasicResourceResultDTO(resource.ResourceId, true, null, rr));
        }
        catch (Exception ex)
        {
            results.Add(new AddBasicResourceResultDTO(resource.ResourceId, false, ex.Message, null));
        }
    }

    return results;
}
```

- [ ] **Step 6: Set DateNeeded in ResourceRequestService.CreateSpecialAsync**

In `NAFServer/src/Application/Services/ResourceRequestService.cs`, in `CreateSpecialAsync`, after `var rr = new ResourceRequest(request.nafId, request.resourceId, workflowId, additionalInfo, Progress.OPEN)`, add:

```csharp
var rr = new ResourceRequest(request.nafId, request.resourceId, workflowId, additionalInfo, Progress.OPEN);
rr.DateNeeded = request.dateNeeded;
```

- [ ] **Step 7: Update NAFsController to use Resources property**

In `NAFServer/src/API/Controllers/NAFsController.cs`, update the `AddBasicResources` action — change `request.ResourceIds` to `request.Resources`:

```csharp
[HttpPost("{nafId:guid}/resources/basic")]
public async Task<IActionResult> AddBasicResources(Guid nafId, [FromBody] AddBasicResourcesDTO request)
{
    try
    {
        var results = await _nafService.AddBasicResourcesToNAFAsync(nafId, request.Resources);
        return Ok(results);
    }
    catch (Exception ex)
    {
        return BadRequest(ex.Message);
    }
}
```

- [ ] **Step 8: Build and verify**

```
cd NAFServer && dotnet build
```

Expected: `Build succeeded` with 0 errors.

- [ ] **Step 9: Commit**

```bash
git add NAFServer/src/Application/DTOs/NAF/ NAFServer/src/Application/DTOs/ResourceRequest/CreateResourceRequestFromAPIDTO.cs NAFServer/src/Application/Interfaces/INAFService.cs NAFServer/src/Application/Services/NAFService.cs NAFServer/src/Application/Services/ResourceRequestService.cs NAFServer/src/API/Controllers/NAFsController.cs
git commit -m "feat: pass DateNeeded through Add Resource flow with per-resource dates"
```

---

## Task 3: Frontend — Add dateNeeded to types, nafService, and createNAFDialog

**Files:**

- Modify: `NAFClient/src/types/api/naf.ts`
- Modify: `NAFClient/src/services/EntityAPI/nafService.ts`
- Modify: `NAFClient/src/services/EntityAPI/resourceRequestService.ts`
- Modify: `NAFClient/src/features/naf/components/createNAFDialog.tsx`

- [ ] **Step 1: Add dateNeeded to ResourceRequest type**

In `NAFClient/src/types/api/naf.ts`, in the `ResourceRequest` interface, add `dateNeeded?: string` after `accomplishedAt`:

```typescript
export interface ResourceRequest extends Entity<string> {
  currentStep: number;
  progress: Progress;
  accomplishedAt?: string;
  dateNeeded?: string;
  nafId: string;
  resource: Resource;
  approvalWorkflowTemplateId: string;
  additionalInfo?: AdditionalInfo;
  histories: ResourceRequestHistory[];
  purposes: Purpose[];
  steps: Step[];
  createdAt: string;
  implementation?: Implementation;
}
```

- [ ] **Step 2: Update nafService.ts createNAF to accept dateNeeded**

In `NAFClient/src/services/EntityAPI/nafService.ts`, update the `createNAF` function signature:

```typescript
export const createNAF = async (payload: {
  employeeId: string;
  requestorId: string;
  resourceIds: number[];
  dateNeeded?: string | null;
}) => {
  const response = await api.post("/NAFs", payload);
  return response.data;
};
```

- [ ] **Step 3: Update resourceRequestService.ts createResourceRequest to accept dateNeeded**

In `NAFClient/src/services/EntityAPI/resourceRequestService.ts`, update `createResourceRequest`:

```typescript
export const createResourceRequest = async (payload: {
  nafId: string;
  resourceId: number;
  purpose: string;
  additionalInfo: Record<string, unknown>;
  dateNeeded?: string | null;
}): Promise<ResourceRequest> => {
  return (await api.post("/Requests", payload)).data;
};
```

- [ ] **Step 4: Add dateNeeded state to createNAFDialog**

In `NAFClient/src/features/naf/components/createNAFDialog.tsx`, add `dateNeeded` state alongside the other state declarations:

```typescript
const [dateNeeded, setDateNeeded] = useState<string>("");
```

- [ ] **Step 5: Include dateNeeded in the reset function**

In `createNAFDialog.tsx`, update the `reset` function:

```typescript
const reset = () => {
  setSelectedEmployee(null);
  setShowEmployeeHasNAFAlert(false);
  setToRequest([]);
  setSelectedHardware(Hardware.None);
  setDateNeeded("");
};
```

- [ ] **Step 6: Include dateNeeded in handleSubmit payload**

In `createNAFDialog.tsx`, update `payload` in `handleSubmit`:

```typescript
const payload = {
  employeeId: selectedEmployee.id,
  requestorId: user.employeeId,
  resourceIds: [...toRequest, Number(selectedHardware)],
  dateNeeded: dateNeeded || null,
};
```

- [ ] **Step 7: Add date input to the form in createNAFDialog**

In `createNAFDialog.tsx`, inside the `!showEmployeeHasNAFAlert` block (the `<div className="flex flex-col gap-2 overflow-y-auto">`), add a date field after `<HardwareSelect />` and before `<BasicResources />`:

```tsx
<div className="flex flex-col gap-1">
  <FieldLabel htmlFor="date-needed">Date Needed</FieldLabel>
  <input
    id="date-needed"
    type="date"
    value={dateNeeded}
    min={new Date().toISOString().split("T")[0]}
    onChange={(e) => setDateNeeded(e.target.value)}
    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
  />
</div>
```

- [ ] **Step 8: TypeScript build check**

```
cd NAFClient && npm run build 2>&1 | head -40
```

Expected: No TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add NAFClient/src/types/api/naf.ts NAFClient/src/services/EntityAPI/nafService.ts NAFClient/src/services/EntityAPI/resourceRequestService.ts NAFClient/src/features/naf/components/createNAFDialog.tsx
git commit -m "feat: add DateNeeded field to create NAF form"
```

---

## Task 4: Frontend — Add per-resource DateNeeded to addResourceDialog

**Files:**

- Modify: `NAFClient/src/features/naf/hooks/useAddResource.ts`
- Modify: `NAFClient/src/services/EntityAPI/resourceMetadataService.ts`
- Modify: `NAFClient/src/features/naf/components/addResourceDialog.tsx`

- [ ] **Step 1: Add dateNeeded to entry types and update AddResourcesParams in useAddResource.ts**

Replace the entry types and params in `NAFClient/src/features/naf/hooks/useAddResource.ts`:

```typescript
import { useQueryClient } from "@tanstack/react-query";
import { addBasicResourcesToNAF } from "@/services/EntityAPI/resourceMetadataService";
import { createResourceRequest } from "@/services/EntityAPI/resourceRequestService";

export type InternetEntry = {
  _id: string;
  internetPurposeId: number | null;
  internetResourceId: number | null;
  purpose: string;
  dateNeeded: string;
};

export type GroupEmailEntry = {
  _id: string;
  groupEmailId: number | null;
  purpose: string;
  dateNeeded: string;
};

export type SharedFolderEntry = {
  _id: string;
  sharedFolderId: number | null;
  purpose: string;
  dateNeeded: string;
};

export type BasicResourceWithDate = {
  id: number;
  dateNeeded: string;
};

type AddResourcesParams = {
  nafId: string;
  basicResources: BasicResourceWithDate[];
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
    if (params.basicResources.length > 0) {
      try {
        const results = await addBasicResourcesToNAF(
          params.nafId,
          params.basicResources,
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

    // ── Special resources ─────────────────────────────────────────────────────
    const specialTasks: Promise<void>[] = [];

    params.internetEntries.forEach((entry) => {
      specialTasks.push(
        createResourceRequest({
          nafId: params.nafId,
          resourceId: 1,
          purpose: entry.purpose,
          additionalInfo: { InternetResourceId: entry.internetResourceId! },
          dateNeeded: entry.dateNeeded || null,
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
          dateNeeded: entry.dateNeeded || null,
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
          dateNeeded: entry.dateNeeded || null,
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

- [ ] **Step 2: Update resourceMetadataService.ts addBasicResourcesToNAF**

In `NAFClient/src/services/EntityAPI/resourceMetadataService.ts`, update `addBasicResourcesToNAF` to pass per-resource dates using the new backend shape:

```typescript
export const addBasicResourcesToNAF = async (
  nafId: string,
  resources: { id: number; dateNeeded: string }[],
): Promise<AddBasicResourceResult[]> => {
  return (
    await api.post(`/NAFs/${nafId}/resources/basic`, {
      resources: resources.map((r) => ({
        resourceId: r.id,
        dateNeeded: r.dateNeeded || null,
      })),
    })
  ).data;
};
```

- [ ] **Step 3: Update addResourceDialog state — switch selectedBasic to basicResources**

In `NAFClient/src/features/naf/components/addResourceDialog.tsx`:

1. Add import at the top:

```typescript
import type {
  BasicResourceWithDate,
  InternetEntry,
  GroupEmailEntry,
  SharedFolderEntry,
} from "../hooks/useAddResource";
```

2. Replace the `selectedBasic` state declaration:

```typescript
// Remove: const [selectedBasic, setSelectedBasic] = useState<number[]>([]);
const [basicResources, setBasicResources] = useState<BasicResourceWithDate[]>(
  [],
);
```

3. Update `reset()`:

```typescript
const reset = () => {
  setBasicResources([]);
  setInternetEntries([]);
  setGroupEmailEntries([]);
  setSharedFolderEntries([]);
  setSubmitErrors([]);
};
```

4. Update `hasAnything`:

```typescript
const hasAnything =
  basicResources.length > 0 ||
  internetEntries.length > 0 ||
  groupEmailEntries.length > 0 ||
  sharedFolderEntries.length > 0;
```

5. Update `handleSubmit` call to pass `basicResources`:

```typescript
const result = await submit({
  nafId: naf.id,
  basicResources,
  internetEntries,
  groupEmailEntries,
  sharedFolderEntries,
});
```

- [ ] **Step 4: Update initial entry factories to include dateNeeded**

In `addResourceDialog.tsx`, update the three factory functions:

```typescript
const addInternetEntry = () =>
  setInternetEntries((prev) => [
    ...prev,
    {
      _id: newEntry(),
      internetPurposeId: null,
      internetResourceId: null,
      purpose: "",
      dateNeeded: "",
    },
  ]);

const addGroupEmailEntry = () =>
  setGroupEmailEntries((prev) => [
    ...prev,
    { _id: newEntry(), groupEmailId: null, purpose: "", dateNeeded: "" },
  ]);

const addSharedFolderEntry = () =>
  setSharedFolderEntries((prev) => [
    ...prev,
    { _id: newEntry(), sharedFolderId: null, purpose: "", dateNeeded: "" },
  ]);
```

- [ ] **Step 5: Update basic resources section UI to show per-resource date input**

In `addResourceDialog.tsx`, replace the basic resources rendering section (inside the `availableBasic.length > 0` block). Replace the existing `<div className="flex flex-wrap gap-4">` content:

```tsx
<div className="flex flex-col gap-2">
  {availableBasic.map((r) => {
    const entry = basicResources.find((b) => b.id === r.id);
    const isChecked = !!entry;
    return (
      <div key={r.id} className="border rounded-md p-2 space-y-1.5">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`basic-${r.id}`}
            checked={isChecked}
            onCheckedChange={(checked) => {
              if (checked) {
                setBasicResources((prev) => [
                  ...prev,
                  { id: r.id, dateNeeded: "" },
                ]);
              } else {
                setBasicResources((prev) => prev.filter((b) => b.id !== r.id));
              }
            }}
          />
          <FieldLabel htmlFor={`basic-${r.id}`}>{r.name}</FieldLabel>
        </div>
        {isChecked && (
          <input
            type="date"
            value={entry!.dateNeeded}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) =>
              setBasicResources((prev) =>
                prev.map((b) =>
                  b.id === r.id ? { ...b, dateNeeded: e.target.value } : b,
                ),
              )
            }
            className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
          />
        )}
      </div>
    );
  })}
</div>
```

- [ ] **Step 6: Add dateNeeded field to InternetEntryCard**

In `addResourceDialog.tsx`, inside `InternetEntryCard`, add a date input at the bottom of the card (after the "Purpose of Access" section):

```tsx
<div className="space-y-1">
  <FieldLabel>Date Needed</FieldLabel>
  <input
    type="date"
    value={entry.dateNeeded}
    min={new Date().toISOString().split("T")[0]}
    onChange={(e) => onChange({ dateNeeded: e.target.value })}
    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
  />
</div>
```

- [ ] **Step 7: Add dateNeeded field to GroupEmailEntryCard**

In `addResourceDialog.tsx`, inside `GroupEmailEntryCard`, add a date input after the "Purpose of Access" section:

```tsx
<div className="space-y-1">
  <FieldLabel>Date Needed</FieldLabel>
  <input
    type="date"
    value={entry.dateNeeded}
    min={new Date().toISOString().split("T")[0]}
    onChange={(e) => onChange({ dateNeeded: e.target.value })}
    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
  />
</div>
```

- [ ] **Step 8: Add dateNeeded field to SharedFolderEntryCard**

In `addResourceDialog.tsx`, inside `SharedFolderEntryCard`, add a date input after the "Purpose of Access" section:

```tsx
<div className="space-y-1">
  <FieldLabel>Date Needed</FieldLabel>
  <input
    type="date"
    value={entry.dateNeeded}
    min={new Date().toISOString().split("T")[0]}
    onChange={(e) => onChange({ dateNeeded: e.target.value })}
    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
  />
</div>
```

- [ ] **Step 9: TypeScript build check**

```
cd NAFClient && npm run build 2>&1 | head -50
```

Expected: No TypeScript errors.

- [ ] **Step 10: Commit**

```bash
git add NAFClient/src/features/naf/hooks/useAddResource.ts NAFClient/src/services/EntityAPI/resourceMetadataService.ts NAFClient/src/features/naf/components/addResourceDialog.tsx
git commit -m "feat: add per-resource DateNeeded to Add Resource dialog"
```

---

## Task 5: Frontend — Date urgency utility and requestor accordion display

**Files:**

- Create: `NAFClient/src/lib/dateUrgency.ts`
- Modify: `NAFClient/src/features/naf/components/resourceRequestAccordion.tsx`

- [ ] **Step 1: Create dateUrgency.ts utility**

Create `NAFClient/src/lib/dateUrgency.ts`:

```typescript
export type UrgencyResult =
  | { overdue: false; label: string }
  | { overdue: true; label: string };

/**
 * Returns urgency info for a dateNeeded string.
 * - Returns null if dateNeeded is absent.
 * - Overdue: "X days/weeks/months/years overdue"
 * - Future:
 *   - >= 1 year remaining: years
 *   - >= 1 month remaining: months
 *   - > 1 week remaining: weeks
 *   - <= 1 week remaining: days
 */
export function getDateUrgency(
  dateNeeded: string | null | undefined,
): UrgencyResult | null {
  if (!dateNeeded) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateNeeded);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays >= 365) {
      const years = Math.floor(absDays / 365);
      return {
        overdue: true,
        label: `${years} ${years === 1 ? "year" : "years"} overdue`,
      };
    }
    if (absDays >= 30) {
      const months = Math.floor(absDays / 30);
      return {
        overdue: true,
        label: `${months} ${months === 1 ? "month" : "months"} overdue`,
      };
    }
    if (absDays >= 7) {
      const weeks = Math.floor(absDays / 7);
      return {
        overdue: true,
        label: `${weeks} ${weeks === 1 ? "week" : "weeks"} overdue`,
      };
    }
    return {
      overdue: true,
      label: `${absDays} ${absDays === 1 ? "day" : "days"} overdue`,
    };
  }

  if (diffDays === 0) return { overdue: false, label: "due today" };

  if (diffDays >= 365) {
    const years = Math.floor(diffDays / 365);
    return {
      overdue: false,
      label: `${years} ${years === 1 ? "year" : "years"} remaining`,
    };
  }
  if (diffDays >= 30) {
    const months = Math.floor(diffDays / 30);
    return {
      overdue: false,
      label: `${months} ${months === 1 ? "month" : "months"} remaining`,
    };
  }
  if (diffDays > 7) {
    const weeks = Math.floor(diffDays / 7);
    return {
      overdue: false,
      label: `${weeks} ${weeks === 1 ? "week" : "weeks"} remaining`,
    };
  }
  return {
    overdue: false,
    label: `${diffDays} ${diffDays === 1 ? "day" : "days"} remaining`,
  };
}
```

- [ ] **Step 2: Add getDateUrgency import and DateUrgencyBadge to resourceRequestAccordion**

In `NAFClient/src/features/naf/components/resourceRequestAccordion.tsx`, add the import at the top:

```typescript
import { getDateUrgency } from "@/lib/dateUrgency";
```

Add `DateUrgencyBadge` component after the existing helper components (e.g., after `ActivityBadge`):

```tsx
function DateUrgencyBadge({ dateNeeded }: { dateNeeded?: string | null }) {
  const urgency = getDateUrgency(dateNeeded);
  if (!urgency) return null;

  return (
    <span
      className={cn(
        "text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
        urgency.overdue
          ? "bg-red-100 text-red-700"
          : "bg-amber-50 text-amber-700",
      )}
    >
      {urgency.label}
    </span>
  );
}
```

- [ ] **Step 3: Fix PurposeBlock to show the real dateNeeded field**

In `resourceRequestAccordion.tsx`, replace the entire `PurposeBlock` function. The current one incorrectly shows `accomplishedAt` as "Date Needed":

```tsx
function PurposeBlock({ request }: { request: ResourceRequest }) {
  const purpose = request.purposes?.[request.purposes.length - 1]?.purpose;

  return (
    <div className="space-y-3">
      {request.dateNeeded && (
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Date Needed</p>
          <p className="text-sm font-medium">
            {new Date(request.dateNeeded).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      )}

      {purpose && (
        <div>
          <p className="text-sm font-semibold mb-1">Purpose</p>
          <Textarea
            readOnly
            value={purpose}
            className="resize-none text-sm bg-background"
            rows={3}
          />
        </div>
      )}

      {request.additionalInfo && (
        <AdditionalInfoBlock info={request.additionalInfo} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add DateUrgencyBadge to AccordionTrigger header**

In `ResourceRequestAccordionItem`, in the `AccordionTrigger`, add the badge inside the flex div that holds the resource name:

```tsx
<AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
  <div className="flex items-center gap-3 flex-1 min-w-0">
    <ResourceIcon
      iconUrl={request.resource.iconUrl}
      name={request.resource.name}
    />
    <span className="text-sm font-medium truncate">
      {request.resource.name}
    </span>
    <DateUrgencyBadge dateNeeded={request.dateNeeded} />
  </div>
  <span
    className={cn(
      "text-sm font-semibold mr-2 shrink-0",
      config?.className
        .split(" ")
        .filter((c) => c.startsWith("text-"))
        .join(" "),
    )}
  >
    {config?.label ?? String(progress)}
  </span>
</AccordionTrigger>
```

- [ ] **Step 5: Add overdue highlight border to AccordionItem**

In `ResourceRequestAccordionItem`, compute urgency before the return statement and apply conditional class to `AccordionItem`:

```tsx
const urgency = getDateUrgency(request.dateNeeded);

// AccordionItem:
<AccordionItem
  value={request.id}
  className={cn(
    "border rounded-lg px-0 overflow-hidden",
    urgency?.overdue && "border-red-300 bg-red-50/30",
  )}
>
```

- [ ] **Step 6: TypeScript build check**

```
cd NAFClient && npm run build 2>&1 | head -40
```

Expected: No TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add NAFClient/src/lib/dateUrgency.ts NAFClient/src/features/naf/components/resourceRequestAccordion.tsx
git commit -m "feat: add date urgency badges and overdue highlights to accordion"
```

---

## Task 6: Frontend — Technical team urgency display and sorting

**Files:**

- Modify: `NAFClient/src/features/tech/components/ImplementationResourceRequestRow.tsx`
- Modify: `NAFClient/src/features/tech/components/ImplementationNAFAccordion.tsx`
- Modify: `NAFClient/src/features/tech/components/ImplementationResourceAccordion.tsx`

- [ ] **Step 1: Add urgency badge and overdue highlight to ImplementationResourceRequestRow**

In `NAFClient/src/features/tech/components/ImplementationResourceRequestRow.tsx`, add imports:

```typescript
import { getDateUrgency } from "@/lib/dateUrgency";
import { cn } from "@/lib/utils";
```

In the outer `div` of the row, add the overdue background class:

```tsx
<div className={cn(
  "flex items-start justify-between gap-3 py-3 border-b last:border-b-0",
  getDateUrgency(request.dateNeeded)?.overdue && "bg-red-50/40",
)}>
```

In the left info section (after the `additionalInfoText` paragraph), add a date urgency inline:

```tsx
{
  (() => {
    const urgency = getDateUrgency(request.dateNeeded);
    if (!urgency) return null;
    return (
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${
          urgency.overdue
            ? "bg-red-100 text-red-700"
            : "bg-amber-50 text-amber-700"
        }`}
      >
        {urgency.label}
      </span>
    );
  })();
}
```

- [ ] **Step 2: Sort NAFs by nearest dateNeeded in ImplementationNAFAccordion**

In `NAFClient/src/features/tech/components/ImplementationNAFAccordion.tsx`, add imports:

```typescript
import { getDateUrgency } from "@/lib/dateUrgency";
import { cn } from "@/lib/utils";
```

Inside the `ImplementationNAFAccordion` function, before the JSX return, add a sort:

```typescript
const getEarliestDate = (naf: NAF): number => {
  const dates = naf.resourceRequests
    .map((rr) => rr.dateNeeded)
    .filter((d): d is string => !!d)
    .map((d) => new Date(d).getTime());
  return dates.length > 0 ? Math.min(...dates) : Infinity;
};

const sortedNafs = [...nafs].sort(
  (a, b) => getEarliestDate(a) - getEarliestDate(b),
);
```

Use `sortedNafs.map(...)` instead of `nafs.map(...)`.

- [ ] **Step 3: Add urgency indicator and overdue border to NAF items in ImplementationNAFAccordion**

Inside the `sortedNafs.map((naf) => ...)` callback, add helpers and update the JSX:

```typescript
const hasOverdue = naf.resourceRequests.some(
  (rr) => getDateUrgency(rr.dateNeeded)?.overdue,
);

const nearestDate = naf.resourceRequests
  .map((rr) => rr.dateNeeded)
  .filter((d): d is string => !!d)
  .reduce<string | null>(
    (min, d) => (min === null || new Date(d) < new Date(min) ? d : min),
    null,
  );
const nearestUrgency = getDateUrgency(nearestDate);
```

Update `AccordionItem` className:

```tsx
<AccordionItem
  key={naf.id}
  value={naf.id}
  className={cn(
    "border rounded-lg overflow-hidden",
    hasOverdue && "border-red-300",
  )}
>
```

In `AccordionTrigger`, add the urgency label below the employee name:

```tsx
<AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
  <div className="flex flex-col items-start gap-0.5 text-left">
    <span className="text-sm font-semibold">{naf.reference}</span>
    <span className="text-xs text-muted-foreground">{employeeName}</span>
    {nearestUrgency && (
      <span
        className={cn(
          "text-xs font-medium",
          nearestUrgency.overdue ? "text-red-600" : "text-amber-600",
        )}
      >
        {nearestUrgency.label}
      </span>
    )}
  </div>
</AccordionTrigger>
```

- [ ] **Step 4: Sort requests within each resource group in ImplementationResourceAccordion**

In `NAFClient/src/features/tech/components/ImplementationResourceAccordion.tsx`, update the `buildResourceGroups` function's sort to use `dateNeeded` (ascending, nulls last) instead of `createdAt`:

```typescript
for (const group of groups) {
  group.requests.sort((a, b) => {
    const aTime = a.dateNeeded ? new Date(a.dateNeeded).getTime() : Infinity;
    const bTime = b.dateNeeded ? new Date(b.dateNeeded).getTime() : Infinity;
    return aTime - bTime;
  });
}
```

Also add imports and overdue indicator on each row's NAF label:

```typescript
import { getDateUrgency } from "@/lib/dateUrgency";
```

In the rendering loop for `group.requests.map(...)`, update the NAF reference label to include urgency:

```tsx
{
  group.requests.map((rr) => {
    const urgency = getDateUrgency(rr.dateNeeded);
    return (
      <div key={rr.id}>
        <div className="flex items-center gap-2 pt-2 pb-0.5">
          <p className="text-xs text-muted-foreground">
            NAF {rr.nafReference} — {rr.employeeName}
          </p>
          {urgency && (
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                urgency.overdue
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {urgency.label}
            </span>
          )}
        </div>
        <ImplementationResourceRequestRow
          request={rr}
          mode={mode}
          onAssign={onAssign}
          onMarkDelayed={onMarkDelayed}
          onMarkAccomplished={onMarkAccomplished}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  });
}
```

- [ ] **Step 5: TypeScript build check**

```
cd NAFClient && npm run build 2>&1 | head -50
```

Expected: No TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add NAFClient/src/features/tech/components/ImplementationResourceRequestRow.tsx NAFClient/src/features/tech/components/ImplementationNAFAccordion.tsx NAFClient/src/features/tech/components/ImplementationResourceAccordion.tsx
git commit -m "feat: add urgency display and deadline sorting to technical team views"
```

---

## Self-Review

### Spec coverage:

1. ✅ Date needed on create NAF form, shared across all resources → Task 3
2. ✅ Date needed per resource when adding to existing NAF → Task 4
3. ✅ Display how long remaining (years/months/weeks/days) → Task 5, `getDateUrgency` utility
4. ✅ Highlight overdue with how long overdue → Task 5, red badge + red border on `AccordionItem`
5. ✅ Same for technical team → Task 6, `ImplementationResourceRequestRow`
6. ✅ Sort NAFs by nearing date → Task 6, `ImplementationNAFAccordion` sort; `ImplementationResourceAccordion` sort within groups
7. ✅ Highlight overdue in technical team view → Task 6, `border-red-300` on `AccordionItem`, `bg-red-50/40` on row

### Placeholder scan:

- All steps contain actual code.
- No "TBD", "TODO", or "similar to Task N" references.
- All file paths are exact.

### Type consistency:

- `BasicResourceWithDate` defined in `useAddResource.ts`, exported, imported in `addResourceDialog.tsx`.
- `dateNeeded: string` on all entry types (not `string | null` — empty string means unset, converted to `null` before sending to API).
- `request.dateNeeded` accessed as `string | undefined` everywhere, consistent with the type addition in Task 3 Step 1.
- `getDateUrgency` returns `UrgencyResult | null` — used with optional chaining `?.overdue` and `?.label` consistently throughout Tasks 5 and 6.
- `addBasicResourcesToNAF` in `resourceMetadataService.ts` changed to accept `{ id: number; dateNeeded: string }[]` — matches `BasicResourceWithDate` (same shape, named differently but both are inline-compatible).
