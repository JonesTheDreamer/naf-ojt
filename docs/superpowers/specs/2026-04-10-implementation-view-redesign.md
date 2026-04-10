# Implementation View Redesign

**Date:** 2026-04-10
**Scope:** Backend query shape change + full frontend redesign for For Implementations and My Tasks pages

---

## Goals

1. `GetForImplementationsAsync` and `GetMyTasksAsync` return `List<NAFDTO>` instead of `List<ForImplementationItemDTO>`.
2. For Implementations page: two-mode accordion display (per NAF / per resource) with assign, assign-all, and more-info actions.
3. My Tasks page: same accordion display with mark-as-delayed and mark-as-accomplished actions.
4. Reusable components shared across both pages.

---

## Backend

### Repository — `IImplementationRepository`

**`GetForImplementationsAsync`**
- Return type: `Task<List<NAF>>`
- Query: `NAFs` where any `ResourceRequest.Progress == IMPLEMENTATION`
- Includes per NAF:
  - `ResourceRequests` filtered to `Progress == IMPLEMENTATION` only
  - Per resource request: `Resource`, `ResourceRequestPurposes`, `ResourceRequestsApprovalSteps` + `Histories`, `ResourceRequestImplementation`
  - `AdditionalInfo` (polymorphic): loaded via separate queries for `InternetRequestInfo`, `SharedFolderRequestInfo`, `GroupEmailRequestInfo` — same pattern as `NAFRepository.GetNAFToApprove`

**`GetMyTasksByEmployeeIdAsync`**
- Return type: `Task<List<NAF>>`
- Query: `NAFs` where any `ResourceRequest.ResourceRequestImplementation.EmployeeId == employeeId`
- Same includes as above

### Service — `IImplementationService`

```
Task<List<NAFDTO>> GetForImplementationsAsync();
Task<List<NAFDTO>> GetMyTasksAsync(string employeeId);
```

Both methods:
1. Call the updated repository method
2. Batch-fetch distinct `EmployeeId`s via `IEmployeeRepository`
3. Map each NAF to `NAFDTO` using `NAFMapper.ToDTO`

`IImplementationService` gains a new constructor dependency: `IEmployeeRepository`.

### Controller

`GetForImplementations` and `GetMyTasks` endpoints return `Ok(List<NAFDTO>)` — no route changes.

### No new DTOs or mappers — `NAFDTO` and `NAFMapper.ToDTO` are reused as-is.

---

## Frontend

### Service layer — `implementationService.ts`

Update return types:
- `getForImplementations`: returns `NAF[]` (existing `NAF` type from `types/api/naf.ts`)
- `getMyTasks`: returns `NAF[]`

`ForImplementationItemDTO` interface can be removed.

### Reusable components — `features/tech/components/`

All components live in `NAFClient/src/features/tech/components/`.

#### `ImplementationViewToggle`
Props: `value: "per-naf" | "per-resource"`, `onChange`
Renders a two-button toggle (e.g. segmented control using ShadCN `Tabs` or two `Button` variants).

#### `ResourceRequestInfoModal`
Props: `open`, `onOpenChange`, `request: ResourceRequest`
Displays:
1. **Latest purpose** — `purposes[purposes.length - 1].purpose`
2. **Approval step history** — table: Step N Approver | Action (status) | Comment | Date
3. **Purpose change history** — all entries in `purposes` sorted by `createdAt`, each labeled by whether it was an initial submission or a re-edit (identified by `resourceRequestApprovalStepHistoryId != null`)

#### `DelayedReasonModal`
Props: `open`, `onOpenChange`, `onConfirm: (reason: string) => void`, `isSubmitting`
A dialog with a required textarea for delay reason + Cancel/Confirm buttons.

#### `ImplementationResourceRequestRow`
Props:
- `request: ResourceRequest`
- `mode: "for-implementations" | "my-tasks"`
- `onAssign?: (requestId: string) => void`
- `onMarkDelayed?: (implementationId: string, reason: string) => void`
- `onMarkAccomplished?: (implementationId: string) => void`

Renders one resource request row showing:
- Resource name + icon
- Additional info summary (if `resource.isSpecial`)
- Implementation status badge
- Assigned-to label (or "Unassigned") — shown in `for-implementations` mode
- **"More Info"** button → opens `ResourceRequestInfoModal`
- **"Assign to Me"** button — shown in `for-implementations` mode when `implementation.employeeId` is null
- **"Mark as Delayed"** button — shown in `my-tasks` mode when status is not ACCOMPLISHED or DELAYED → opens `DelayedReasonModal`
- **"Mark as Accomplished"** button — shown in `my-tasks` mode when status is not ACCOMPLISHED

#### `ImplementationNAFAccordion`
Props:
- `nafs: NAF[]`
- `mode: "for-implementations" | "my-tasks"`
- `onAssign?: (requestId: string) => void`
- `onAssignAll?: (requestIds: string[]) => void`
- `onMarkDelayed?: (implementationId: string, reason: string) => void`
- `onMarkAccomplished?: (implementationId: string) => void`

Renders accordion grouped by NAF:
- Trigger: NAF reference + employee full name (`naf.employee.firstName + ' ' + naf.employee.lastName`)
- Content: list of `ImplementationResourceRequestRow` per resource request
- Last item: "Assign All to Me" button (for-implementations mode only) — fires `onAssignAll` with IDs of unassigned requests in this accordion

#### `ImplementationResourceAccordion`
Props: same as `ImplementationNAFAccordion`

Renders accordion grouped by resource:
- Derives unique resources from all NAFs' resource requests
- Trigger: resource name
- Content: resource requests sorted descending by `createdAt`, each row shows NAF reference + employee name as context
- Last item: "Assign All to Me" button (for-implementations mode only)

### Pages

#### `ForImplementationsPage`
- Uses `useForImplementations` (returns `NAF[]`)
- Local state: `viewMode`
- Renders `ImplementationViewToggle`
- Renders `ImplementationNAFAccordion` or `ImplementationResourceAccordion` based on `viewMode`
- `onAssign`: calls `assignToMeMutation.mutate(requestId)`
- `onAssignAll`: calls `assignToMeMutation.mutate` for each ID sequentially (or Promise.all)

#### `MyTasksPage`
- Uses `useMyTasks` (returns `NAF[]`)
- Local state: `viewMode`
- Renders `ImplementationViewToggle`
- Renders `ImplementationNAFAccordion` or `ImplementationResourceAccordion` in `my-tasks` mode
- `onMarkDelayed`: calls `setToDelayedMutation.mutate({ implementationId, reason })`
- `onMarkAccomplished`: calls `setToAccomplishedMutation.mutate(implementationId)`

### Hooks

`useForImplementations` and `useMyTasks` — query function return types updated to `NAF[]`. No structural changes to the hooks themselves.

---

## Component Responsibility Summary

| Component | Purpose |
|---|---|
| `ImplementationViewToggle` | Mode toggle UI |
| `ResourceRequestInfoModal` | Read-only detail modal (purposes + approval history) |
| `DelayedReasonModal` | Capture delay reason |
| `ImplementationResourceRequestRow` | Single resource request row, mode-aware |
| `ImplementationNAFAccordion` | Accordion grouped by NAF |
| `ImplementationResourceAccordion` | Accordion grouped by resource |

---

## What Is Not Changing

- `AssignToMeAsync`, `SetToDelayed`, `SetToAccomplished`, `SetToInProgress` service methods — unchanged
- All existing approval and NAF routes — unchanged
- `NAFDTO`, `NAFMapper`, `ResourceRequestDTO` — unchanged
- `ForImplementationItemDTO` — can be deleted once pages are migrated
