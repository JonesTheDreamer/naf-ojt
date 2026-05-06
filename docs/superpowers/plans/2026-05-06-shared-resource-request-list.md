# Shared Resource Request List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the resource request accordion so `ResourceRequestAccordionItem` is used by both the requestor/approver NAF view and the admin NAF detail page, giving admin a full read-only view with actions only for FOR_SCREENING and IMPLEMENTATION states.

**Architecture:** All handler props on `ResourceRequestAccordionItem` become optional; the component renders only what it receives handlers for. `ApprovalStepsBlock` moves from the admin feature into `ResourceRequestContent` (fixing a cross-feature import). A new `ImplementationActionsBlock` encapsulates the four implementation buttons. `AdminResourceRequestList` is reduced to mutations + wiring.

**Tech Stack:** React 19, TypeScript, TanStack Query v5, shadcn/ui, Tailwind CSS v4

---

## File Map

| File | Action |
|------|--------|
| `NAFClient/src/features/naf/components/resource-request/ResourceRequestContent.tsx` | Add `ApprovalStepsBlock` (moved from admin) |
| `NAFClient/src/features/naf/components/DelayedReasonModal.tsx` | **New** — moved from admin feature |
| `NAFClient/src/features/naf/components/resource-request/ImplementationActionsBlock.tsx` | **New** |
| `NAFClient/src/features/naf/components/resource-request/ResourceRequestAccordionItem.tsx` | Extend props, fix imports, update render gates |
| `NAFClient/src/features/admin/components/AdminResourceRequestList.tsx` | Replace inline accordion with shared item, add impl mutations |
| `NAFClient/src/features/admin/components/ImplementationResourceRequestItem.tsx` | Update `DelayedReasonModal` import path |
| `NAFClient/src/features/admin/components/DelayedReasonModal.tsx` | **Delete** after move |

---

## Task 1: Move `ApprovalStepsBlock` into `ResourceRequestContent`

**Files:**
- Modify: `NAFClient/src/features/naf/components/resource-request/ResourceRequestContent.tsx`
- Modify: `NAFClient/src/features/admin/components/AdminResourceRequestList.tsx`
- Modify: `NAFClient/src/features/naf/components/resource-request/ResourceRequestAccordionItem.tsx`

- [ ] **Step 1: Add missing imports to `ResourceRequestContent.tsx`**

Open `NAFClient/src/features/naf/components/resource-request/ResourceRequestContent.tsx`.

Replace the lucide-react import line:
```tsx
import { Clock } from "lucide-react";
```
with:
```tsx
import { Clock, CheckCircle2, XCircle, Clock3, UserCheck } from "lucide-react";
```

Replace the status import line:
```tsx
import { ImplementationStatus } from "@/shared/types/enum/status";
```
with:
```tsx
import { ImplementationStatus, Status } from "@/shared/types/enum/status";
```

Add a new import after the existing imports:
```tsx
import { StepAction } from "@/shared/types/enum/stepAction";
```

- [ ] **Step 2: Append `ApprovalStepsBlock` to `ResourceRequestContent.tsx`**

Add the following before the final `export { ResourceIcon };` line at the bottom of `ResourceRequestContent.tsx`:

