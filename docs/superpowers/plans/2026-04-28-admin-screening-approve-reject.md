# Admin Screening Approve/Reject Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the approve and reject buttons in the admin NAF detail page so admins can act on FOR_SCREENING resource requests.

**Architecture:** `AdminResourceRequestList` already renders `ApproverActions` when `currentStep?.approverId === currentUser`, but the handlers throw "not implemented." This task replaces those stubs with real `useMutation` calls and mounts `ApproveDialog`/`RejectDialog` at the list level. `AdminNAFDetailPage` passes dead `onApprove`/`onReject` props that will be removed. No backend changes needed — `PUT /api/ApprovalSteps/{stepId}/approve` and `PUT /api/ApprovalSteps/{stepId}/reject` already handle all step types including FOR_SCREENING.

**Tech Stack:** React 19, TypeScript, `@tanstack/react-query` v5, existing `ApproveDialog`/`RejectDialog` components, `approveResourceRequest`/`rejectResourceRequest` from `NAFClient/src/features/naf/api.ts`

---

### Task 1: Wire up approve/reject in AdminResourceRequestList and clean up AdminNAFDetailPage

**Files:**
- Modify: `NAFClient/src/features/admin/components/AdminResourceRequestList.tsx`
- Modify: `NAFClient/src/features/admin/pages/AdminNAFDetailPage.tsx`

**Context for the implementer:**

`approveResourceRequest(stepId, comment?)` and `rejectResourceRequest(stepId, reason)` are exported from `NAFClient/src/features/naf/api.ts`. They call:
- `PUT /api/ApprovalSteps/{stepId}/approve` with an optional string body
- `PUT /api/ApprovalSteps/{stepId}/reject` with a required string body

`ApproveDialog` is at `NAFClient/src/features/naf/components/resource-request/ApproveDialog.tsx` — props: `open`, `onOpenChange`, `onConfirm(remarks: string)`, `isSubmitting?`

`RejectDialog` is at `NAFClient/src/features/naf/components/resource-request/RejectDialog.tsx` — props: `open`, `onOpenChange`, `onConfirm(reason: string)`, `isSubmitting?`

The current `AdminResourceRequestList` interface has dead `onApprove`/`onReject` props that are never used inside the component body. Remove them. The caller (`AdminNAFDetailPage`) passes stubs for these — remove those too.

- [ ] **Step 1: Rewrite AdminResourceRequestList.tsx**

Replace the entire file with:

```tsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/shared/utils/utils";
import type { NAF, ResourceRequest } from "@/shared/types/api/naf";
import { Progress } from "@/shared/types/enum/progress";
import { Status } from "@/shared/types/enum/status";
import { StepAction } from "@/shared/types/enum/stepAction";
import { PROGRESS_CONFIG } from "@/features/naf/components/progressBadge";
import {
  AdditionalInfoBlock,
  HistoryTable,
  DateUrgencyBadge,
} from "@/features/naf/components/resource-request/ResourceRequestContent";
import { ResourceIcon } from "@/features/naf/components/resource-request/resourceRequestUtils";
import { CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { ApproverActions } from "@/features/naf/components/resource-request/ResourceRequestActions";
import { ApproveDialog } from "@/features/naf/components/resource-request/ApproveDialog";
import { RejectDialog } from "@/features/naf/components/resource-request/RejectDialog";
import {
  approveResourceRequest,
  rejectResourceRequest,
} from "@/features/naf/api";

const STEP_ACTION_LABEL: Record<StepAction, string> = {
  [StepAction.APPROVER]: "Approval",
  [StepAction.FOR_SCREENING]: "Screening",
};

function ApprovalStepsBlock({ request }: { request: ResourceRequest }) {
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

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 rounded-md border px-3 py-2 text-sm",
                isApproved && "bg-emerald-50 border-emerald-100",
                isRejected && "bg-red-50 border-red-100",
                isPending && "bg-muted/30 border-border",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  isApproved
                    ? "bg-emerald-100 text-emerald-700"
                    : isRejected
                      ? "bg-red-100 text-red-600"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {step.stepOrder}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {step.approverName ?? step.approverId}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {actionLabel}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isApproved && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                )}
                {isRejected && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                {isPending && (
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ApprovalStepsBlock };

interface AdminResourceRequestListProps {
  naf: NAF;
  currentUser: string;
}

export function AdminResourceRequestList({
  naf,
  currentUser,
}: AdminResourceRequestListProps) {
  const queryClient = useQueryClient();
  const [approvingStepId, setApprovingStepId] = useState<string | null>(null);
  const [rejectingStepId, setRejectingStepId] = useState<string | null>(null);

  const approveRequest = useMutation({
    mutationFn: ({ stepId, comment }: { stepId: string; comment?: string }) =>
      approveResourceRequest(stepId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", naf.id] });
      setApprovingStepId(null);
      toast.success("Request approved");
    },
    onError: () => toast.error("Failed to approve request"),
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
      queryClient.invalidateQueries({ queryKey: ["naf", naf.id] });
      setRejectingStepId(null);
      toast.success("Request rejected");
    },
    onError: () => toast.error("Failed to reject request"),
  });

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Requests</h2>
      <Accordion type="multiple" className="space-y-2">
        {naf.resourceRequests.map((req) => {
          const progress = req.progress as unknown as Progress;
          const config = PROGRESS_CONFIG[progress];
          const currentStep = req.steps.find(
            (s) => s.stepOrder === req.currentStep,
          );
          const isApprover = currentStep?.approverId === currentUser;
          return (
            <AccordionItem
              key={req.id}
              value={req.id}
              className={cn(
                "border rounded-lg px-0 overflow-hidden",
                !req.isActive && "opacity-60",
              )}
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ResourceIcon
                    iconUrl={req.resource.iconUrl}
                    name={req.resource.name}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium truncate",
                      !req.isActive && "line-through text-muted-foreground",
                    )}
                  >
                    {req.resource.name}
                  </span>
                  {!req.isActive && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
                      Deactivated
                    </span>
                  )}
                  {req.isActive &&
                    progress !== Progress.ACCOMPLISHED &&
                    progress !== Progress.NOT_ACCOMPLISHED && (
                      <DateUrgencyBadge dateNeeded={req.dateNeeded} />
                    )}
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
              <AccordionContent className="px-4 pb-4 pt-2 space-y-3">
                <ApprovalStepsBlock request={req} />
                {req.additionalInfo && (
                  <AdditionalInfoBlock info={req.additionalInfo} />
                )}
                {req.histories.length > 0 && (
                  <HistoryTable histories={req.histories} />
                )}
                {isApprover && currentStep && (
                  <ApproverActions
                    onApprove={() => setApprovingStepId(currentStep.id)}
                    onReject={() => setRejectingStepId(currentStep.id)}
                  />
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <ApproveDialog
        open={approvingStepId !== null}
        onOpenChange={(open) => {
          if (!open) setApprovingStepId(null);
        }}
        onConfirm={(remarks) => {
          if (!approvingStepId) return;
          approveRequest.mutate({
            stepId: approvingStepId,
            comment: remarks || undefined,
          });
        }}
        isSubmitting={approveRequest.isPending}
      />

      <RejectDialog
        open={rejectingStepId !== null}
        onOpenChange={(open) => {
          if (!open) setRejectingStepId(null);
        }}
        onConfirm={(reason) => {
          if (!rejectingStepId) return;
          rejectRequest.mutate({
            stepId: rejectingStepId,
            reasonForRejection: reason,
          });
        }}
        isSubmitting={rejectRequest.isPending}
      />
    </div>
  );
}
```

- [ ] **Step 2: Remove dead props from AdminNAFDetailPage.tsx**

In `NAFClient/src/features/admin/pages/AdminNAFDetailPage.tsx`, find the `AdminResourceRequestList` usage (around line 95) and replace:

```tsx
<AdminResourceRequestList
  naf={naf}
  currentUser={currentUserId}
  onApprove={function (requestId: string, remarks: string): void {
    throw new Error("Function not implemented.");
  }}
  onReject={function (
    requestId: string,
    reasonForRejection: string,
  ): void {
    throw new Error("Function not implemented.");
  }}
/>
```

With:

```tsx
<AdminResourceRequestList
  naf={naf}
  currentUser={currentUserId}
/>
```

- [ ] **Step 3: Build to confirm no TypeScript errors**

```bash
cd NAFClient && npm run build
```

Expected: exits 0 with no type errors.

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/features/admin/components/AdminResourceRequestList.tsx NAFClient/src/features/admin/pages/AdminNAFDetailPage.tsx
git commit -m "feat: wire up approve/reject for admin screening resource requests"
```
