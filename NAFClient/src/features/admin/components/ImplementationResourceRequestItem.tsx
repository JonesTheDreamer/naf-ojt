import { useState } from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/utils";
import type { ResourceRequest } from "@/shared/types/api/naf";
import { ImplementationStatus } from "@/shared/types/enum/status";
import { AdditionalInfoBlock } from "@/features/naf/components/resource-request/ResourceRequestContent";
import { ResourceIcon } from "@/features/naf/components/resource-request/resourceRequestUtils";
import { DelayedReasonModal } from "./DelayedReasonModal";

const IMPL_STATUS_CONFIG: Record<
  ImplementationStatus,
  { label: string; textClass: string }
> = {
  [ImplementationStatus.OPEN]: {
    label: "Open",
    textClass: "text-amber-500",
  },
  [ImplementationStatus.IN_PROGRESS]: {
    label: "In Progress",
    textClass: "text-blue-600",
  },
  [ImplementationStatus.DELAYED]: {
    label: "Delayed",
    textClass: "text-yellow-600",
  },
  [ImplementationStatus.ACCOMPLISHED]: {
    label: "Accomplished",
    textClass: "text-emerald-600",
  },
};

interface ImplementationResourceRequestItemProps {
  request: ResourceRequest;
  onAccept: (resourceRequestId: string) => void;
  onSetToInProgress: (implementationId: string) => void;
  onSetToDelayed: (implementationId: string, delayReason: string) => void;
  onSetToAccomplished: (implementationId: string) => void;
  isSubmitting?: boolean;
}

export function ImplementationResourceRequestItem({
  request,
  onAccept,
  onSetToInProgress,
  onSetToDelayed,
  onSetToAccomplished,
  isSubmitting,
}: ImplementationResourceRequestItemProps) {
  const [delayModalOpen, setDelayModalOpen] = useState(false);

  const impl = request.implementation;
  const status = impl?.status ?? ImplementationStatus.OPEN;
  const config = IMPL_STATUS_CONFIG[status];

  return (
    <>
      <AccordionItem
        value={request.id}
        className="border rounded-lg px-0 overflow-hidden"
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
          </div>
          <span className={cn("text-sm font-semibold mr-2 shrink-0", config.textClass)}>
            {config.label}
          </span>
        </AccordionTrigger>

        <AccordionContent className="px-4 pb-4 pt-2 space-y-3">
          {request.additionalInfo && (
            <AdditionalInfoBlock info={request.additionalInfo} />
          )}

          {request.dateNeeded && (
            <p className="text-sm text-muted-foreground">
              Date Needed:{" "}
              <span className="font-medium text-foreground">
                {new Date(request.dateNeeded).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </p>
          )}

          {status === ImplementationStatus.DELAYED && impl?.delayReason && (
            <div>
              <p className="text-xs font-semibold text-yellow-600 mb-1">
                Delay Reason
              </p>
              <p className="text-sm text-muted-foreground">{impl.delayReason}</p>
            </div>
          )}

          {status === ImplementationStatus.ACCOMPLISHED &&
            impl?.accomplishedAt && (
              <p className="text-sm text-muted-foreground">
                Accomplished:{" "}
                <span className="font-medium text-foreground">
                  {new Date(impl.accomplishedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}

          <div className="flex flex-wrap gap-2 mt-2">
            {status === ImplementationStatus.OPEN && (
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white"
                disabled={isSubmitting}
                onClick={() => onAccept(request.id)}
              >
                Accept
              </Button>
            )}

            {status === ImplementationStatus.IN_PROGRESS && (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  disabled={isSubmitting}
                  onClick={() => onSetToAccomplished(impl!.id)}
                >
                  Mark Accomplished
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                  disabled={isSubmitting}
                  onClick={() => setDelayModalOpen(true)}
                >
                  Mark Delayed
                </Button>
              </>
            )}

            {status === ImplementationStatus.DELAYED && (
              <>
                <Button
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={isSubmitting}
                  onClick={() => onSetToInProgress(impl!.id)}
                >
                  Back to In Progress
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  disabled={isSubmitting}
                  onClick={() => onSetToAccomplished(impl!.id)}
                >
                  Mark Accomplished
                </Button>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      <DelayedReasonModal
        open={delayModalOpen}
        onOpenChange={setDelayModalOpen}
        onConfirm={(reason) => {
          onSetToDelayed(impl!.id, reason);
          setDelayModalOpen(false);
        }}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
