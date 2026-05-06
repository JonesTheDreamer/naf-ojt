import { Clock, CheckCircle2, XCircle, Clock3, UserCheck } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { getDateUrgency } from "@/shared/utils/dateUrgency";
import type { ResourceRequest, ResourceRequestHistory } from "@/shared/types/api/naf";
import { ResourceRequestAction } from "@/shared/types/api/naf";
import { ImplementationStatus, Status } from "@/shared/types/enum/status";
import { Progress } from "@/shared/types/enum/progress";
import { StepAction } from "@/shared/types/enum/stepAction";
import { ACTION_CONFIG, formatDateTime, ResourceIcon } from "./resourceRequestUtils";

export function ActionBadge({ type }: { type: ResourceRequestAction }) {
  const cfg = ACTION_CONFIG[type];
  return (
    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", cfg?.className ?? "bg-gray-100 text-gray-600")}>
      {cfg?.label ?? String(type)}
    </span>
  );
}

export function DateUrgencyBadge({ dateNeeded }: { dateNeeded?: string | null }) {
  const urgency = getDateUrgency(dateNeeded);
  if (!urgency) return null;
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full shrink-0", urgency.overdue ? "bg-red-100 text-red-700" : "bg-amber-50 text-amber-700")}>
      {urgency.label}
    </span>
  );
}

export function HistoryTable({ histories }: { histories: ResourceRequestHistory[] }) {
  if (histories.length === 0) return null;
  const sorted = [...histories].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold text-sm">History</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs font-semibold">Date and Time</TableHead>
            <TableHead className="text-xs font-semibold">Action</TableHead>
            <TableHead className="text-xs font-semibold">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((h) => (
            <TableRow key={h.id}>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDateTime(h.createdAt)}</TableCell>
              <TableCell><ActionBadge type={h.type} /></TableCell>
              <TableCell className="text-sm text-muted-foreground">{h.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdditionalInfoBlock({ info }: { info: NonNullable<ResourceRequest["additionalInfo"]> }) {
  if (info.type === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold">Access</p>
        <Select value={info.resource} disabled>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={info.resource}>{info.resource}</SelectItem></SelectContent>
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

export function PurposeBlock({ request, onShowHistory }: { request: ResourceRequest; onShowHistory: () => void }) {
  const purpose = request.purposes?.[request.purposes.length - 1]?.purpose;
  const hasPurposeHistory = (request.purposes?.length ?? 0) > 1;
  return (
    <div className="space-y-3">
      {request.dateNeeded && (
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Date Needed</p>
          <p className="text-sm font-medium">
            {new Date(request.dateNeeded).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      )}
      {request.progress === Progress.ACCOMPLISHED && (
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Accomplished At</p>
          <p className="text-sm font-medium">{formatDateTime(request.accomplishedAt)}</p>
        </div>
      )}
      {purpose && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold">Purpose</p>
            {hasPurposeHistory && (
              <Button type="button" size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={onShowHistory}>
                <History className="h-3 w-3" />
                Purpose History
              </Button>
            )}
          </div>
          <Textarea readOnly value={purpose} className="resize-none text-sm bg-background" rows={3} />
        </div>
      )}
      {request.additionalInfo && <AdditionalInfoBlock info={request.additionalInfo} />}
    </div>
  );
}

export function ImplementationBlock({ impl }: { impl: ResourceRequest["implementation"] }) {
  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Implementation</p>
      {!impl || impl.status === ImplementationStatus.OPEN ? (
        <div className="rounded-md border border-dashed p-3 space-y-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">Unassigned</span>
          <p className="text-sm text-muted-foreground">Not yet accepted by a technical team member.</p>
        </div>
      ) : impl.status === ImplementationStatus.IN_PROGRESS ? (
        <div className="rounded-md bg-blue-50 border border-blue-100 p-3 space-y-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">In Progress</span>
          {impl.employeeId && <p className="text-sm">Assigned to: <span className="font-medium">{impl.employeeId}</span></p>}
          {impl.acceptedAt && <p className="text-xs text-muted-foreground">Accepted: {formatDateTime(impl.acceptedAt)}</p>}
        </div>
      ) : impl.status === ImplementationStatus.DELAYED ? (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 space-y-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Delayed</span>
          {impl.employeeId && <p className="text-sm">Assigned to: <span className="font-medium">{impl.employeeId}</span></p>}
          {impl.delayedAt && <p className="text-xs text-muted-foreground">Delayed at: {formatDateTime(impl.delayedAt)}</p>}
          {impl.delayReason && (
            <div>
              <p className="text-xs font-semibold text-yellow-700 mb-0.5">Reason for delay</p>
              <p className="text-sm text-muted-foreground">{impl.delayReason}</p>
            </div>
          )}
        </div>
      ) : impl.status === ImplementationStatus.ACCOMPLISHED ? (
        <div className="rounded-md bg-emerald-50 border border-emerald-100 p-3 space-y-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Accomplished</span>
          {impl.employeeId && <p className="text-sm">Implemented by: <span className="font-medium">{impl.employeeId}</span></p>}
          {impl.accomplishedAt && <p className="text-xs text-muted-foreground">Accomplished: {formatDateTime(impl.accomplishedAt)}</p>}
        </div>
      ) : null}
    </div>
  );
}

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

export { ResourceIcon };
