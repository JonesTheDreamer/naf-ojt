import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/shared/utils/utils";
import { getDateUrgency } from "@/shared/utils/dateUrgency";
import type { Resource, ResourceGroup, ResourceRequest, PurposeProps } from "@/shared/types/api/naf";
import { Status } from "@/shared/types/enum/status";
import { Progress } from "@/shared/types/enum/progress";
import { PROGRESS_CONFIG } from "../progressBadge";
import { PurposeHistoryModal } from "../purposeHistoryModal";
import { DeleteConfirmDialog } from "../deleteConfirmDialog";
import { ResubmitDialog } from "../resubmitDialog";
import { ResourceIcon } from "./resourceRequestUtils";
import { DateUrgencyBadge, PurposeBlock, HistoryTimeline, ImplementationBlock, ApprovalStepsBlock } from "./ResourceRequestContent";
import { OpenActions, ReminderAction, DeactivateAction, RejectedActions, CancelledBadge, ApproverActions } from "./ResourceRequestActions";
import { ApproveDialog } from "./ApproveDialog";
import { RejectDialog } from "./RejectDialog";
import { ChangeResourceDialog } from "./ChangeResourceDialog";
import { EditPurposeDialog } from "../editPurposeDialog";
import { DeactivateConfirmDialog } from "../deactivateConfirmDialog";
import { ImplementationActionsBlock } from "./ImplementationActionsBlock";

