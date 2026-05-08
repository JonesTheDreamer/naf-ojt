import { Accordion } from "@/components/ui/accordion";
import type { ResourceRequest } from "@/shared/types/api/naf";
import { Progress } from "@/shared/types/enum/progress";
import { ResourceRequestAccordionItem } from "@/features/naf/components/resource-request/ResourceRequestAccordionItem";

interface ImplementationResourceRequestListProps {
  requests: ResourceRequest[];
  onAccept: (resourceRequestId: string) => void;
  onSetToInProgress: (implementationId: string) => void;
  onSetToDelayed: (implementationId: string, delayReason: string) => void;
  onSetToAccomplished: (implementationId: string) => void;
  isSubmitting?: boolean;
}

export function ImplementationResourceRequestList({
  requests,
  onAccept,
  onSetToInProgress,
  onSetToDelayed,
  onSetToAccomplished,
  isSubmitting,
}: ImplementationResourceRequestListProps) {
  const implRequests = requests.filter(
    (rr) =>
      (rr.progress as unknown as Progress) === Progress.IMPLEMENTATION,
  );

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Requests</h2>
      {implRequests.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No implementation requests found.
        </p>
      )}
      <Accordion type="multiple" className="space-y-2">
        {implRequests.map((req) => (
          <ResourceRequestAccordionItem
            key={req.id}
            request={req}
            onAccept={onAccept}
            onSetToInProgress={onSetToInProgress}
            onSetToDelayed={onSetToDelayed}
            onSetToAccomplished={onSetToAccomplished}
            isSubmittingImpl={isSubmitting}
          />
        ))}
      </Accordion>
    </div>
  );
}
