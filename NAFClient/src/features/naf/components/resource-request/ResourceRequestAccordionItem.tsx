import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { DateUrgencyBadge } from "./ResourceRequestContent";
import { PurposeBlock, HistoryTable, ImplementationBlock } from "./ResourceRequestContent";
import {
  OpenActions, ReminderAction, DeactivateAction,
  RejectedActions, CancelledBadge, ApproverActions,
} from "./ResourceRequestActions";
import { ApproveDialog } from "./ApproveDialog";
import { RejectDialog } from "./RejectDialog";
import { ChangeResourceDialog } from "./ChangeResourceDialog";

interface ResourceRequestAccordionItemProps {
  request: ResourceRequest;
  isCurrentApprover: boolean;
  isRequestor: boolean;
  isApprover: boolean;
  isSubmitting?: boolean;
  resourceGroup?: ResourceGroup;
  groupResources?: Resource[];
  onEdit: (requestId: string, nafId: string, purpose: PurposeProps) => void;
  onDelete: (requestId: string) => void;
  onRemind: (requestId: string) => void;
  onDeactivate: (requestId: string) => void;
  onResubmit: (requestId: string, nafId: string, purpose: PurposeProps) => void;
  onCancel: (requestId: string) => void;
  onChangeResource: (requestId: string, newResourceId: number) => void;
  onApprove: (requestId: string, remarks: string) => void;
  onReject: (requestId: string, reasonForRejection: string) => void;
}

export function ResourceRequestAccordionItem({
  request,
  isCurrentApprover = false,
  isApprover,
  isRequestor,
  isSubmitting,
  resourceGroup,
  groupResources = [],
  onEdit: _onEdit,
  onDelete,
  onRemind,
  onDeactivate,
  onResubmit,
  onCancel,
  onChangeResource,
  onApprove,
  onReject,
}: ResourceRequestAccordionItemProps) {
  const [_editDialogOpen, setEditDialogOpen] = useState(false);
  const [resubmitDialogOpen, setResubmitDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [purposeHistoryOpen, setPurposeHistoryOpen] = useState(false);
  const [changeResourceDialogOpen, setChangeResourceDialogOpen] = useState(false);

  const progress = request.progress as unknown as Progress;
  const config = PROGRESS_CONFIG[progress];
  const urgency = getDateUrgency(request.dateNeeded);
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
        className={cn("border rounded-lg px-0 overflow-hidden", urgency?.overdue && "border-red-300 bg-red-50/30")}
      >
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <ResourceIcon iconUrl={request.resource.iconUrl} name={request.resource.name} />
            <span className="text-sm font-medium truncate">{request.resource.name}</span>
            {progress != Progress.ACCOMPLISHED && progress != Progress.NOT_ACCOMPLISHED && (
              <DateUrgencyBadge dateNeeded={request.dateNeeded} />
            )}
          </div>
          <span className={cn("text-sm font-semibold mr-2 shrink-0", config?.className.split(" ").filter((c) => c.startsWith("text-")).join(" "))}>
            {config?.label ?? String(progress)}
          </span>
        </AccordionTrigger>

        <AccordionContent className="px-4 pb-4 pt-2">
          <PurposeBlock request={request} onShowHistory={() => setPurposeHistoryOpen(true)} />
          {showHistory && <HistoryTable histories={request.histories} />}
          {progress === Progress.REJECTED && (
            <div>
              <p className="text-sm font-semibold text-red-500 mb-1">Reason for Rejection</p>
              <Textarea readOnly value={rejectionReason} className="resize-none text-sm bg-background border-red-200" rows={2} />
            </div>
          )}
          {progress === Progress.IMPLEMENTATION && <ImplementationBlock impl={request.implementation} />}

          {isApprover && isCurrentApprover && (
            <>
              {(progress === Progress.OPEN || progress === Progress.IN_PROGRESS) && (
                <ApproverActions onApprove={() => setApproveDialogOpen(true)} onReject={() => setRejectDialogOpen(true)} />
              )}
              {progress === Progress.IMPLEMENTATION && <ReminderAction onRemind={() => onRemind(request.id)} />}
            </>
          )}

          {!isCurrentApprover && !isApprover && (
            <>
              {progress === Progress.OPEN && (
                <OpenActions onEdit={() => setEditDialogOpen(true)} onDelete={() => setDeleteDialogOpen(true)} />
              )}
              {progress === Progress.ACCOMPLISHED && isRequestor && (
                <DeactivateAction onDeactivate={() => onDeactivate(request.id)} />
              )}
              {progress === Progress.REJECTED && (
                request.cancelledAt ? (
                  <CancelledBadge cancelledAt={request.cancelledAt} />
                ) : (
                  <RejectedActions
                    onResubmit={() => setResubmitDialogOpen(true)}
                    onCancel={() => onCancel(request.id)}
                  />
                )
              )}
              {progress === Progress.IMPLEMENTATION && <ReminderAction onRemind={() => onRemind(request.id)} />}
              {canChangeResource && progress !== Progress.ACCOMPLISHED && progress !== Progress.NOT_ACCOMPLISHED && !request.cancelledAt && (
                <div className="flex justify-end mt-4">
                  <Button size="sm" className="bg-amber-400 hover:bg-amber-500 text-white gap-1.5" onClick={() => setChangeResourceDialogOpen(true)}>
                    <ArrowLeftRight className="h-3.5 w-3.5" /> Change Resource
                  </Button>
                </div>
              )}
            </>
          )}
        </AccordionContent>
      </AccordionItem>

      <PurposeHistoryModal open={purposeHistoryOpen} onOpenChange={setPurposeHistoryOpen} purposes={request.purposes ?? []} steps={request.steps ?? []} />
      <ResubmitDialog
        open={resubmitDialogOpen}
        onOpenChange={setResubmitDialogOpen}
        initialPurpose={initialPurpose}
        onSubmit={(purpose) => { onResubmit(request.id, request.nafId, { ...purpose }); setResubmitDialogOpen(false); }}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        resourceName={request.resource.name}
        onConfirm={() => { onDelete(request.id); setDeleteDialogOpen(false); }}
      />
      <ApproveDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        onConfirm={(remarks) => { onApprove(request.id, remarks); setApproveDialogOpen(false); }}
        isSubmitting={isSubmitting}
      />
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={(reason) => { onReject(request.id, reason); setRejectDialogOpen(false); }}
        isSubmitting={isSubmitting}
      />
      <ChangeResourceDialog
        open={changeResourceDialogOpen}
        onOpenChange={setChangeResourceDialogOpen}
        currentResourceName={request.resource.name}
        availableResources={groupResources}
        onConfirm={(newResourceId) => { onChangeResource(request.id, newResourceId); setChangeResourceDialogOpen(false); }}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
