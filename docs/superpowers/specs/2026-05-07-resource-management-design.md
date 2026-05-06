# Resource Management — Design Spec
**Date:** 2026-05-07  
**Scope:** Admin-only feature for managing resources, approval workflow templates, and viewing employees per resource

---

## 1. Overview

A new admin section that allows administrators to:
- View all resources (active first, with toggle to show inactive)
- Create a new resource with an initial approval workflow template and steps
- View resource details: resource info, all workflow template versions with steps, and employees with an active/in-progress request for the resource grouped by physical location
- Deactivate a resource
- Add a new approval workflow template version to an existing resource
- Create new resource groups (accessible during resource creation)

---

## 2. Backend Architecture

### New Files

| File | Purpose |
|------|---------|
| `NAFServer/src/API/Controllers/AdminResourcesController.cs` | All admin resource management endpoints |
| `NAFServer/src/Application/Services/ResourceManagementService.cs` | Business logic for resource management |
| `NAFServer/src/Application/Interfaces/IResourceManagementService.cs` | Service contract |
| `NAFServer/src/Application/DTOs/ResourceManagement/` | New DTO shapes (see below) |

### Modified Files

| File | Change |
|------|--------|
| `NAFServer/src/API/Controllers/ResourceGroupsController.cs` | Add `POST /api/resource-groups` endpoint for creating new groups |
| `NAFServer/src/Application/Services/ResourceGroupService.cs` | Add `CreateAsync(string name, bool canOwnMany)` method |

### Endpoints

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/api/admin/resources` | Admin | All resources, active first |
| `GET` | `/api/admin/resources/{id}` | Admin | Resource detail with workflow versions, steps, and employees by location |
| `POST` | `/api/admin/resources` | Admin | Create resource + initial workflow template + steps |
| `PUT` | `/api/admin/resources/{id}/deactivate` | Admin | Deactivate a resource |
| `POST` | `/api/admin/resources/{id}/workflow-templates` | Admin | Add new template version (auto-deactivates current active) |
| `POST` | `/api/resource-groups` | Admin | Create a new resource group |

### DTOs

**`AdminResourceListItemDTO`**
```csharp
record AdminResourceListItemDTO(
    int Id,
    string Name,
    string? IconUrl,
    string Color,
    bool IsActive,
    bool IsSpecial,
    string? ResourceGroupName,
    int ActiveWorkflowTemplateVersion  // 0 if non-special
)
```

**`AdminResourceDetailDTO`**
```csharp
record AdminResourceDetailDTO(
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
)
```

**`WorkflowTemplateVersionDTO`**
```csharp
record WorkflowTemplateVersionDTO(
    Guid Id,
    int Version,
    bool IsActive,
    List<WorkflowStepDTO> Steps
)
```

**`WorkflowStepDTO`**
```csharp
record WorkflowStepDTO(
    int StepOrder,
    string StepAction,   // "APPROVER" | "FOR_SCREENING"
    string ApproverRole, // "SUPERVISOR" | "DEPARTMENT_HEAD" | "POSITION" | "TECHNICAL_HEAD"
    string ApproverEntity
)
```

**`EmployeesByLocationDTO`**
```csharp
record EmployeesByLocationDTO(
    int LocationId,
    string LocationName,
    List<EmployeeResourceRequestItemDTO> Employees
)
```

**`EmployeeResourceRequestItemDTO`**
```csharp
record EmployeeResourceRequestItemDTO(
    string EmployeeId,
    string EmployeeName,
    Guid NAFId,
    Guid ResourceRequestId,
    string Progress
)
```

**`CreateResourceDTO`**
```csharp
record CreateResourceDTO(
    string Name,
    string Color,
    bool IsSpecial,
    int? ResourceGroupId,
    List<CreateWorkflowStepDTO>? Steps  // required if IsSpecial = true
)
```

**`CreateWorkflowStepDTO`**
```csharp
record CreateWorkflowStepDTO(
    int StepOrder,
    string StepAction,
    string ApproverRole,
    string ApproverEntity
)
```

**`AddWorkflowTemplateDTO`**
```csharp
record AddWorkflowTemplateDTO(
    List<CreateWorkflowStepDTO> Steps
)
```

**`CreateResourceGroupDTO`**
```csharp
record CreateResourceGroupDTO(
    string Name,
    bool CanOwnMany
)
```

### Business Logic

**`POST /api/admin/resources`** runs in a single transaction:
1. Create and save `Resource` (IsActive = true, HasAdditionalInfo = false by default)
2. If `IsSpecial = true`: create `ApprovalWorkflowTemplate` (Version = 1, IsActive = true), then create `ApprovalWorkflowStepsTemplate` records in order
3. Return created resource ID

**`POST /api/admin/resources/{id}/workflow-templates`** runs in a single transaction:
1. Find current active `ApprovalWorkflowTemplate` for the resource → set `IsActive = false`
2. Create new `ApprovalWorkflowTemplate` (Version = previous max + 1, IsActive = true)
3. Create new `ApprovalWorkflowStepsTemplate` records

**`GET /api/admin/resources/{id}`** (detail):
1. Load resource with all `ApprovalWorkflowTemplate` versions, each with their `ApprovalWorkflowStepsTemplate` steps
2. Query `ResourceRequest` where `ResourceId = id` and `Progress` is one of: `OPEN`, `IN_PROGRESS`, `FOR_SCREENING`, `IMPLEMENTATION`
3. Include `NAF` → resolve employee details (employee number, name) from existing employee service/stored proc
4. Group results by `UserLocation` using the employee's location

**`PUT /api/admin/resources/{id}/deactivate`**:
1. Set `Resource.IsActive = false`
2. No changes to in-flight resource requests — they continue their current workflow

---

## 3. Frontend Architecture

### New Feature Module

```
NAFClient/src/features/resource-management/
  pages/
    ResourceListPage.tsx
    ResourceDetailPage.tsx
  components/
    ResourceCard.tsx
    AddResourceDialog.tsx
    AddWorkflowTemplateDialog.tsx
    WorkflowTemplateVersions.tsx
    EmployeesByLocation.tsx
    WorkflowStepBuilder.tsx       — reusable step builder used in both dialogs
    CreateResourceGroupDialog.tsx
  hooks/
    useResourceManagement.ts
  api.ts
