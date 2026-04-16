import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Purpose, Step } from "@/types/api/naf";
import { Status } from "@/types/enum/status";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  purposes: Purpose[];
  steps: Step[];
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

export function PurposeHistoryModal({
  open,
  onOpenChange,
  purposes,
  steps,
}: Props) {
  const historyMap = new Map(
    steps.flatMap((step) =>
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

  const sorted = [...purposes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Purpose History</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1 overflow-y-auto flex-1">
          {sorted.map((p, index) => {
            console.log(sorted);

            const isInitial = index === 0;
            const rejection = p.resourceRequestApprovalStepHistoryId
              ? historyMap.get(p.resourceRequestApprovalStepHistoryId)
              : null;
            console.log(rejection);

            const isAfterRejection = !isInitial && !!rejection;

            const label = isInitial
              ? "Initial Submission"
              : isAfterRejection
                ? "Edited after rejection"
                : "Edited while open";

            const labelClass = isInitial
              ? "text-muted-foreground"
              : isAfterRejection
                ? "text-red-600"
                : "text-blue-600";

            return (
              <div key={p.id} className="border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-semibold ${labelClass}`}>
                    {label}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDateTime(p.createdAt)}
                  </span>
                </div>

                <Textarea
                  readOnly
                  value={p.purpose}
                  className="resize-none text-sm bg-muted"
                  rows={3}
                />

                {rejection && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-2.5 space-y-1 text-sm">
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                      Rejection Details
                    </p>
                    <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
                      <span className="text-xs text-muted-foreground">
                        Rejected by
                      </span>
                      <span className="text-xs font-medium">
                        {rejection.approverName
                          ? rejection.approverName
                          : `Step ${rejection.stepOrder} Approver (${rejection.approverId})`}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        Date
                      </span>
                      <span className="text-xs">
                        {formatDateTime(rejection.actionAt)}
                      </span>

                      {rejection.reasonForRejection && (
                        <>
                          <span className="text-xs text-muted-foreground">
                            Reason
                          </span>
                          <span className="text-xs">
                            {rejection.reasonForRejection}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