```tsx
const STEP_ACTION_LABEL: Record<StepAction, string> = {
  [StepAction.APPROVER]: "Approval",
  [StepAction.FOR_SCREENING]: "Screening",
};

interface ApprovalStepsBlockProps {
  request: ResourceRequest;
  currentStepOrder?: number;
  onClaim?: (stepId: string) => void;
  isClaiming?: boolean;
}

export function ApprovalStepsBlock({
  request,
  currentStepOrder,
  onClaim,
  isClaiming,
}: ApprovalStepsBlockProps) {
  if (!request.steps || request.steps.length === 0) return null;
  const sorted = [...request.steps].sort((a, b) => a.stepOrder - b.stepOrder);
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Approval Steps
      </p>
      <div className="space-y-2">
        {sorted.map((step) => {
          const lastHistory = [...step.histories].sort(
            (a, b) =>
              new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime(),
          )[0];
          const isApproved = lastHistory?.status === Status.APPROVED;
          const isRejected = lastHistory?.status === Status.REJECTED;
          const isPending = !lastHistory;
          const statusLabel = isApproved
            ? "Approved"
            : isRejected
              ? "Rejected"
              : "Pending";
          const actionLabel =
            STEP_ACTION_LABEL[step.stepAction as StepAction] ?? "Approval";

          const isUnclaimedScreening =
            currentStepOrder !== undefined &&
            step.stepAction === StepAction.FOR_SCREENING &&
            step.approverId === null &&
            step.stepOrder === currentStepOrder &&
            isPending;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 rounded-md border px-3 py-2 text-sm",
                isApproved && "bg-emerald-50 border-emerald-100",
                isRejected && "bg-red-50 border-red-100",
                isPending && "bg-muted/30 border-border",
                isUnclaimedScreening && "border-amber-200 bg-amber-50/60",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  isApproved
                    ? "bg-emerald-100 text-emerald-700"
                    : isRejected
                      ? "bg-red-100 text-red-600"
                      : isUnclaimedScreening
                        ? "bg-amber-100 text-amber-700"
                        : "bg-muted text-muted-foreground",
                )}
              >
                {step.stepOrder}
              </span>
              <div className="flex-1 min-w-0">
                <p className={cn("font-medium truncate", isUnclaimedScreening ? "text-amber-700" : "text-foreground")}>
                  {step.approverName ?? step.approverId ?? "—"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isUnclaimedScreening ? `${actionLabel} · Awaiting claim` : actionLabel}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isUnclaimedScreening && onClaim ? (
                  <button
                    onClick={() => onClaim(step.id)}
                    disabled={isClaiming}
                    className="inline-flex items-center gap-1 rounded-md bg-amber-500 hover:bg-amber-600 disabled:opacity-50 px-2.5 py-1 text-xs font-semibold text-white transition-colors"
                  >
                    <UserCheck className="h-3 w-3" />
                    {isClaiming ? "Claiming…" : "Claim"}
                  </button>
                ) : (
                  <>
                    {isApproved && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                    {isRejected && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                    {isPending && !isUnclaimedScreening && (
                      <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        isApproved
                          ? "text-emerald-600"
                          : isRejected
                            ? "text-red-500"
                            : "text-muted-foreground",
                      )}
                    >
                      {statusLabel}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `AdminResourceRequestList.tsx` — swap `ApprovalStepsBlock` source**

In `NAFClient/src/features/admin/components/AdminResourceRequestList.tsx`:

Remove these imports (they are only needed by `ApprovalStepsBlock`):
```tsx
import { CheckCircle2, XCircle, Clock3, UserCheck } from "lucide-react";
import { StepAction } from "@/shared/types/enum/stepAction";
```

Also remove from the lucide-react import line whichever of those icons appear there (keep the rest).

Add this import:
```tsx
import { ApprovalStepsBlock } from "@/features/naf/components/resource-request/ResourceRequestContent";
```

Delete the entire `STEP_ACTION_LABEL` constant, the `ApprovalStepsBlockProps` interface, the `ApprovalStepsBlock` function, and the `export { ApprovalStepsBlock };` line from this file — they now live in `ResourceRequestContent`.

- [ ] **Step 4: Update `ResourceRequestAccordionItem.tsx` — fix `ApprovalStepsBlock` import**

In `NAFClient/src/features/naf/components/resource-request/ResourceRequestAccordionItem.tsx`:

Replace:
```tsx
import { ApprovalStepsBlock } from "@/features/admin/components/AdminResourceRequestList";
```
with:
```tsx
import { ApprovalStepsBlock } from "./ResourceRequestContent";
```

Also update the call site. Find:
```tsx
{request.steps.length > 0 && <ApprovalStepsBlock request={request} />}
```
Replace with:
```tsx
{request.steps.length > 0 && (
  <ApprovalStepsBlock
    request={request}
    currentStepOrder={request.currentStep}
  />
)}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run from `NAFClient/`:
```bash
npm run build
```
Expected: no TypeScript errors related to `ApprovalStepsBlock`. Fix any import errors before continuing.

- [ ] **Step 6: Commit**

```bash
git add NAFClient/src/features/naf/components/resource-request/ResourceRequestContent.tsx
git add NAFClient/src/features/admin/components/AdminResourceRequestList.tsx
git add NAFClient/src/features/naf/components/resource-request/ResourceRequestAccordionItem.tsx
git commit -m "refactor: move ApprovalStepsBlock from admin to ResourceRequestContent"
```

---

## Task 2: Move `DelayedReasonModal` to the naf feature

