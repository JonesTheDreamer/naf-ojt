import { useState } from "react";
import {
  Clock,
  Pencil,
  Trash2,
  RotateCcw,
  BellRing,
  X,
  Check,
  History,
  ArrowLeftRight,
} from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/shared/utils/utils";
import { getDateUrgency } from "@/shared/utils/dateUrgency";

import type {
  Resource,
  ResourceGroup,
  ResourceRequest,
  ResourceRequestHistory,
  PurposeProps,
} from "@/types/api/naf";
import { ResourceRequestAction } from "@/types/api/naf";

import { Status, ImplementationStatus } from "@/types/enum/status";
import { PROGRESS_CONFIG } from "./progressBadge";

import { DeleteConfirmDialog } from "./deleteConfirmDialog";
import { ResubmitDialog } from "./resubmitDialog";
import { PurposeHistoryModal } from "./purposeHistoryModal";
import { Progress } from "@/types/enum/progress";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function ResourceIcon({ iconUrl, name }: { iconUrl: string; name: string }) {
  return (
    <img
      src={iconUrl}
      alt={name}
      className="h-5 w-5 object-contain shrink-0"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

const ACTION_CONFIG: Record<
  ResourceRequestAction,
  { label: string; className: string }
> = {
  [ResourceRequestAction.APPROVE]: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700",
  },
  [ResourceRequestAction.REJECT]: {
    label: "Rejected",
    className: "bg-red-100 text-red-600",
  },
  [ResourceRequestAction.DELAY]: {
    label: "Delayed",
    className: "bg-yellow-100 text-yellow-700",
  },
  [ResourceRequestAction.ACCEPT]: {
    label: "Accepted",
    className: "bg-blue-100 text-blue-700",
  },
  [ResourceRequestAction.ACCOMPLISH]: {
    label: "Accomplished",
    className: "bg-emerald-100 text-emerald-700",
  },
  [ResourceRequestAction.EDITED]: {
    label: "Edited",
    className: "bg-gray-100 text-gray-600",
  },
  [ResourceRequestAction.CANCELLED]: {
    label: "Cancelled",
    className: "bg-gray-50 border-gray-200",
  },
};

function ActionBadge({ type }: { type: ResourceRequestAction }) {
  const cfg = ACTION_CONFIG[type];
  return (
    <span
      className={cn(
        "text-xs font-semibold px-2 py-0.5 rounded-full",
        cfg?.className ?? "bg-gray-100 text-gray-600",
      )}
    >
      {cfg?.label ?? String(type)}
    </span>
  );
}

function DateUrgencyBadge({ dateNeeded }: { dateNeeded?: string | null }) {
  const urgency = getDateUrgency(dateNeeded);
  if (!urgency) return null;

  return (
    <span
      className={cn(
        "text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
        urgency.overdue
          ? "bg-red-100 text-red-700"
          : "bg-amber-50 text-amber-700",
      )}
    >
      {urgency.label}
    </span>
  );
}

function HistoryTable({ histories }: { histories: ResourceRequestHistory[] }) {
  if (histories.length === 0) return null;

  const sorted = [...histories].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold text-sm">History</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs font-semibold">
              Date and Time
            </TableHead>
            <TableHead className="text-xs font-semibold">Action</TableHead>
            <TableHead className="text-xs font-semibold">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((h) => (
            <TableRow key={h.id}>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {formatDateTime(h.createdAt)}
              </TableCell>
              <TableCell>
                <ActionBadge type={h.type} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {h.description}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PurposeBlock({
  request,
  onShowHistory,
}: {
  request: ResourceRequest;
  onShowHistory: () => void;
}) {
  const purpose = request.purposes?.[request.purposes.length - 1]?.purpose;
  const hasPurposeHistory = (request.purposes?.length ?? 0) > 1;

  return (
    <div className="space-y-3">
      {request.dateNeeded && (
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Date Needed</p>
          <p className="text-sm font-medium">
            {new Date(request.dateNeeded).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      )}

      {request.progress == Progress.ACCOMPLISHED && (
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">
            Accomplished At
          </p>
          <p className="text-sm font-medium">
            {formatDateTime(request.accomplishedAt)}
          </p>
        </div>
      )}

      {purpose && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold">Purpose</p>
            {hasPurposeHistory && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-7"
                onClick={onShowHistory}
              >
                <History className="h-3 w-3" />
                Purpose History
              </Button>
            )}
          </div>
          <Textarea
            readOnly
            value={purpose}
            className="resize-none text-sm bg-background"
            rows={3}
          />
        </div>
      )}

      {request.additionalInfo && (
        <AdditionalInfoBlock info={request.additionalInfo} />
      )}
    </div>
  );
}

function AdditionalInfoBlock({
  info,
}: {
  info: NonNullable<ResourceRequest["additionalInfo"]>;
}) {
  if (info.type === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold">Access</p>
        <Select value={info.resource} disabled>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={info.resource}>{info.resource}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (info.type === 1) {
    return (
      <div className="text-sm space-y-1">
        <p className="font-semibold">Shared Folder</p>
        <p className="text-muted-foreground">{info.name}</p>
      </div>
    );
  }
  if (info.type === 2) {
    return (
      <div className="text-sm space-y-1">
        <p className="font-semibold">Group Email</p>
        <p className="text-muted-foreground">{info.email}</p>
      </div>
    );
  }
  return null;
}

function OpenActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <Button
        size="sm"
        className="bg-emerald-400 hover:bg-emerald-500 text-white gap-1.5"
        onClick={onEdit}
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
      <Button
        size="sm"
        className="bg-red-400 hover:bg-red-500 text-white gap-1.5"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </Button>
    </div>
  );
}

function ChangeResourceDialog({
  open,
  onOpenChange,
  currentResourceName,
  availableResources,
  onConfirm,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentResourceName: string;
  availableResources: Resource[];
  onConfirm: (resourceId: number) => void;
  isSubmitting?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleOpenChange = (val: boolean) => {
    if (!val) setSelectedId(null);
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-600">Change Resource</DialogTitle>
          <DialogDescription>
            Replacing:{" "}
            <span className="font-medium text-foreground">
              {currentResourceName}
            </span>
            . The original request will be cancelled.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {availableResources.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No other resources available in this group.
            </p>
          ) : (
            <div className="space-y-1.5">
              {availableResources.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={cn(
                    "flex items-center gap-3 w-full rounded-md border px-3 py-2 text-sm transition-colors text-left",
                    selectedId === r.id
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : "hover:bg-muted/50",
                  )}
                  onClick={() => setSelectedId(r.id)}
                >
                  <ResourceIcon iconUrl={r.iconUrl} name={r.name} />
                  <span>{r.name}</span>
                  {r.isSpecial && (
                    <span className="ml-auto text-xs text-amber-600 font-medium">
                      Requires Approval
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
            onClick={() => {
              if (selectedId !== null) {
                onConfirm(selectedId);
                setSelectedId(null);
              }
            }}
            disabled={selectedId === null || isSubmitting}
          >
            <ArrowLeftRight className="h-4 w-4" />
            {isSubmitting ? "Changing..." : "Confirm Change"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReminderAction({ onRemind }: { onRemind: () => void }) {
  return (
    <div className="flex justify-end mt-4">
      <Button
        size="sm"
        variant="outline"
        className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100 gap-1.5"
        onClick={onRemind}
      >
        Remind Technical Team
        <BellRing className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function DeactivateAction({ onDeactivate }: { onDeactivate: () => void }) {
  return (
    <div className="flex justify-end mt-4">
      <Button
        size="sm"
        className="bg-red-400 hover:bg-red-500 text-white gap-1.5"
        onClick={onDeactivate}
      >
        Deactivate Access
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function RejectedActions({
  onResubmit,
  onCancel,
}: {
  rejectionReason?: string;
  onResubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100 gap-1.5"
          onClick={onResubmit}
        >
          Resubmit
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          className="bg-red-400 hover:bg-red-500 text-white gap-1.5"
          onClick={onCancel}
        >
          Cancel Request
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function CancelledBadge({ cancelledAt }: { cancelledAt: string }) {
  return (
    <div className="mt-4 rounded-md bg-gray-50 border border-gray-200 p-3 space-y-0.5">
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
        Cancelled
      </span>
      <p className="text-xs text-muted-foreground pt-1">
        Cancelled on {formatDateTime(cancelledAt)}
      </p>
    </div>
  );
}

function ApproverActions({
  onApprove,
  onReject,
}: {
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <Button
        size="sm"
        className="bg-emerald-400 hover:bg-emerald-500 text-white gap-1.5 min-w-[90px]"
        onClick={onApprove}
      >
        Approve
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        className="bg-red-400 hover:bg-red-500 text-white gap-1.5 min-w-[90px]"
        onClick={onReject}
      >
        Reject
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ─── Approver dialogs ─────────────────────────────────────────────────────────

function ApproveDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (remarks: string) => void;
  isSubmitting?: boolean;
}) {
  const [remarks, setRemarks] = useState("");

  const handleOpenChange = (val: boolean) => {
    if (!val) setRemarks("");
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-emerald-600">
            Approve Request
          </DialogTitle>
          <DialogDescription>
            You are about to approve this resource request. You may optionally
            add remarks before submitting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="approve-remarks" className="text-sm font-semibold">
            Remarks{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Textarea
            id="approve-remarks"
            placeholder="Add any remarks here..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="resize-none"
            rows={3}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5"
            onClick={() => {
              onConfirm(remarks);
              setRemarks("");
            }}
            disabled={isSubmitting}
          >
            <Check className="h-4 w-4" />
            {isSubmitting ? "Approving..." : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const isInvalid = touched && reason.trim() === "";

  const handleOpenChange = (val: boolean) => {
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-500">Reject Request</DialogTitle>
          <DialogDescription>
            A reason for rejection is required before submitting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="reject-reason" className="text-sm font-semibold">
            Reason for Rejection <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="reject-reason"
            placeholder="State the reason for rejection..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (touched) setTouched(false);
            }}
            onBlur={() => setTouched(true)}
            className={cn(
              "resize-none",
              isInvalid && "border-red-400 focus-visible:ring-red-400",
            )}
            rows={3}
          />
          {isInvalid && (
            <p className="text-xs text-red-500">
              Reason for rejection is required.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-red-400 hover:bg-red-500 text-white gap-1.5"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
            {isSubmitting ? "Rejecting..." : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Implementation block ─────────────────────────────────────────────────────

function ImplementationBlock({
  impl,
}: {
  impl: ResourceRequest["implementation"];
}) {
  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Implementation
      </p>

      {!impl || impl.status === ImplementationStatus.OPEN ? (
        <div className="rounded-md border border-dashed p-3 space-y-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
            Unassigned
          </span>
          <p className="text-sm text-muted-foreground">
            Not yet accepted by a technical team member.
          </p>
        </div>
      ) : impl.status === ImplementationStatus.IN_PROGRESS ? (
        <div className="rounded-md bg-blue-50 border border-blue-100 p-3 space-y-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
            In Progress
          </span>
          {impl.employeeId && (
            <p className="text-sm">
              Assigned to:{" "}
              <span className="font-medium">{impl.employeeId}</span>
            </p>
          )}
          {impl.acceptedAt && (
            <p className="text-xs text-muted-foreground">
              Accepted: {formatDateTime(impl.acceptedAt)}
            </p>
          )}
        </div>
      ) : impl.status === ImplementationStatus.DELAYED ? (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 space-y-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
            Delayed
          </span>
          {impl.employeeId && (
            <p className="text-sm">
              Assigned to:{" "}
              <span className="font-medium">{impl.employeeId}</span>
            </p>
          )}
          {impl.delayedAt && (
            <p className="text-xs text-muted-foreground">
              Delayed at: {formatDateTime(impl.delayedAt)}
            </p>
          )}
          {impl.delayReason && (
            <div>
              <p className="text-xs font-semibold text-yellow-700 mb-0.5">
                Reason for delay
              </p>
              <p className="text-sm text-muted-foreground">
                {impl.delayReason}
              </p>
            </div>
          )}
        </div>
      ) : impl.status === ImplementationStatus.ACCOMPLISHED ? (
        <div className="rounded-md bg-emerald-50 border border-emerald-100 p-3 space-y-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
            Accomplished
          </span>
          {impl.employeeId && (
            <p className="text-sm">
              Implemented by:{" "}
              <span className="font-medium">{impl.employeeId}</span>
            </p>
          )}
          {impl.accomplishedAt && (
            <p className="text-xs text-muted-foreground">
              Accomplished: {formatDateTime(impl.accomplishedAt)}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

interface ResourceRequestAccordionItemProps {
  request: ResourceRequest;
  isCurrentApprover: boolean;
  isRequestor: boolean;
  isApprover: boolean;
  isSubmitting?: boolean;
  resourceGroup?: ResourceGroup;
  groupResources?: Resource[];
  // Requestor handlers
  onEdit: (requestId: string, nafId: string, purpose: PurposeProps) => void;
  onDelete: (requestId: string) => void;
  onRemind: (requestId: string) => void;
  onDeactivate: (requestId: string) => void;
  onResubmit: (requestId: string, nafId: string, purpose: PurposeProps) => void;
  onCancel: (requestId: string) => void;
  onChangeResource: (requestId: string, newResourceId: number) => void;
  // Approver handlers
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
  const [changeResourceDialogOpen, setChangeResourceDialogOpen] =
    useState(false);

  const progress = request.progress as unknown as Progress;

  const config = PROGRESS_CONFIG[progress];
  const urgency = getDateUrgency(request.dateNeeded);
  const purposeIndex = request.purposes ? request.purposes.length - 1 : 0;
  const initialPurpose = request.purposes?.[purposeIndex]?.purpose ?? "";
  console.log(isCurrentApprover);
  // console.log();

  const rejectionHistory = request.steps
    .flatMap((s) => s.histories)
    .filter((h) => h.status === Status.REJECTED)
    .sort(
      (a, b) => new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime(),
    )[0];
  const rejectionReason = rejectionHistory?.reasonForRejection;

  const showHistory = progress !== Progress.OPEN;
  console.log(`${request.resource.name} is ${Progress[request.progress]}`);

  const canChangeResource =
    !isCurrentApprover &&
    !isApprover &&
    (resourceGroup?.canChangeWithoutApproval ?? false) &&
    groupResources.length > 0;

  console.log(
    !isCurrentApprover,
    !isApprover,
    resourceGroup?.canChangeWithoutApproval ?? false,
    groupResources.length > 0,
  );

  void (progress === Progress.OPEN || progress === Progress.IN_PROGRESS);

  console.log(isCurrentApprover);

  return (
    <>
      <AccordionItem
        value={request.id}
        className={cn(
          "border rounded-lg px-0 overflow-hidden",
          urgency?.overdue && "border-red-300 bg-red-50/30",
        )}
      >
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <ResourceIcon
              iconUrl={request.resource.iconUrl}
              name={request.resource.name}
            />
            <span className="text-sm font-medium truncate">
              {request.resource.name}
            </span>
            {progress != Progress.ACCOMPLISHED &&
              progress != Progress.NOT_ACCOMPLISHED && (
                <DateUrgencyBadge dateNeeded={request.dateNeeded} />
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

        <AccordionContent className="px-4 pb-4 pt-2">
          <PurposeBlock
            request={request}
            onShowHistory={() => setPurposeHistoryOpen(true)}
          />

          {showHistory && <HistoryTable histories={request.histories} />}
          {progress === Progress.REJECTED && (
            <div>
              <p className="text-sm font-semibold text-red-500 mb-1">
                Reason for Rejection
              </p>
              <Textarea
                readOnly
                value={rejectionReason}
                className="resize-none text-sm bg-background border-red-200"
                rows={2}
              />
            </div>
          )}

          {progress === Progress.IMPLEMENTATION && (
            <ImplementationBlock impl={request.implementation} />
          )}

          {/* Current Approver action area */}
          {isApprover && isCurrentApprover && (
            <>
              {(progress === Progress.OPEN ||
                progress === Progress.IN_PROGRESS) && (
                <ApproverActions
                  onApprove={() => setApproveDialogOpen(true)}
                  onReject={() => setRejectDialogOpen(true)}
                />
              )}
              {progress === Progress.IMPLEMENTATION && (
                <ReminderAction onRemind={() => onRemind(request.id)} />
              )}
            </>
          )}

          {isApprover && !isCurrentApprover && null}

          {/* Requestor */}
          {!isCurrentApprover && !isApprover && (
            <>
              {progress === Progress.OPEN && (
                <OpenActions
                  onEdit={() => setEditDialogOpen(true)}
                  onDelete={() => setDeleteDialogOpen(true)}
                />
              )}

              {progress === Progress.ACCOMPLISHED && isRequestor && (
                <DeactivateAction
                  onDeactivate={() => onDeactivate(request.id)}
                />
              )}

              {progress === Progress.ACCOMPLISHED && !isRequestor && null}

              {progress === Progress.REJECTED &&
                (request.cancelledAt ? (
                  <CancelledBadge cancelledAt={request.cancelledAt} />
                ) : (
                  <RejectedActions
                    rejectionReason={rejectionReason}
                    onResubmit={() => setResubmitDialogOpen(true)}
                    onCancel={() => onCancel(request.id)}
                  />
                ))}
              {progress === Progress.IMPLEMENTATION && (
                <ReminderAction onRemind={() => onRemind(request.id)} />
              )}

              {canChangeResource &&
                progress !== Progress.ACCOMPLISHED &&
                progress !== Progress.NOT_ACCOMPLISHED &&
                !request.cancelledAt && (
                  <div className="flex justify-end mt-4">
                    <Button
                      size="sm"
                      className="bg-amber-400 hover:bg-amber-500 text-white gap-1.5"
                      onClick={() => setChangeResourceDialogOpen(true)}
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                      Change Resource
                    </Button>
                  </div>
                )}
            </>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* ── Purpose History Modal ─────────────────────────────────────── */}
      <PurposeHistoryModal
        open={purposeHistoryOpen}
        onOpenChange={setPurposeHistoryOpen}
        purposes={request.purposes ?? []}
        steps={request.steps ?? []}
      />

      {/* ── Requestor dialogs ──────────────────────────────────────────── */}
      {/* <ResubmitDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        initialPurpose={initialPurpose}
        onSubmit={(purpose) => {
          onEdit(request.id, request.nafId, purpose);
          setEditDialogOpen(false);
        }}
      /> */}
      <ResubmitDialog
        open={resubmitDialogOpen}
        onOpenChange={setResubmitDialogOpen}
        initialPurpose={initialPurpose}
        onSubmit={(purpose) => {
          onResubmit(request.id, request.nafId, {
            ...purpose,
          });
          setResubmitDialogOpen(false);
        }}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        resourceName={request.resource.name}
        onConfirm={() => {
          onDelete(request.id);
          setDeleteDialogOpen(false);
        }}
      />

      {/* ── Approver dialogs ───────────────────────────────────────────── */}
      <ApproveDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        onConfirm={(remarks) => {
          onApprove(request.id, remarks);
          setApproveDialogOpen(false);
        }}
        isSubmitting={isSubmitting}
      />
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={(reason) => {
          onReject(request.id, reason);
          setRejectDialogOpen(false);
        }}
        isSubmitting={isSubmitting}
      />

      {/* ── Change Resource dialog ─────────────────────────────────────── */}
      <ChangeResourceDialog
        open={changeResourceDialogOpen}
        onOpenChange={setChangeResourceDialogOpen}
        currentResourceName={request.resource.name}
        availableResources={groupResources}
        onConfirm={(newResourceId) => {
          onChangeResource(request.id, newResourceId);
          setChangeResourceDialogOpen(false);
        }}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
