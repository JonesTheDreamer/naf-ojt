# Shared Resource Request List — Admin & Requestor/Approver

**Date:** 2026-05-06
**Feature:** Unify the resource request accordion between the admin NAF detail page and the requestor/approver NAF feature. Admin sees full request details but can only operate on FOR_SCREENING and IMPLEMENTATION state requests.

---

## Problem

`AdminResourceRequestList` and `ResourceRequestAccordionItem` are two parallel accordion implementations that share content block components but duplicate the accordion structure. The admin view shows a limited subset of request details (no purpose, no rejection reason, no implementation block). `ApprovalStepsBlock` lives in the admin feature but is already imported by the naf feature — a cross-feature dependency in the wrong direction.

---

## Goal

- Admin NAF detail page shows the same full request details as the requestor/approver view
- Admin can only act on requests in `FOR_SCREENING` state (claim, approve, reject) and `IMPLEMENTATION` state (accept, mark accomplished, mark delayed, back to in progress)
- All other states are read-only for admin
- `ResourceRequestAccordionItem` becomes the single accordion item used by both sides
- The naf→admin cross-import is eliminated

---

## Architecture

`ResourceRequestAccordionItem` is extended with optional handler props for admin-specific operations. The component renders only what it is given handlers for — no explicit `mode` flag. The requestor list continues to pass all existing handlers unchanged. The admin list passes only claim and implementation handlers.

Two supporting changes:
1. `ApprovalStepsBlock` moves from `AdminResourceRequestList` into `ResourceRequestContent` — it is a display component and should not live in the admin feature
2. A new `ImplementationActionsBlock` is extracted into the naf feature to encapsulate the four implementation action buttons and their internal delay modal state

`AdminResourceRequestList` is slimmed down to mutations + wiring, delegating all rendering to `ResourceRequestAccordionItem`.

---

## Component Changes

### 1. `ResourceRequestContent.tsx` — receive `ApprovalStepsBlock`

Move `ApprovalStepsBlock` out of `AdminResourceRequestList.tsx` and export it from `ResourceRequestContent.tsx`. Update the import in `ResourceRequestAccordionItem` (currently importing from admin) and in `AdminResourceRequestList`.

No logic changes to `ApprovalStepsBlock` itself.

---

### 2. `ImplementationActionsBlock` — new file

**Location:** `features/naf/components/resource-request/ImplementationActionsBlock.tsx`

Encapsulates the four implementation action buttons and the delay reason modal. Mirrors the button logic currently in `ImplementationResourceRequestItem`.

```ts
interface ImplementationActionsBlockProps {
  impl: ResourceRequest["implementation"];
  resourceRequestId: string;
  onAccept?: (resourceRequestId: string) => void;
  onSetToInProgress?: (implementationId: string) => void;
  onSetToDelayed?: (implementationId: string, reason: string) => void;
  onSetToAccomplished?: (implementationId: string) => void;
  isSubmitting?: boolean;
}
```

Button rendering by `impl.status`:
- `OPEN` → Accept
- `IN_PROGRESS` → Mark Accomplished, Mark Delayed
- `DELAYED` → Back to In Progress, Mark Accomplished
- `ACCOMPLISHED` → nothing

Owns `delayModalOpen` state internally. Uses `DelayedReasonModal` (see below).

`DelayedReasonModal` moves from `features/admin/components/` to `features/naf/components/`. `ImplementationResourceRequestItem` updates its import path. No logic changes to `DelayedReasonModal`.

---

### 3. `ResourceRequestAccordionItem` — extended props

**All existing handler and role props become optional** (currently required). Defaults: `isCurrentApprover = false`, `isRequestor = false`, `isApprover = false`. Handlers default to `undefined`.

New optional props added:

```ts
// FOR_SCREENING
onClaim?: (stepId: string) => void;
isClaiming?: boolean;

// IMPLEMENTATION
onAccept?: (resourceRequestId: string) => void;
onSetToInProgress?: (implementationId: string) => void;
onSetToDelayed?: (implementationId: string, reason: string) => void;
onSetToAccomplished?: (implementationId: string) => void;
isSubmittingImpl?: boolean;
```

**Rendering changes:**

**a. `ApprovalStepsBlock`** — forward `onClaim` and `isClaiming`. The claim button already gates on `onClaim` being provided, so no other change needed inside `ApprovalStepsBlock`.

**b. Approver actions gate** — add `FOR_SCREENING` to the allowed progress states so admin screeners can approve/reject at that state:

```ts
// before
progress === Progress.OPEN || progress === Progress.IN_PROGRESS

// after
progress === Progress.OPEN ||
progress === Progress.IN_PROGRESS ||
progress === Progress.FOR_SCREENING
```

**c. Requestor actions block** — add `onEdit` presence as an additional gate. This prevents admin (who provides no requestor handlers) from seeing edit/delete/resubmit buttons even when `isApprover` and `isCurrentApprover` are both false:

```ts
// before
{!isCurrentApprover && !isApprover && ( ... )}

// after
{!isCurrentApprover && !isApprover && onEdit && ( ... )}
```

