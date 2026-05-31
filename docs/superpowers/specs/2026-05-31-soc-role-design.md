# SOC Role Design

**Date:** 2026-05-31  
**Status:** Approved

## Overview

Add a Security Operations Center (SOC) role that reviews all internet resource URL requests before they reach admin screening. SOC users operate on a claim model — any SOC user can pick up an unclaimed SOC review step — and can either approve (pass to admin) or reject (stop the workflow).

---

## Workflow Change

The approval sequence for all special internet resources changes from 2 steps to 3:

| Step | Approver Role  | StepAction        | Assignment                        |
|------|---------------|-------------------|-----------------------------------|
| 1    | DEPARTMENT_HEAD | APPROVER         | Assigned at creation              |
| 2    | SOC           | FOR_SOC_REVIEW    | Unclaimed — any SOC user claims   |
| 3    | TECHNICAL_HEAD | FOR_SCREENING    | Unclaimed — any admin claims      |

Affected resources: `Special Internet Access`, `AI Internet Access`, `High Bandwidth Internet Access`, `Social Media Internet Access`.

All other special resources (Group Email, Shared Folder, M365 variants) are **unchanged**.

---

## Backend

### Enums

**`Domain/Enums/Roles.cs`** — add `SOC`:
```csharp
public enum Roles
{
    REQUESTOR_APPROVER,
    MANAGEMENT,
    ADMIN,
    HR,
    SOC,
}
```

**`Domain/Enums/StepAction.cs`** — add `FOR_SOC_REVIEW`:
```csharp
public enum StepAction
{
    APPROVER,
    FOR_SCREENING,
    FOR_SOC_REVIEW,
}
```

### Domain

**`ResourceRequestApprovalStep.ClaimStep()`** — update guard to allow both claim-based step types:
```csharp
if (StepAction != StepAction.FOR_SCREENING && StepAction != StepAction.FOR_SOC_REVIEW)
    throw new DomainException("Only FOR_SCREENING or FOR_SOC_REVIEW steps can be claimed");
```

### Controller

Add a dedicated SOC claim endpoint in `ApprovalStepsController`:
```csharp
[HttpPost("{id}/claim-soc")]
[Authorize(Roles = nameof(Roles.SOC))]
public async Task<IActionResult> ClaimSoc(Guid id)
```

Existing `POST /{id}/claim` remains unchanged (`[Authorize(Roles = nameof(Roles.ADMIN))]`).

Approve and reject endpoints (`PUT /{id}/approve`, `PUT /{id}/reject`) are shared — no changes needed.

### Service — `FetchApproversAsync`

`FOR_SOC_REVIEW` is handled identically to `FOR_SCREENING`: creates an unclaimed step with `ApproverId = null`.

```csharp
if (step.StepAction == StepAction.FOR_SCREENING || step.StepAction == StepAction.FOR_SOC_REVIEW)
{
    approvers.Add(new ResourceRequestApprovalStep(
        request.Id, null, step.StepOrder, step.StepAction));
    continue;
}
```

### Seeders

**`ResourceWorkflowSeeder`** — for internet resources, insert SOC step at order 2 and shift Technical Head to order 3:
```csharp
var internetResources = new List<Resource> { aiSpecialInternet, hbSpecialInternet, ssSpecialInternet, specialInternet };

foreach (var t in workflowTemplates)
{
    // Step 1: dept head
    workflowStepsTemplates.Add(new ApprovalWorkflowStepsTemplate(t.Id, 1, StepAction.APPROVER, ApproverRole.DEPARTMENT_HEAD, null));

    if (internetResources.Contains(t.Resource))
    {
        // Step 2: SOC review (claim-based)
        workflowStepsTemplates.Add(new ApprovalWorkflowStepsTemplate(t.Id, 2, StepAction.FOR_SOC_REVIEW, ApproverRole.ROLE_BASED, nameof(Roles.SOC)));
        // Step 3: admin screening
        workflowStepsTemplates.Add(new ApprovalWorkflowStepsTemplate(t.Id, 3, StepAction.FOR_SCREENING, ApproverRole.TECHNICAL_HEAD, null));
    }
    else if (t.Resource.Name == "Shared Folder")
    {
        workflowStepsTemplates.Add(new ApprovalWorkflowStepsTemplate(t.Id, 2, StepAction.APPROVER, ApproverRole.RESOURCE_OWNER, null));
    }
    else
    {
        workflowStepsTemplates.Add(new ApprovalWorkflowStepsTemplate(t.Id, 2, StepAction.FOR_SCREENING, ApproverRole.TECHNICAL_HEAD, null));
    }
}
```

**`UserSeeder`** — seed `SOC` role into the `Roles` table alongside existing roles.

### Migration

One EF migration: no schema column changes (StepAction stored as int, new value is additive). Migration adds the `SOC` role row and the new workflow step rows for internet resources.

---

## Frontend

### Enum

**`types/enum/stepAction.ts`** — add `FOR_SOC_REVIEW`.

### API Service

**`services/EntityAPI/resourceRequestService.ts`** — add:
```ts
claimSocStep: (stepId: string) =>
  api.post(`/approvalsteps/${stepId}/claim-soc`)
```

### SOC Queue Page

A new page for SOC users listing all unclaimed `FOR_SOC_REVIEW` steps they can claim. SOC is not location-scoped (unlike Technical Head), so the queue shows steps across all locations.

Route: `/soc/queue`, accessible only to users with `SOC` role.

### NAF Detail View

The existing approval step display renders each step by `StepAction`. The `FOR_SOC_REVIEW` step will display with a "Claim (SOC Review)" action button, matching the style of the existing `FOR_SCREENING` claim UI.

### Approve / Reject

SOC uses the existing `PUT /approvalsteps/{id}/approve` and `/reject` endpoints. The approve/reject UI on a claimed step works as-is — no frontend changes needed for these actions.

---

## Out of Scope

- Basic internet access (non-special) — no workflow, no SOC step
- Existing approved/in-progress resource requests — not retroactively affected
- SOC dashboard analytics or reporting
