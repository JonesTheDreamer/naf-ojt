# Resource Requests — Action Sections Design

**Date:** 2026-05-14  
**Feature:** Add For Screening and For Implementation action sections to the Admin Resource Requests page  
**Status:** Approved

---

## Overview

The `AdminResourceRequestsPage` currently shows a filterable, paginated table of resource requests with no inline actions — clicking a row navigates to the NAF detail page. This design adds two action-oriented sections above the existing table so admins can claim screening steps and manage implementation tasks without leaving the page.

---

## Page Structure

Three stacked areas in order:

```
┌─ For Screening ──────────────────────────────────────────┐
│  ┌─ Unassigned ──────────────────────────────────────┐   │
│  │  Cards with Claim button                          │   │
│  └───────────────────────────────────────────────────┘   │
│  ┌─ My Tasks ────────────────────────────────────────┐   │
│  │  Cards with View NAF button                       │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘

┌─ For Implementation ─────────────────────────────────────┐
│  ┌─ Unassigned ──────────────────────────────────────┐   │
│  │  Cards with Claim button                          │   │
│  └───────────────────────────────────────────────────┘   │
│  ┌─ My Tasks ────────────────────────────────────────┐   │
│  │  Cards with status badge + action buttons         │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘

┌─ All Resource Requests ──────────────────────────────────┐
│  Status tabs + paginated table (unchanged)               │
└──────────────────────────────────────────────────────────┘
```

- Each section heading shows a live count: **"For Screening · 3"**
- Empty sub-sections show a compact empty state (not hidden) so the admin can see the section is up to date
- Both sections are filtered by the admin's `locationId` (same as the existing table)

---

## Section 1 — For Screening

### Data Source

New backend endpoint:

```
GET /api/admin/resource-requests/for-screening?locationId={id}
```

Returns a list (not paginated — screening queues are typically short) of `AdminForScreeningItemDTO`:

```csharp
public record AdminForScreeningItemDTO(
    Guid ResourceRequestId,
    Guid NafId,
    string NafReference,
    string EmployeeName,
    string ResourceName,
    DateTime? DateNeeded,
    Guid CurrentStepId,       // the ApprovalWorkflowStepsTemplate step to claim
    string? StepClaimedBy     // employeeId of claimant, null if unclaimed
);
```

Query logic: resource requests where `Progress == FOR_SCREENING` and `LocationId == locationId`. For each, include the current `ResourceRequestApprovalStep` (the one matching `currentStep` order) to get `Id` (stepId) and `ApproverId` (claimedBy).

### Client-Side Split

The frontend receives one list and splits it:
- **Unassigned:** `stepClaimedBy == null`
- **My Tasks:** `stepClaimedBy == currentUser.employeeId`

### Card Fields

| Field | Both sub-sections |
|-------|-------------------|
| Employee name | ✓ |
| Resource name | ✓ |
| NAF reference | ✓ |
| Date needed | ✓ |

### Actions

**Unassigned card:**
- **"Claim"** button → calls existing `claimScreeningStep(stepId)` → invalidates the for-screening query → item appears in My Tasks

**My Tasks card:**
- **"View NAF"** button → navigates to `/admin/NAF/:nafId`
- No approve/reject actions on this page; those live on the NAF detail page where full request context is available

---

## Section 2 — For Implementation

### Data Source

Existing endpoints — no new endpoints needed:

- `GET /implementations/for-implementations?locationId={id}` — all IMPLEMENTATION-progress requests at this location
- `GET /implementations/my-tasks` — requests assigned to the current admin

`ForImplementationItemDTO` needs two new fields added:

```csharp
public record ForImplementationItemDTO(
    Guid Id,
    Guid NAFId,
    string NafReference,      // NEW
    string EmployeeName,      // NEW
    string Progress,
    string ResourceName,
    Guid? ImplementationId,
    ImplementationStatus? ImplementationStatus,
    string? AssignedTo
);
```

### Client-Side Split

