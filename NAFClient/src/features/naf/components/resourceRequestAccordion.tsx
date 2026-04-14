import { useState } from "react";
import {
  Clock,
  Pencil,
  Trash2,
  RotateCcw,
  BellRing,
  X,
  Check,
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
import { cn } from "@/lib/utils";
import { getDateUrgency } from "@/lib/dateUrgency";

import type { ResourceRequest, PurposeProps } from "@/types/api/naf";

import { Status } from "@/types/enum/status";
import { PROGRESS_CONFIG } from "./progressBadge";

import { DeleteConfirmDialog } from "./deleteConfirmDialog";
import { ResubmitDialog } from "./resubmitDialog";
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

function ActivityBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "font-semibold text-sm",
        status === Status.APPROVED && "text-emerald-600",
        status === Status.REJECTED && "text-red-500",
        status !== Status.APPROVED &&
          status !== Status.REJECTED &&
          "text-gray-500",
      )}
    >
      {Status[status] ?? String(status)}
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

function HistoryTable({ steps }: { steps: ResourceRequest["steps"] }) {
  const histories = steps.flatMap((step) =>
    step.histories.map((h) => ({
      actionAt: h.actionAt,
      approverLabel: `Step ${step.stepOrder} Approver`,
      status: h.status,
    })),
  );

  if (histories.length === 0) return null;

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
            <TableHead className="text-xs font-semibold">Person</TableHead>
            <TableHead className="text-xs font-semibold">Activity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {histories.map((h, i) => (
            <TableRow key={i}>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(h.actionAt)}
              </TableCell>
              <TableCell className="text-sm">{h.approverLabel}</TableCell>
              <TableCell>
                <ActivityBadge status={h.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PurposeBlock({ request }: { request: ResourceRequest }) {
  const purpose = request.purposes?.[request.purposes.length - 1]?.purpose;

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

      {purpose && (
        <div>
          <p className="text-sm font-semibold mb-1">Purpose</p>
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
  rejectionReason,
  onResubmit,
}: {
  rejectionReason?: string;
  onResubmit: () => void;
}) {
  return (
    <div className="mt-4 space-y-3">
      {rejectionReason && (
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
      </div>
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

interface ResourceRequestAccordionItemProps {
  request: ResourceRequest;
  isCurrentApprover: boolean;
  isRequestor: boolean;
  isApprover: boolean;
  isSubmitting?: boolean;
  // Requestor handlers
  onEdit: (requestId: string, nafId: string, purpose: PurposeProps) => void;
  onDelete: (requestId: string) => void;
  onRemind: (requestId: string) => void;
  onDeactivate: (requestId: string) => void;
  onResubmit: (requestId: string) => void;
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
  onEdit,
  onDelete,
  onRemind,
  onDeactivate,
  onResubmit: _onResubmit,
  onApprove,
  onReject,
}: ResourceRequestAccordionItemProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const progress = request.progress as unknown as Progress;

  const config = PROGRESS_CONFIG[progress];
  const urgency = getDateUrgency(request.dateNeeded);
  const initialPurpose = request.purposes?.[0]?.purpose ?? "";

  const rejectionReason = request.steps
    .flatMap((s) => s.histories)
    .find((h) => h.status === Status.REJECTED)?.reasonForRejection;

  const showHistory = progress !== Progress.OPEN;
  console.log(`${request.resource.name} is ${Progress[request.progress]}`);

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
            <DateUrgencyBadge dateNeeded={request.dateNeeded} />
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
          <PurposeBlock request={request} />

          {showHistory && <HistoryTable steps={request.steps} />}

          {/* Current Approver action area */}
          {isApprover && isCurrentApprover && (
            <>
              {progress != Progress.REJECTED && (
                <ApproverActions
                  onApprove={() => setApproveDialogOpen(true)}
                  onReject={() => setRejectDialogOpen(true)}
                />
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

              {progress === Progress.IMPLEMENTATION && null}

              {progress === Progress.ACCOMPLISHED && isRequestor && (
                <DeactivateAction
                  onDeactivate={() => onDeactivate(request.id)}
                />
              )}

              {progress === Progress.ACCOMPLISHED && !isRequestor && null}

              {progress === Progress.REJECTED && (
                <RejectedActions
                  rejectionReason={rejectionReason}
                  onResubmit={() => setEditDialogOpen(true)}
                />
              )}
              {progress === Progress.IN_PROGRESS && (
                <ReminderAction onRemind={() => onRemind(request.id)} />
              )}
            </>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* ── Requestor dialogs ──────────────────────────────────────────── */}
      <ResubmitDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        initialPurpose={initialPurpose}
        onSubmit={(purpose) => {
          onEdit(request.id, request.nafId, purpose);
          // onResubmit("asda");
          setEditDialogOpen(false);
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
    </>
  );
}