**Files:**
- Create: `NAFClient/src/features/naf/components/DelayedReasonModal.tsx`
- Modify: `NAFClient/src/features/admin/components/ImplementationResourceRequestItem.tsx`
- Delete: `NAFClient/src/features/admin/components/DelayedReasonModal.tsx`

- [ ] **Step 1: Create `DelayedReasonModal.tsx` in naf components**

Create `NAFClient/src/features/naf/components/DelayedReasonModal.tsx` with this exact content:

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
import { cn } from "@/shared/utils/utils";

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

- [ ] **Step 2: Update `ImplementationResourceRequestItem.tsx` import path**

In `NAFClient/src/features/admin/components/ImplementationResourceRequestItem.tsx`:

Replace:
```tsx
import { DelayedReasonModal } from "./DelayedReasonModal";
```
with:
```tsx
import { DelayedReasonModal } from "@/features/naf/components/DelayedReasonModal";
```

- [ ] **Step 3: Delete old `DelayedReasonModal.tsx`**

Delete `NAFClient/src/features/admin/components/DelayedReasonModal.tsx`.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run build
```
Expected: no errors. `ImplementationResourceRequestItem` should still work.

- [ ] **Step 5: Commit**

```bash
git add NAFClient/src/features/naf/components/DelayedReasonModal.tsx
git add NAFClient/src/features/admin/components/ImplementationResourceRequestItem.tsx
git add NAFClient/src/features/admin/components/DelayedReasonModal.tsx
git commit -m "refactor: move DelayedReasonModal from admin to naf feature"
```

---

## Task 3: Create `ImplementationActionsBlock`

**Files:**
- Create: `NAFClient/src/features/naf/components/resource-request/ImplementationActionsBlock.tsx`

- [ ] **Step 1: Create the file**

Create `NAFClient/src/features/naf/components/resource-request/ImplementationActionsBlock.tsx`:

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImplementationStatus } from "@/shared/types/enum/status";
import type { ResourceRequest } from "@/shared/types/api/naf";
import { DelayedReasonModal } from "@/features/naf/components/DelayedReasonModal";

interface ImplementationActionsBlockProps {
  impl: ResourceRequest["implementation"];
  resourceRequestId: string;
  onAccept?: (resourceRequestId: string) => void;
  onSetToInProgress?: (implementationId: string) => void;
  onSetToDelayed?: (implementationId: string, reason: string) => void;
  onSetToAccomplished?: (implementationId: string) => void;
  isSubmitting?: boolean;
}

export function ImplementationActionsBlock({
  impl,
  resourceRequestId,
  onAccept,
  onSetToInProgress,
  onSetToDelayed,
  onSetToAccomplished,
  isSubmitting,
}: ImplementationActionsBlockProps) {
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const status = impl?.status ?? ImplementationStatus.OPEN;

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-4">
        {status === ImplementationStatus.OPEN && onAccept && (
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white"
            disabled={isSubmitting}
            onClick={() => onAccept(resourceRequestId)}
          >
            Accept
          </Button>
        )}

        {status === ImplementationStatus.IN_PROGRESS && (
          <>
            {onSetToAccomplished && (
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                disabled={isSubmitting}
                onClick={() => onSetToAccomplished(impl!.id)}
              >
                Mark Accomplished
              </Button>
            )}
            {onSetToDelayed && (
              <Button
                size="sm"
                variant="outline"
                className="border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                disabled={isSubmitting}
                onClick={() => setDelayModalOpen(true)}
              >
                Mark Delayed
              </Button>
            )}
          </>
        )}

        {status === ImplementationStatus.DELAYED && (
          <>
            {onSetToInProgress && (
              <Button
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white"
                disabled={isSubmitting}
                onClick={() => onSetToInProgress(impl!.id)}
              >
                Back to In Progress
              </Button>
            )}
            {onSetToAccomplished && (
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                disabled={isSubmitting}
                onClick={() => onSetToAccomplished(impl!.id)}
              >
                Mark Accomplished
              </Button>
            )}
          </>
        )}
      </div>

      {onSetToDelayed && (
        <DelayedReasonModal
          open={delayModalOpen}
          onOpenChange={setDelayModalOpen}
          onConfirm={(reason) => {
            onSetToDelayed(impl!.id, reason);
            setDelayModalOpen(false);
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
npm run build
```
Expected: no errors on the new file.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/naf/components/resource-request/ImplementationActionsBlock.tsx
git commit -m "feat: add ImplementationActionsBlock for shared impl actions"
```

---

## Task 4: Extend `ResourceRequestAccordionItem` props and render

**Files:**
- Modify: `NAFClient/src/features/naf/components/resource-request/ResourceRequestAccordionItem.tsx`

- [ ] **Step 1: Add `ImplementationActionsBlock` import**

At the top of `ResourceRequestAccordionItem.tsx`, add:
```tsx
import { ImplementationActionsBlock } from "./ImplementationActionsBlock";
```

- [ ] **Step 2: Replace the props interface**

Replace the entire `ResourceRequestAccordionItemProps` interface with:

```tsx
interface ResourceRequestAccordionItemProps {
  request: ResourceRequest;
  isCurrentApprover?: boolean;
  isRequestor?: boolean;
  isApprover?: boolean;
  isSubmitting?: boolean;
  resourceGroup?: ResourceGroup;
  groupResources?: Resource[];
  onEdit?: (requestId: string, nafId: string, purpose: PurposeProps) => void;
  onDelete?: (requestId: string) => void;
  onRemind?: (requestId: string) => void;
  onDeactivate?: (requestId: string) => void;
  onResubmit?: (requestId: string, nafId: string, purpose: PurposeProps) => void;
  onCancel?: (requestId: string) => void;
  onChangeResource?: (requestId: string, newResourceId: number) => void;
  onApprove?: (requestId: string, remarks: string) => void;
  onReject?: (requestId: string, reasonForRejection: string) => void;
  // FOR_SCREENING (admin)
  onClaim?: (stepId: string) => void;
  isClaiming?: boolean;
  // IMPLEMENTATION (admin)
  onAccept?: (resourceRequestId: string) => void;
  onSetToInProgress?: (implementationId: string) => void;
  onSetToDelayed?: (implementationId: string, reason: string) => void;
  onSetToAccomplished?: (implementationId: string) => void;
  isSubmittingImpl?: boolean;
}
```

- [ ] **Step 3: Update function signature defaults**

Replace the function signature opening:
```tsx
export function ResourceRequestAccordionItem({
  request,
  isCurrentApprover = false,
  isApprover,
  isRequestor,
  isSubmitting,
  resourceGroup,
  groupResources = [],
  onEdit,
  onDelete,
  onRemind,
  onDeactivate,
  onResubmit,
  onCancel,
  onChangeResource,
  onApprove,
  onReject,
}: ResourceRequestAccordionItemProps) {
```
with:
```tsx
export function ResourceRequestAccordionItem({
  request,
  isCurrentApprover = false,
  isApprover = false,
  isRequestor = false,
  isSubmitting,
  resourceGroup,
  groupResources = [],
  onEdit,
  onDelete,
  onRemind,
  onDeactivate,
  onResubmit,
  onCancel,
  onChangeResource,
  onApprove,
  onReject,
  onClaim,
  isClaiming,
  onAccept,
  onSetToInProgress,
  onSetToDelayed,
  onSetToAccomplished,
  isSubmittingImpl,
}: ResourceRequestAccordionItemProps) {
```

- [ ] **Step 4: Forward `onClaim`/`isClaiming` to `ApprovalStepsBlock`**

Find the existing call:
```tsx
{request.steps.length > 0 && (
  <ApprovalStepsBlock
    request={request}
    currentStepOrder={request.currentStep}
  />
)}
```
Replace with:
```tsx
{request.steps.length > 0 && (
  <ApprovalStepsBlock
    request={request}
    currentStepOrder={request.currentStep}
    onClaim={onClaim}
    isClaiming={isClaiming}
  />
)}
```

- [ ] **Step 5: Add `FOR_SCREENING` to the approver actions gate**

Find:
```tsx
{(progress === Progress.OPEN ||
  progress === Progress.IN_PROGRESS) && (
  <ApproverActions
    onApprove={() => setApproveDialogOpen(true)}
    onReject={() => setRejectDialogOpen(true)}
  />
)}
```
Replace with:
```tsx
{(progress === Progress.OPEN ||
  progress === Progress.IN_PROGRESS ||
  progress === Progress.FOR_SCREENING) && (
  <ApproverActions
    onApprove={() => setApproveDialogOpen(true)}
    onReject={() => setRejectDialogOpen(true)}
  />
)}
```

- [ ] **Step 6: Gate requestor actions on `onEdit` presence**

Find:
```tsx
{!isCurrentApprover && !isApprover && (
```
Replace with:
```tsx
{!isCurrentApprover && !isApprover && onEdit && (
```

- [ ] **Step 7: Add `ImplementationActionsBlock` below `ImplementationBlock`**

Find the block that renders `ImplementationBlock`:
```tsx
{progress === Progress.IMPLEMENTATION && (
  <ImplementationBlock impl={request.implementation} />
)}
```
Replace with:
```tsx
{progress === Progress.IMPLEMENTATION && (
  <ImplementationBlock impl={request.implementation} />
)}
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

- [ ] **Step 8: Add optional chaining to handler calls inside dialog callbacks**

Dialogs inside the component call handlers directly (e.g. `onEdit(request.id, ...)`). TypeScript will now flag these as possibly undefined. Update each dialog callback to use optional chaining:

Find and replace each of the following:

```tsx
// EditPurposeDialog onSubmit
onEdit(request.id, request.nafId, purpose);
// → replace with:
onEdit?.(request.id, request.nafId, purpose);

// DeleteConfirmDialog onConfirm
onDelete(request.id);
// → replace with:
onDelete?.(request.id);

// ResubmitDialog onSubmit
onResubmit(request.id, request.nafId, { ...purpose });
// → replace with:
onResubmit?.(request.id, request.nafId, { ...purpose });

// ApproveDialog onConfirm
onApprove(request.id, remarks);
// → replace with:
onApprove?.(request.id, remarks);

// RejectDialog onConfirm
onReject(request.id, reason);
// → replace with:
onReject?.(request.id, reason);

// ChangeResourceDialog onConfirm
onChangeResource(request.id, newResourceId);
// → replace with:
onChangeResource?.(request.id, newResourceId);
```

- [ ] **Step 9: Verify TypeScript compiles**

```bash
npm run build
```
Expected: no errors. `ResourceRequestList.tsx` (requestor wrapper) should still compile without changes since all props it passes are still accepted.

- [ ] **Step 10: Commit**

```bash
git add NAFClient/src/features/naf/components/resource-request/ResourceRequestAccordionItem.tsx
git commit -m "feat: extend ResourceRequestAccordionItem with optional admin props"
```

---

## Task 5: Rebuild `AdminResourceRequestList`

**Files:**
- Modify: `NAFClient/src/features/admin/components/AdminResourceRequestList.tsx`

- [ ] **Step 1: Replace the entire file contents**

Replace `NAFClient/src/features/admin/components/AdminResourceRequestList.tsx` with:

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Accordion } from "@/components/ui/accordion";
import type { NAF } from "@/shared/types/api/naf";
import { ResourceRequestAccordionItem } from "@/features/naf/components/resource-request";
import { adminApi } from "../api";
import {
  approveResourceRequest,
  rejectResourceRequest,
  claimScreeningStep,
} from "@/features/naf/api";

function extractErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object" && "error" in data)
    return String((data as { error: unknown }).error);
  return fallback;
}

interface AdminResourceRequestListProps {
  naf: NAF;
  currentUser: string;
}

export function AdminResourceRequestList({
  naf,
  currentUser,
}: AdminResourceRequestListProps) {
  const queryClient = useQueryClient();
  const nafQueryKey = ["naf", naf.id];

  const claimStep = useMutation({
    mutationFn: (stepId: string) => claimScreeningStep(stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nafQueryKey });
      toast.success("Screening step claimed");
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, "Failed to claim step"));
    },
  });

  const approveRequest = useMutation({
    mutationFn: ({ stepId, comment }: { stepId: string; comment?: string }) =>
      approveResourceRequest(stepId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nafQueryKey });
      toast.success("Request approved");
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, "Failed to approve request"));
    },
  });

  const rejectRequest = useMutation({
    mutationFn: ({
      stepId,
      reasonForRejection,
    }: {
      stepId: string;
      reasonForRejection: string;
    }) => rejectResourceRequest(stepId, reasonForRejection),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nafQueryKey });
      toast.success("Request rejected");
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, "Failed to reject request"));
    },
  });

  const acceptImplementation = useMutation({
    mutationFn: (resourceRequestId: string) =>
      adminApi.assignToMe(resourceRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nafQueryKey });
      toast.success("Task accepted");
    },
    onError: () => toast.error("Failed to accept task"),
  });

  const setToInProgress = useMutation({
    mutationFn: (implementationId: string) =>
      adminApi.setToInProgress(implementationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nafQueryKey });
      toast.success("Set to In Progress");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const setToDelayed = useMutation({
    mutationFn: ({
      implementationId,
      delayReason,
    }: {
      implementationId: string;
      delayReason: string;
    }) => adminApi.setToDelayed(implementationId, delayReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nafQueryKey });
      toast.success("Marked as Delayed");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const setToAccomplished = useMutation({
    mutationFn: (implementationId: string) =>
      adminApi.setToAccomplished(implementationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nafQueryKey });
      toast.success("Marked as Accomplished");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const isImplSubmitting =
    acceptImplementation.isPending ||
    setToInProgress.isPending ||
    setToDelayed.isPending ||
    setToAccomplished.isPending;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Requests</h2>
      <Accordion type="multiple" className="space-y-2">
        {naf.resourceRequests.map((req) => {
          const currentStep = req.steps.find(
            (s) => s.stepOrder === req.currentStep,
          );
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
                const step = req.steps.find(
                  (s) => s.stepOrder === req.currentStep,
                );
                if (step)
                  approveRequest.mutate({
                    stepId: step.id,
                    comment: remarks || undefined,
                  });
              }}
              onReject={(requestId, reason) => {
                const step = req.steps.find(
                  (s) => s.stepOrder === req.currentStep,
                );
                if (step)
                  rejectRequest.mutate({
                    stepId: step.id,
                    reasonForRejection: reason,
                  });
              }}
              onAccept={(resourceRequestId) =>
                acceptImplementation.mutate(resourceRequestId)
              }
              onSetToInProgress={(implId) => setToInProgress.mutate(implId)}
              onSetToDelayed={(implId, reason) =>
                setToDelayed.mutate({ implementationId: implId, delayReason: reason })
              }
              onSetToAccomplished={(implId) =>
                setToAccomplished.mutate(implId)
              }
              isSubmittingImpl={isImplSubmitting}
            />
          );
        })}
      </Accordion>
    </div>
  );
}
```

- [ ] **Step 2: Verify `ResourceRequestAccordionItem` is re-exported from the naf index**

Open `NAFClient/src/features/naf/components/resource-request/index.ts` and confirm it exports `ResourceRequestAccordionItem`. If not, add:
```tsx
export { ResourceRequestAccordionItem } from "./ResourceRequestAccordionItem";
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```
Expected: no errors. The admin NAF detail page still passes `naf` and `currentUser` to `AdminResourceRequestList` unchanged.

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/features/admin/components/AdminResourceRequestList.tsx
git commit -m "feat: admin NAF detail uses shared ResourceRequestAccordionItem with full details and impl/screening actions"
```