- **Unassigned sub-section:** uses `for-implementations` response filtered to `assignedTo == null`
- **My Tasks sub-section:** uses `my-tasks` response exclusively (already scoped to current user; avoids any duplication with the location list)

### Card Fields

| Field | Unassigned | My Tasks |
|-------|------------|----------|
| Employee name | ✓ | ✓ |
| Resource name | ✓ | ✓ |
| NAF reference | ✓ | ✓ |
| Implementation status badge | — | ✓ |

### Actions

**Unassigned card:**
- **"Claim"** button → `POST /implementations/resource-requests/{id}/assign` → invalidates both queries

**My Tasks card — based on `ImplementationStatus`:**

| Status | Buttons |
|--------|---------|
| `IN_PROGRESS` | "Mark Accomplished" · "Mark Delayed" |
| `DELAYED` | "Back to In Progress" · "Mark Accomplished" |
| `ACCOMPLISHED` | _(none — item will disappear from list)_ |

All mutation endpoints already exist in `ImplementationController`.

---

## Frontend Components

### New Components (`features/admin/components/`)

**`ActionCard.tsx`** — shared card shell used by both sections  
Props: `employeeName`, `resourceName`, `nafReference`, `dateNeeded?`, `badge?` (ReactNode), `actions` (ReactNode)  
Renders a bordered card row with info on the left and actions on the right.

**`ForScreeningSection.tsx`**  
- Fetches via `useForScreening(locationId)`  
- Splits result into unassigned / mine using `currentUser.employeeId`  
- Owns the claim mutation  
- Renders two `ActionCard` lists with "Unassigned" and "My Tasks" sub-headings

**`ForImplementationSection.tsx`**  
- Fetches via `useForImplementation(locationId)` and `useMyImplementationTasks()`  
- Splits for-implementations into unassigned / mine; merges with my-tasks  
- Owns assignToMe, setToInProgress, setToDelayed, setToAccomplished mutations  
- Renders two `ActionCard` lists

### New Hooks (`features/admin/hooks/`)

**`useForScreening(locationId)`**  
Query key: `["admin", "for-screening", locationId]`  
Fetches `GET /admin/resource-requests/for-screening?locationId={id}`  
`keepPreviousData: true`

**`useForImplementation(locationId)`**  
Query key: `["admin", "for-implementation", locationId]`  
Fetches `GET /implementations/for-implementations?locationId={id}`  
`keepPreviousData: true`

**`useMyImplementationTasks()`**  
Query key: `["admin", "my-implementation-tasks"]`  
Fetches `GET /implementations/my-tasks`  
`keepPreviousData: true`

### Changes to Existing Files

| File | Change |
|------|--------|
| `AdminResourceRequestsPage.tsx` | Mount `ForScreeningSection` and `ForImplementationSection` above the existing table; pass `locationId` and `currentUser.employeeId` |
| `admin/api.ts` | Add `getForScreening(locationId)` call; update `ForImplementationItemDTO` response type |

---

## Backend Changes

| File | Change |
|------|--------|
| `AdminController.cs` | Add `GET /admin/resource-requests/for-screening` endpoint |
| `INAFService.cs` | Add `GetForScreeningAsync(int locationId)` |
| `NAFService.cs` | Implement `GetForScreeningAsync` |
| `INAFRepository.cs` | Add `GetForScreeningAsync(int locationId)` |
| `NAFRepository.cs` | Implement query: FOR_SCREENING progress at location, include current approval step |
| `AdminForScreeningItemDTO.cs` | New DTO |
| `ForImplementationItemDTO.cs` | Add `NafReference` and `EmployeeName` fields |
| `ImplementationService.cs` / `ImplementationRepository.cs` | Populate the two new fields when building the DTO |

---

## What Does Not Change

- The existing paginated table and its status tabs
- The NAF detail page (`AdminNAFDetailPage`, `AdminResourceRequestList`)
- All existing mutation endpoints (`claimScreeningStep`, `assignToMe`, status transitions)
- Authorization — all endpoints already require `ADMIN` role
