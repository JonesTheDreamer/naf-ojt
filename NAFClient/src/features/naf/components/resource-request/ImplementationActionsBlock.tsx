import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImplementationStatus } from "@/shared/types/enum/status";
import type { ResourceRequest } from "@/shared/types/api/naf";
import { DelayedReasonModal } from "@/features/naf/components/DelayedReasonModal";

interface ImplementationActionsBlockProps {
  impl: ResourceRequest["implementation"];
  resourceRequestId: string;
  onAccept?: (resourceRequestId: string) => void;
  onSetToInProgress?: (implementationId: string) => void;
  onSetToDelayed?: (implementationId: string, reason: string) => void;
  onSetToAccomplished?: (implementationId: string) => void;
  isSubmitting?: boolean;
}

export function ImplementationActionsBlock({
  impl,
  resourceRequestId,
  onAccept,
  onSetToInProgress,
  onSetToDelayed,
  onSetToAccomplished,
  isSubmitting,
}: ImplementationActionsBlockProps) {
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const status = impl?.status ?? ImplementationStatus.OPEN;

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-4">
        {status === ImplementationStatus.OPEN && onAccept && (
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white"
            disabled={isSubmitting}
            onClick={() => onAccept(resourceRequestId)}
          >
            Accept
          </Button>
        )}

        {status === ImplementationStatus.IN_PROGRESS && (
          <>
            {onSetToAccomplished && (
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                disabled={isSubmitting}
                onClick={() => onSetToAccomplished(impl!.id)}
              >
                Mark Accomplished
              </Button>
            )}
            {onSetToDelayed && (
              <Button
                size="sm"
                variant="outline"
                className="border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                disabled={isSubmitting}
                onClick={() => setDelayModalOpen(true)}
              >
                Mark Delayed
              </Button>
            )}
          </>
        )}

        {status === ImplementationStatus.DELAYED && (
          <>
            {onSetToInProgress && (
              <Button
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white"
                disabled={isSubmitting}
                onClick={() => onSetToInProgress(impl!.id)}
              >
                Back to In Progress
              </Button>
            )}
            {onSetToAccomplished && (
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                disabled={isSubmitting}
                onClick={() => onSetToAccomplished(impl!.id)}
              >
                Mark Accomplished
              </Button>
            )}
          </>
        )}
      </div>

      {onSetToDelayed && (
        <DelayedReasonModal
          open={delayModalOpen}
          onOpenChange={setDelayModalOpen}
          onConfirm={(reason) => {
            onSetToDelayed(impl!.id, reason);
            setDelayModalOpen(false);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
