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
import { CheckCircle2, XCircle, Clock3, UserCheck } from "lucide-react";
import { ApproverActions } from "@/features/naf/components/resource-request/ResourceRequestActions";
import { ApproveDialog } from "@/features/naf/components/resource-request/ApproveDialog";
import { RejectDialog } from "@/features/naf/components/resource-request/RejectDialog";
import {
  approveResourceRequest,
  rejectResourceRequest,
  claimScreeningStep,
} from "@/features/naf/api";

const STEP_ACTION_LABEL: Record<StepAction, string> = {
  [StepAction.APPROVER]: "Approval",
  [StepAction.FOR_SCREENING]: "Screening",
};

interface ApprovalStepsBlockProps {
  request: ResourceRequest;
  currentStepOrder: number;
  onClaim?: (stepId: string) => void;
  isClaiming?: boolean;
}

function ApprovalStepsBlock({ request, currentStepOrder, onClaim, isClaiming }: ApprovalStepsBlockProps) {
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

export { ApprovalStepsBlock };

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
  const [approvingStepId, setApprovingStepId] = useState<string | null>(null);
  const [rejectingStepId, setRejectingStepId] = useState<string | null>(null);

  const claimStep = useMutation({
    mutationFn: (stepId: string) => claimScreeningStep(stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", naf.id] });
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
      queryClient.invalidateQueries({ queryKey: ["naf", naf.id] });
      setApprovingStepId(null);
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
      queryClient.invalidateQueries({ queryKey: ["naf", naf.id] });
      setRejectingStepId(null);
      toast.success("Request rejected");
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, "Failed to reject request"));
    },
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
          const isApprover =
            currentStep?.approverId === currentUser &&
            currentStep?.approverId !== null;
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
                <ApprovalStepsBlock
                  request={req}
                  currentStepOrder={req.currentStep}
                  onClaim={(stepId) => claimStep.mutate(stepId)}
                  isClaiming={claimStep.isPending}
                />
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