```

### New Routes (added to admin router)

| Path | Component |
|------|-----------|
| `/admin/resources` | `ResourceListPage` |
| `/admin/resources/:resourceId` | `ResourceDetailPage` |

A "Resources" link is added to the admin sidebar navigation.

### ResourceListPage

- Page header: "Resources" title + "Add Resource" button (top-right)
- Toggle: "Show inactive resources" (checkbox/switch, default off)
- Active resources rendered first as cards; inactive cards appended below when toggle is on (greyed out style)
- Each `ResourceCard` shows: color chip, name, Special/Basic badge, resource group name, active workflow version (e.g., "v2")
- Clicking a card navigates to `/admin/resources/:id`

### ResourceDetailPage

- Back button → `/admin/resources`
- Header: color chip, resource name, Special/Basic badge, Active/Inactive status chip, "Deactivate" button (only shown when resource is active)
- **Workflow Templates section** (only rendered for special resources):
  - "Add New Template" button (top-right of section)
  - Accordion list of all versions; active version visually distinguished
  - Each accordion item shows a table of steps: Order | Action | Role | Entity
- **Employees with this Resource section**:
  - Collapsible groups by location name
  - Each row: employee name, progress badge, link that navigates to `/:employeeId/:nafId`
  - Shows "No active requests" if empty

### AddResourceDialog

- Fields:
  - Name (text input, required)
  - Color (color picker)
  - Resource Group (dropdown of existing groups + "Add other…" option at bottom)
    - Selecting "Add other…" opens `CreateResourceGroupDialog`
    - After creation, new group is auto-selected and list refreshes
  - Is Special (toggle, default off)
- If Is Special toggled on: `WorkflowStepBuilder` rendered inline
  - Ordered list of step rows: StepOrder (auto from position, read-only display) | StepAction (select) | ApproverRole (select) | ApproverEntity (text input)
  - "Add Step" button appends a new empty row
  - Remove button on each row (disabled if only 1 step remains)
- Submit disabled until: Name filled; if special, at least 1 step configured
- On success: invalidates resource list query, closes dialog

### AddWorkflowTemplateDialog

- Warning banner: "This will replace the current active template (v{n}) for this resource."
- `WorkflowStepBuilder` (same reusable component)
- Submit disabled until at least 1 step configured
- On success: invalidates resource detail query, closes dialog

### CreateResourceGroupDialog

- Fields: Group Name (text, required), Can Own Many (toggle)
- Small focused dialog (not full-screen)
- On success: new group returned and auto-selected in parent dropdown

### useResourceManagement.ts

```ts
// Queries
useAdminResources()          — GET /api/admin/resources
useAdminResourceDetail(id)   — GET /api/admin/resources/:id

// Mutations
useCreateResource()          — POST /api/admin/resources
useDeactivateResource()      — PUT /api/admin/resources/:id/deactivate
useAddWorkflowTemplate()     — POST /api/admin/resources/:id/workflow-templates
useCreateResourceGroup()     — POST /api/resource-groups
```

---

## 4. Data Flow — Employees by Location

1. Backend queries `ResourceRequest` (active/in-progress progress values) where `ResourceId = id`
2. Joins `NAF` to get `EmployeeId` (employee number)
3. Fetches employee details (name) via `CacheService` + employee stored procedures (existing pattern)
4. Joins `UserLocation` via the employee's location to get location name and ID
5. Groups results: `LocationId → LocationName → [ employees ]`
6. Frontend renders each location as a collapsible section with employee rows

---

## 5. Out of Scope

- Editing an existing resource's name/color/group (deactivate + create new is the intended path)
- Reactivating a deactivated resource
- Deleting resources or workflow templates
- Pagination on the employees list (assumed manageable size per resource)