**d. `ImplementationActionsBlock`** — render when any implementation handler is provided and `progress === IMPLEMENTATION`:

```tsx
{(onAccept || onSetToInProgress || onSetToDelayed || onSetToAccomplished) &&
  progress === Progress.IMPLEMENTATION && (
    <ImplementationActionsBlock
      impl={request.implementation}
      resourceRequestId={request.id}
      onAccept={onAccept}
      onSetToInProgress={onSetToInProgress}
      onSetToDelayed={onSetToDelayed}
      onSetToAccomplished={onSetToAccomplished}
      isSubmitting={isSubmittingImpl}
    />
  )}
```

The existing `ImplementationBlock` (read-only display) renders unconditionally when `progress === IMPLEMENTATION` as before — the actions block sits below it.

---

### 4. `AdminResourceRequestList` — slimmed down

**Remove:**
- Inline `AccordionItem` rendering for each request
- `approvingStepId` / `rejectingStepId` state
- List-level `ApproveDialog` / `RejectDialog`

**Keep:**
- `claimStep`, `approveRequest`, `rejectRequest` mutations

**Add:**
Four implementation mutations using the same API calls as `ForImplementationsPage`:
- `acceptImplementation`
- `setToInProgress`
- `setToDelayed`
- `setToAccomplished`

**Rendering:** Use `ResourceRequestAccordionItem` per request inside the existing `Accordion`:

```tsx
{naf.resourceRequests.map((req) => {
  const currentStep = req.steps.find(s => s.stepOrder === req.currentStep);
  const isCurrentApprover =
    currentStep?.approverId === currentUser &&
    currentStep?.approverId !== null;

  return (
    <ResourceRequestAccordionItem
      key={req.id}
      request={req}
      isCurrentApprover={isCurrentApprover}
      isApprover={isCurrentApprover}
      isRequestor={false}
      onClaim={(stepId) => claimStep.mutate(stepId)}
      isClaiming={claimStep.isPending}
      onApprove={(requestId, remarks) => {
        const step = req.steps.find(s => s.stepOrder === req.currentStep);
        if (step) approveRequest.mutate({ stepId: step.id, comment: remarks || undefined });
      }}
      onReject={(requestId, reason) => {
        const step = req.steps.find(s => s.stepOrder === req.currentStep);
        if (step) rejectRequest.mutate({ stepId: step.id, reasonForRejection: reason });
      }}
      onAccept={(resourceRequestId) => acceptImplementation.mutate(resourceRequestId)}
      onSetToInProgress={(implId) => setToInProgress.mutate(implId)}
      onSetToDelayed={(implId, reason) => setToDelayed.mutate({ implId, reason })}
      onSetToAccomplished={(implId) => setToAccomplished.mutate(implId)}
      isSubmittingImpl={
        acceptImplementation.isPending ||
        setToInProgress.isPending ||
        setToDelayed.isPending ||
        setToAccomplished.isPending
      }
    />
  );
})}
```

`ApprovalStepsBlock` export is removed from this file (moved to `ResourceRequestContent`).

---

## Data Flow

```
AdminNAFDetailPage
  └── AdminResourceRequestList (mutations only, no rendering logic)
        └── ResourceRequestAccordionItem × N
              ├── ApprovalStepsBlock (claim if onClaim provided)
              ├── PurposeBlock
              ├── HistoryTable
              ├── ImplementationBlock (read-only display)
              ├── ApproverActions (if isApprover && isCurrentApprover, for OPEN/IN_PROGRESS/FOR_SCREENING)
              └── ImplementationActionsBlock (if impl handlers provided && IMPLEMENTATION)
```

```
ViewNAFDetail (requestor/approver)
  └── ResourceRequestList (existing, unchanged interface)
        └── ResourceRequestAccordionItem × N
              └── (same structure, requestor handlers provided, no impl/claim handlers)
```

---

## Files Changed

| File | Change |
|------|--------|
| `features/naf/components/resource-request/ResourceRequestContent.tsx` | Add `ApprovalStepsBlock` (moved from admin) |
| `features/naf/components/resource-request/ImplementationActionsBlock.tsx` | **New** |
| `features/naf/components/DelayedReasonModal.tsx` | Moved from `features/admin/components/` |
| `features/naf/components/resource-request/ResourceRequestAccordionItem.tsx` | Extend props, fix gates, add impl block |
| `features/admin/components/AdminResourceRequestList.tsx` | Remove inline accordion, add impl mutations, use shared item |
| `features/admin/components/ImplementationResourceRequestItem.tsx` | Update `DelayedReasonModal` import path |

---

## What Does Not Change

- `ResourceRequestList` (requestor/approver wrapper) — passes the same props it always has; making them optional is backwards-compatible
- `AdminNAFDetailPage` — passes the same `naf` and `currentUser` props to `AdminResourceRequestList`
- All API calls, mutations, and query invalidation logic — unchanged
- `ImplementationResourceRequestItem` — still used in `ForImplementationsPage`, only its `DelayedReasonModal` import path changes