---

## Task 6: Manual smoke test

- [ ] **Step 1: Start both servers**

Backend — from `NAFServer/`:
```bash
dotnet run
```

Frontend — from `NAFClient/`:
```bash
npm run dev
```

- [ ] **Step 2: Test requestor/approver view is unchanged**

Log in as a REQUESTOR_APPROVER. Open a NAF detail page. Verify:
- Resource request accordion still shows purpose, history, additional info
- Edit/Delete buttons visible for OPEN requests
- Approve/Reject buttons visible when current approver
- No claim button, no implementation action buttons

- [ ] **Step 3: Test admin read-only states**

Log in as ADMIN. Open a NAF detail page (`/admin/nafs/:id`). Find a request in OPEN, IN_PROGRESS, ACCOMPLISHED, or REJECTED state. Expand it. Verify:
- Purpose block visible
- History table visible
- Approval steps visible
- No edit, delete, resubmit, deactivate, or change resource buttons

- [ ] **Step 4: Test admin FOR_SCREENING state**

Find a NAF with a request in FOR_SCREENING state with an unclaimed screening step. Verify:
- Step row shows amber "Awaiting claim" styling and Claim button
- After claiming: Approve and Reject buttons appear
- Approve/Reject dialogs open and mutations fire correctly (check network tab and toast)

- [ ] **Step 5: Test admin IMPLEMENTATION state**

Find a NAF with a request in IMPLEMENTATION state. Expand it. Verify:
- `ImplementationBlock` (read-only display) shows current impl status
- Accept button shows when impl status is OPEN
- Mark Accomplished / Mark Delayed buttons show when IN_PROGRESS
- Back to In Progress / Mark Accomplished when DELAYED
- Mark Delayed opens the delay reason modal, requires non-empty input
- Each action fires a mutation, shows a toast, and invalidates the NAF query

- [ ] **Step 6: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: smoke test corrections for shared resource request list"
```
