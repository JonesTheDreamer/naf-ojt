import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { ResourceRequest } from "@/types/api/naf";
import { Status } from "@/types/enum/status";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ResourceRequest | null;
}

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

function statusLabel(status: Status) {
  if (status === Status.APPROVED) return "Approved";
  if (status === Status.REJECTED) return "Rejected";
  return String(status);
}

function statusClass(status: Status) {
  if (status === Status.APPROVED) return "text-emerald-600 font-semibold";
  if (status === Status.REJECTED) return "text-red-500 font-semibold";
  return "text-gray-500";
}

export function ResourceRequestInfoModal({ open, onOpenChange, request }: Props) {
  if (!request) return null;

  const sortedPurposes = [...request.purposes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const latestPurpose = sortedPurposes[sortedPurposes.length - 1]?.purpose;

  const stepHistories = request.steps
    .flatMap((step) =>
      step.histories.map((h) => ({
        stepOrder: step.stepOrder,
        status: h.status,
        comment: h.comment,
        reasonForRejection: h.reasonForRejection,
        actionAt: h.actionAt,
      }))
    )
    .sort((a, b) => new Date(a.actionAt).getTime() - new Date(b.actionAt).getTime());

  // Map historyId → rejection details (step info included)
  const rejectionHistoryMap = new Map(
    request.steps.flatMap((step) =>
      step.histories
        .filter((h) => h.status === Status.REJECTED)
        .map((h) => [
          h.id,
          {
            reasonForRejection: h.reasonForRejection,
            actionAt: h.actionAt,
            approverId: step.approverId,
            approverName: step.approverName,
            stepOrder: step.stepOrder,
          },
        ]),
    ),
  );

  const purposeHistory = sortedPurposes.map((p, index) => {
    const rejection = p.resourceRequestApprovalStepHistoryId
      ? rejectionHistoryMap.get(p.resourceRequestApprovalStepHistoryId)
      : null;
    return {
      purpose: p.purpose,
      createdAt: p.createdAt,
      label:
        index === 0
          ? "Initial Submission"
          : rejection
          ? "Edited after rejection"
          : "Edited while open",
      rejection: rejection ?? null,
    };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Request Information — {request.resource.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Latest Purpose */}
          {latestPurpose && (
            <section>
              <h3 className="text-sm font-semibold mb-2">Latest Purpose</h3>
              <Textarea
                readOnly
                value={latestPurpose}
                className="resize-none text-sm bg-muted"
                rows={3}
              />
            </section>
          )}

          {/* Approval Step History */}
          {stepHistories.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2">Approval History</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Approver</TableHead>
                    <TableHead className="text-xs">Action</TableHead>
                    <TableHead className="text-xs">Comment</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stepHistories.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">
                        Step {h.stepOrder} Approver
                      </TableCell>
                      <TableCell>
                        <span className={cn("text-sm", statusClass(h.status))}>
                          {statusLabel(h.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[160px]">
                        {h.reasonForRejection
                          ? h.reasonForRejection
                          : h.comment || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDateTime(h.actionAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          )}

          {/* Purpose Change History */}
          {purposeHistory.length > 1 && (
            <section>
              <h3 className="text-sm font-semibold mb-2">
                Purpose Change History
              </h3>
              <div className="space-y-3">
                {purposeHistory.map((p, i) => (
                  <div key={i} className="border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          p.rejection
                            ? "text-red-600"
                            : i === 0
                            ? "text-muted-foreground"
                            : "text-blue-600",
                        )}
                      >
                        {p.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(p.createdAt)}
                      </span>
                    </div>
                    <Textarea
                      readOnly
                      value={p.purpose}
                      className="resize-none text-sm bg-muted"
                      rows={2}
                    />
                    {p.rejection && (
                      <div className="rounded-md bg-red-50 border border-red-200 p-2.5 space-y-1">
                        <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                          Rejection Details
                        </p>
                        <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
                          <span className="text-xs text-muted-foreground">Rejected by</span>
                          <span className="text-xs font-medium">
                            {p.rejection.approverName
                              ? p.rejection.approverName
                              : `Step ${p.rejection.stepOrder} Approver (${p.rejection.approverId})`}
                          </span>
                          <span className="text-xs text-muted-foreground">Date</span>
                          <span className="text-xs">{formatDateTime(p.rejection.actionAt)}</span>
                          {p.rejection.reasonForRejection && (
                            <>
                              <span className="text-xs text-muted-foreground">Reason</span>
                              <span className="text-xs">{p.rejection.reasonForRejection}</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
