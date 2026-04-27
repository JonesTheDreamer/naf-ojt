import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/shared/utils/utils";
import type { NAF, ResourceRequest } from "@/shared/types/api/naf";
import { Progress } from "@/shared/types/enum/progress";
import { Status } from "@/shared/types/enum/status";
import { PROGRESS_CONFIG } from "@/features/naf/components/progressBadge";
import { AdditionalInfoBlock } from "@/features/naf/components/resource-request/ResourceRequestContent";
import { ResourceIcon } from "@/features/naf/components/resource-request/resourceRequestUtils";

function ApprovalStepsBlock({ request }: { request: ResourceRequest }) {
  if (!request.steps || request.steps.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-muted-foreground mb-2">Approval Steps</p>
      <div className="space-y-1.5">
        {request.steps.map((step) => {
          const lastHistory = [...step.histories]
            .sort((a, b) => new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime())[0];
          const statusLabel = !lastHistory
            ? "Pending"
            : lastHistory.status === Status.APPROVED
            ? "Approved"
            : lastHistory.status === Status.REJECTED
            ? "Rejected"
            : "Pending";
          const statusColor =
            lastHistory?.status === Status.APPROVED
              ? "text-emerald-600"
              : lastHistory?.status === Status.REJECTED
              ? "text-red-500"
              : "text-muted-foreground";
          return (
            <div key={step.id} className="flex items-center justify-between text-sm">
              <span className="text-foreground">{step.approverName ?? step.approverId}</span>
              <span className={cn("text-xs font-semibold", statusColor)}>{statusLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AdminResourceRequestListProps {
  naf: NAF;
}

export function AdminResourceRequestList({ naf }: AdminResourceRequestListProps) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Requests</h2>
      <Accordion type="multiple" className="space-y-2">
        {naf.resourceRequests.map((req) => {
          const progress = req.progress as unknown as Progress;
          const config = PROGRESS_CONFIG[progress];
          return (
            <AccordionItem
              key={req.id}
              value={req.id}
              className="border rounded-lg px-0 overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ResourceIcon iconUrl={req.resource.iconUrl} name={req.resource.name} />
                  <span className="text-sm font-medium truncate">{req.resource.name}</span>
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
                <ApprovalStepsBlock request={req} />
                {req.additionalInfo && <AdditionalInfoBlock info={req.additionalInfo} />}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
