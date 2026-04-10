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

  const purposeHistory = sortedPurposes.map((p, index) => ({
    purpose: p.purpose,
    createdAt: p.createdAt,
    label:
      index === 0
        ? "Initial Submission"
        : p.resourceRequestApprovalStepHistoryId
        ? "Edited after rejection"
        : "Edited while open",
  }));

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
                  <div key={i} className="border rounded p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {p.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(p.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm">{p.purpose}</p>
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
