import {
  CheckCircle2,
  XCircle,
  Clock3,
  UserCheck,
  History,
  CalendarDays,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/utils";
import { getDateUrgency } from "@/shared/utils/dateUrgency";
import type {
  ResourceRequest,
  ResourceRequestHistory,
} from "@/shared/types/api/naf";
import { ResourceRequestAction } from "@/shared/types/api/naf";
import { ImplementationStatus, Status } from "@/shared/types/enum/status";
import { Progress } from "@/shared/types/enum/progress";
import { StepAction } from "@/shared/types/enum/stepAction";
import {
  ACTION_CONFIG,
  formatDateTime,
  ResourceIcon,
} from "./resourceRequestUtils";

export function DateUrgencyBadge({
  dateNeeded,
}: {
  dateNeeded?: string | null;
}) {
  const urgency = getDateUrgency(dateNeeded);
  if (!urgency) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
        urgency.overdue
          ? "bg-red-50 text-red-600 border-red-200"
          : "bg-amber-50 text-amber-700 border-amber-200",
      )}
    >
      <CalendarDays className="h-3 w-3" />
      {urgency.label}
    </span>
  );
}

export function ActionBadge({ type }: { type: ResourceRequestAction }) {
  const cfg = ACTION_CONFIG[type];
  return (
    <span
      className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide",
        cfg?.className ?? "bg-gray-100 text-gray-600 border-gray-200",
      )}
    >
      {cfg?.label ?? String(type)}
    </span>
  );
}