const PROGRESS_STRIP: Record<Progress, string> = {
  [Progress.OPEN]:             "bg-amber-400",
  [Progress.IN_PROGRESS]:      "bg-blue-500",
  [Progress.FOR_SCREENING]:    "bg-purple-500",
  [Progress.IMPLEMENTATION]:   "bg-teal-500",
  [Progress.ACCOMPLISHED]:     "bg-emerald-500",
  [Progress.REJECTED]:         "bg-red-400",
  [Progress.NOT_ACCOMPLISHED]: "bg-gray-300",
  [Progress.CANCELLED]:        "bg-gray-200",
};

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
  onClaim?: (stepId: string) => void;
  isClaiming?: boolean;
  onAccept?: (resourceRequestId: string) => void;
  onSetToInProgress?: (implementationId: string) => void;
  onSetToDelayed?: (implementationId: string, reason: string) => void;
  onSetToAccomplished?: (implementationId: string) => void;
  isSubmittingImpl?: boolean;
}

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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resubmitDialogOpen, setResubmitDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [purposeHistoryOpen, setPurposeHistoryOpen] = useState(false);
  const [changeResourceDialogOpen, setChangeResourceDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  const progress = request.progress as unknown as Progress;
  const config = PROGRESS_CONFIG[progress];
  const urgency = getDateUrgency(request.dateNeeded);
  const stripColor = PROGRESS_STRIP[progress] ?? "bg-gray-200";

  const purposeIndex = request.purposes ? request.purposes.length - 1 : 0;
  const initialPurpose = request.purposes?.[purposeIndex]?.purpose ?? "";

  const rejectionHistory = request.steps
    .flatMap((s) => s.histories)
    .filter((h) => h.status === Status.REJECTED)
    .sort((a, b) => new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime())[0];
  const rejectionReason = rejectionHistory?.reasonForRejection;

  const showHistory = progress !== Progress.OPEN;

  const canChangeResource =
    !isCurrentApprover &&
    !isApprover &&
    (resourceGroup?.canChangeWithoutApproval ?? false) &&
    groupResources.length > 0;

  return (
    <>
      <AccordionItem
        value={request.id}
        className={cn(
          "rounded-xl border bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md",
          urgency?.overdue && "ring-1 ring-red-300",
          !request.isActive && "opacity-55",
        )}
      >
        <AccordionTrigger className="px-0 py-0 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:rounded-b-none [&>svg]:mr-3 [&>svg]:shrink-0 [&>svg]:self-center">
          <div className="flex items-stretch flex-1">
            {/* Progress color strip */}
            <div className={cn("w-1.5 shrink-0", stripColor)} />

            {/* Trigger body */}
            <div className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3 hover:bg-muted/20 transition-colors">
              <ResourceIcon iconUrl={request.resource.iconUrl} name={request.resource.name} />
              <span
                className={cn(
                  "text-sm font-semibold flex-1 min-w-0 truncate text-left",
                  !request.isActive && "line-through text-muted-foreground",
                )}
              >
                {request.resource.name}
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                {!request.isActive && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide">
                    Deactivated
                  </span>
                )}
                {request.isActive &&
                  progress !== Progress.ACCOMPLISHED &&
                  progress !== Progress.NOT_ACCOMPLISHED && (
                    <DateUrgencyBadge dateNeeded={request.dateNeeded} />
                  )}
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                    config?.className ?? "text-gray-500 bg-gray-50 border-gray-200",
                  )}
                >
                  {config?.label ?? String(progress)}
                </span>
              </div>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-0 pb-0">
          <div className="flex">
            <div className={cn("w-1.5 shrink-0 opacity-25", stripColor)} />

            <div className="flex-1 min-w-0 px-4 py-4 space-y-4">
              {/* Two-column grid: left = request details, right = approval flow + history */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                {/* Left column — request details */}
                <div className="space-y-4">
                  <PurposeBlock
                    request={request}
                    onShowHistory={() => setPurposeHistoryOpen(true)}
                  />

                  {progress === Progress.REJECTED && rejectionReason && (
                    <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">
                        Reason for Rejection
                      </p>
                      <p className="text-sm text-red-700/80">{rejectionReason}</p>
                    </div>
                  )}

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
                </div>

                {/* Right column — approval flow + history */}
                <div className="space-y-4">
                  {request.steps.length > 0 && (
                    <ApprovalStepsBlock
                      request={request}
                      currentStepOrder={request.currentStep}
                      onClaim={onClaim}
                      isClaiming={isClaiming}
                    />
                  )}
                  {showHistory && <HistoryTimeline histories={request.histories} />}
                </div>
              </div>

              {/* Full-width actions row */}
              {request.isActive && (
                <>
                  {isApprover && isCurrentApprover && (
                    <>
                      {(progress === Progress.OPEN ||
                        progress === Progress.IN_PROGRESS ||
                        progress === Progress.FOR_SCREENING) && (
                        <ApproverActions
                          onApprove={() => setApproveDialogOpen(true)}
                          onReject={() => setRejectDialogOpen(true)}
                        />
                      )}
                      {progress === Progress.IMPLEMENTATION && (
                        <ReminderAction onRemind={() => onRemind?.(request.id)} />
                      )}
                    </>
                  )}

                  {!isCurrentApprover && !isApprover && onEdit && (
                    <>
                      {progress === Progress.OPEN && (
                        <OpenActions
                          onEdit={() => setEditDialogOpen(true)}
                          onDelete={() => setDeleteDialogOpen(true)}
                        />
                      )}
                      {progress === Progress.ACCOMPLISHED && isRequestor && (
                        <DeactivateAction onDeactivate={() => setDeactivateDialogOpen(true)} />
                      )}
                      {progress === Progress.REJECTED &&
                        (request.cancelledAt ? (
                          <CancelledBadge cancelledAt={request.cancelledAt} />
                        ) : (
                          <RejectedActions
                            onResubmit={() => setResubmitDialogOpen(true)}
                            onCancel={() => onCancel?.(request.id)}
                          />
                        ))}
                      {progress === Progress.IMPLEMENTATION && (
                        <ReminderAction onRemind={() => onRemind?.(request.id)} />
                      )}
                      {canChangeResource &&
                        progress !== Progress.NOT_ACCOMPLISHED &&
                        !request.cancelledAt && (
                          <div className="flex justify-end">
                            <button
                              onClick={() => setChangeResourceDialogOpen(true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors"
                            >
                              <ArrowLeftRight className="h-3.5 w-3.5" />
                              Change Resource
                            </button>
                          </div>
                        )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <EditPurposeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        initialPurpose={initialPurpose}
        onSubmit={(purpose) => { onEdit?.(request.id, request.nafId, purpose); setEditDialogOpen(false); }}
      />
      <PurposeHistoryModal
        open={purposeHistoryOpen}
        onOpenChange={setPurposeHistoryOpen}
        purposes={request.purposes ?? []}
        steps={request.steps ?? []}
      />
      <ResubmitDialog
        open={resubmitDialogOpen}
        onOpenChange={setResubmitDialogOpen}
        initialPurpose={initialPurpose}
        onSubmit={(purpose) => { onResubmit?.(request.id, request.nafId, { ...purpose }); setResubmitDialogOpen(false); }}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        resourceName={request.resource.name}
        onConfirm={() => { onDelete?.(request.id); setDeleteDialogOpen(false); }}
      />
      <ApproveDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        onConfirm={(remarks) => { onApprove?.(request.id, remarks); setApproveDialogOpen(false); }}
        isSubmitting={isSubmitting}
      />
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={(reason) => { onReject?.(request.id, reason); setRejectDialogOpen(false); }}
        isSubmitting={isSubmitting}
      />
      <ChangeResourceDialog
        open={changeResourceDialogOpen}
        onOpenChange={setChangeResourceDialogOpen}
        currentResourceName={request.resource.name}
        availableResources={groupResources}
        onConfirm={(newResourceId) => { onChangeResource?.(request.id, newResourceId); setChangeResourceDialogOpen(false); }}
        isSubmitting={isSubmitting}
      />
      <DeactivateConfirmDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
        resourceName={request.resource.name}
        onConfirm={() => { onDeactivate?.(request.id); setDeactivateDialogOpen(false); }}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