export function HistoryTimeline({
  histories,
}: {
  histories: ResourceRequestHistory[];
}) {
  if (histories.length === 0) return null;
  const sorted = [...histories].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          History
        </span>
      </div>
      <div className="relative">
        <div className="absolute left-3 top-1 bottom-1 w-px bg-border" />
        <div className="space-y-2">
          {sorted.map((h) => (
            <div key={h.id} className="flex items-start gap-3 relative">
              <div className="w-6 flex items-center justify-center shrink-0 pt-1.5">
                <div className="w-2 h-2 rounded-full bg-border ring-2 ring-background shrink-0 z-10" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <ActionBadge type={h.type} />
                  <span className="text-[10px] text-muted-foreground">
                    {formatDateTime(h.createdAt)}
                  </span>
                </div>
                {h.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {h.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdditionalInfoBlock({
  info,
}: {
  info: NonNullable<ResourceRequest["additionalInfo"]>;
}) {
  if (info.type === 0) {
    return (
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Internet Resource
        </p>
        <p className="text-sm font-medium bg-sky-50 border border-sky-100 rounded-lg px-3 py-1.5 text-sky-800">
          {info.resource}
        </p>
      </div>
    );
  }
  if (info.type === 1) {
    return (
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Shared Folder
        </p>
        <p className="text-sm font-medium bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 text-emerald-800">
          {info.name}
        </p>
      </div>
    );
  }
  if (info.type === 2) {
    return (
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Group Email
        </p>
        <p className="text-sm font-medium bg-violet-50 border border-violet-100 rounded-lg px-3 py-1.5 text-violet-800">
          {info.email}
        </p>
      </div>
    );
  }
  return null;
}

// ── Purpose block ─────────────────────────────────────────────────────────────
export function PurposeBlock({
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
      {/* Date needed + accomplished at in a row */}
      {(request.dateNeeded || request.progress === Progress.ACCOMPLISHED) && (
        <div className="flex flex-wrap gap-4">
          {request.dateNeeded && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                Date Needed
              </p>
              <p className="text-sm font-medium">
                {new Date(request.dateNeeded).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
          {(request.progress as unknown as Progress) ===
            Progress.ACCOMPLISHED &&
            request.accomplishedAt && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Accomplished At
                </p>
                <p className="text-sm font-medium">
                  {formatDateTime(request.accomplishedAt)}
                </p>
              </div>
            )}
        </div>
      )}

      {/* Purpose */}
      {purpose && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Purpose
            </p>
            {hasPurposeHistory && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1 text-[10px] h-6 px-2 text-muted-foreground hover:text-foreground"
                onClick={onShowHistory}
              >
                <History className="h-3 w-3" />
                History
              </Button>
            )}
          </div>
          <p className="text-sm text-foreground/80 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 leading-relaxed whitespace-pre-wrap">
            {purpose}
          </p>
        </div>
      )}

      {request.additionalInfo && (
        <AdditionalInfoBlock info={request.additionalInfo} />
      )}
    </div>
  );
}

// ── Implementation block ──────────────────────────────────────────────────────
export function ImplementationBlock({
  impl,
}: {
  impl: ResourceRequest["implementation"];
}) {
  const status = impl?.status ?? ImplementationStatus.OPEN;

  const statusConfig: Record<
    ImplementationStatus,
    { label: string; colors: string; dotColor: string }
  > = {
    [ImplementationStatus.OPEN]: {
      label: "Unassigned",
      colors: "bg-slate-50 border-slate-200 text-slate-600",
      dotColor: "bg-slate-300",
    },
    [ImplementationStatus.IN_PROGRESS]: {
      label: "In Progress",
      colors: "bg-blue-50 border-blue-200 text-blue-700",
      dotColor: "bg-blue-400",
    },
    [ImplementationStatus.DELAYED]: {
      label: "Delayed",
      colors: "bg-yellow-50 border-yellow-200 text-yellow-700",
      dotColor: "bg-yellow-400",
    },
    [ImplementationStatus.ACCOMPLISHED]: {
      label: "Accomplished",
      colors: "bg-emerald-50 border-emerald-200 text-emerald-700",
      dotColor: "bg-emerald-400",
    },
  };

  const cfg = statusConfig[status];

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        Implementation
      </p>
      <div
        className={cn("rounded-lg border px-3 py-2.5 space-y-1.5", cfg.colors)}
      >
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full shrink-0", cfg.dotColor)} />
          <span className="text-xs font-bold">{cfg.label}</span>
        </div>
        {impl?.employeeId && (
          <p className="text-xs">
            {status === ImplementationStatus.ACCOMPLISHED
              ? "Implemented by"
              : "Assigned to"}
            : <span className="font-semibold">{impl.employeeId}</span>
          </p>
        )}
        {status === ImplementationStatus.IN_PROGRESS && impl?.acceptedAt && (
          <p className="text-[10px] text-muted-foreground">
            Accepted: {formatDateTime(impl.acceptedAt)}
          </p>
        )}
        {status === ImplementationStatus.DELAYED && (
          <>
            {impl?.delayedAt && (
              <p className="text-[10px] text-muted-foreground">
                Delayed at: {formatDateTime(impl.delayedAt)}
              </p>
            )}
            {impl?.delayReason && (
              <div>
                <p className="text-[10px] font-bold text-yellow-700 mb-0.5">
                  Reason for delay
                </p>
                <p className="text-xs text-yellow-800/80">{impl.delayReason}</p>
              </div>
            )}
          </>
        )}
        {status === ImplementationStatus.ACCOMPLISHED &&
          impl?.accomplishedAt && (
            <p className="text-[10px] text-muted-foreground">
              Accomplished: {formatDateTime(impl.accomplishedAt)}
            </p>
          )}
      </div>
    </div>
  );
}

// ── Approval steps timeline ───────────────────────────────────────────────────
const STEP_ACTION_LABEL: Record<StepAction, string> = {
  [StepAction.APPROVER]: "Approval",
  [StepAction.FOR_SCREENING]: "Screening",
  [StepAction.FOR_SOC_REVIEW]: "SOC Review",
};

interface ApprovalStepsBlockProps {
  request: ResourceRequest;
  currentStepOrder?: number;
  onClaim?: (stepId: string) => void;
  onClaimSoc?: (stepId: string) => void;
  isClaiming?: boolean;
}

export function ApprovalStepsBlock({
  request,
  currentStepOrder,
  onClaim,
  onClaimSoc,
  isClaiming,
}: ApprovalStepsBlockProps) {
  if (!request.steps || request.steps.length === 0) return null;
  const sorted = [...request.steps].sort((a, b) => a.stepOrder - b.stepOrder);

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        Approval Flow
      </p>
      <div className="relative">
        {/* Vertical connector — centered on w-6 nodes (left-3 = 12px = w-6/2) */}
        <div className="absolute left-3 top-3 bottom-3 w-px bg-border" />

        <div className="space-y-2">
          {sorted.map((step) => {
            const lastHistory = [...step.histories].sort(
              (a, b) =>
                new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime(),
            )[0];
            const isApproved = lastHistory?.status === Status.APPROVED;
            const isRejected = lastHistory?.status === Status.REJECTED;
            const isPending = !lastHistory;
            const actionLabel =
              STEP_ACTION_LABEL[step.stepAction as StepAction] ?? "Approval";

            const isUnclaimedScreening =
              currentStepOrder !== undefined &&
              step.stepAction === StepAction.FOR_SCREENING &&
              step.approverId === null &&
              step.stepOrder === currentStepOrder &&
              isPending;

            const isUnclaimedSocReview =
              currentStepOrder !== undefined &&
              step.stepAction === StepAction.FOR_SOC_REVIEW &&
              step.approverId === null &&
              step.stepOrder === currentStepOrder &&
              isPending;

            return (
              <div key={step.id} className="flex items-center gap-3 relative">
                {/* Step node */}
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full border-2 text-[10px] font-bold shrink-0 bg-white z-10",
                    isApproved && "border-emerald-400 text-emerald-600",
                    isRejected && "border-red-400 text-red-500",
                    isUnclaimedScreening && "border-amber-400 text-amber-600",
                    isUnclaimedSocReview && "border-blue-400 text-blue-600",
                    isPending &&
                      !isUnclaimedScreening &&
                      !isUnclaimedSocReview &&
                      "border-border text-muted-foreground",
                  )}
                >
                  {isApproved && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                  {isRejected && (
                    <XCircle className="h-3.5 w-3.5 text-red-400" />
                  )}
                  {!isApproved && !isRejected && step.stepOrder}
                </div>

                {/* Step card */}
                <div
                  className={cn(
                    "flex-1 flex items-center justify-between gap-2 rounded-lg border px-3 py-2",
                    isApproved && "bg-emerald-50/60 border-emerald-100",
                    isRejected && "bg-red-50/60 border-red-100",
                    isUnclaimedScreening && "bg-amber-50/60 border-amber-200",
                    isUnclaimedSocReview && "bg-blue-50/60 border-blue-200",
                    isPending &&
                      !isUnclaimedScreening &&
                      !isUnclaimedSocReview &&
                      "bg-muted/20 border-border",
                  )}
                >
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-sm font-semibold truncate",
                        isUnclaimedScreening
                          ? "text-amber-700"
                          : isUnclaimedSocReview
                            ? "text-blue-700"
                            : "text-foreground",
                      )}
                    >
                      {step.approver?.name ?? step.approverId ?? "—"}
                    </p>
                    {step.approver && (step.approver.location || step.approver.department) && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {[step.approver.location, step.approver.department]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      {isUnclaimedScreening || isUnclaimedSocReview
                        ? `${actionLabel} · Awaiting claim`
                        : actionLabel}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {isUnclaimedScreening && onClaim ? (
                      <button
                        onClick={() => onClaim(step.id)}
                        disabled={isClaiming}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition-colors disabled:opacity-50"
                      >
                        <UserCheck className="h-3 w-3" />
                        {isClaiming ? "Claiming…" : "Claim"}
                      </button>
                    ) : isUnclaimedSocReview && onClaimSoc ? (
                      <button
                        onClick={() => onClaimSoc(step.id)}
                        disabled={isClaiming}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold transition-colors disabled:opacity-50"
                      >
                        <UserCheck className="h-3 w-3" />
                        {isClaiming ? "Claiming…" : "Claim (SOC)"}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        {isPending && !isUnclaimedScreening && (
                          <Clock3 className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span
                          className={cn(
                            "text-[10px] font-bold",
                            isApproved
                              ? "text-emerald-600"
                              : isRejected
                                ? "text-red-500"
                                : "text-muted-foreground",
                          )}
                        >
                          {isApproved
                            ? "Approved"
                            : isRejected
                              ? "Rejected"
                              : "Pending"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { ResourceIcon };
