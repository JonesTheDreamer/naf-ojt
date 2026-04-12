import { useState } from "react";
import { Info, UserPlus, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResourceRequest } from "@/types/api/naf";
import { handleAdditionalInfoStructured } from "@/types/api/naf";
import { ImplementationStatus } from "@/types/enum/status";
import { ResourceRequestInfoModal } from "./ResourceRequestInfoModal";
import { DelayedReasonModal } from "./DelayedReasonModal";

interface Props {
  request: ResourceRequest;
  mode: "for-implementations" | "my-tasks";
  onAssign?: (requestId: string) => void;
  onMarkDelayed?: (implementationId: string, reason: string) => void;
  onMarkAccomplished?: (implementationId: string) => void;
  isSubmitting?: boolean;
}

const STATUS_LABELS: Record<ImplementationStatus, string> = {
  [ImplementationStatus.OPEN]: "Open",
  [ImplementationStatus.IN_PROGRESS]: "In Progress",
  [ImplementationStatus.DELAYED]: "Delayed",
  [ImplementationStatus.ACCOMPLISHED]: "Accomplished",
};

const STATUS_COLORS: Record<ImplementationStatus, string> = {
  [ImplementationStatus.OPEN]: "bg-gray-100 text-gray-700",
  [ImplementationStatus.IN_PROGRESS]: "bg-blue-100 text-blue-700",
  [ImplementationStatus.DELAYED]: "bg-yellow-100 text-yellow-700",
  [ImplementationStatus.ACCOMPLISHED]: "bg-green-100 text-green-700",
};

function ImplementationStatusBadge({
  status,
}: {
  status: ImplementationStatus | null | undefined;
}) {
  if (status == null)
    return (
      <span className="text-xs text-muted-foreground italic">Unassigned</span>
    );
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function ImplementationResourceRequestRow({
  request,
  mode,
  onAssign,
  onMarkDelayed,
  onMarkAccomplished,
  isSubmitting,
}: Props) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [delayOpen, setDelayOpen] = useState(false);

  const impl = request.implementation;
  const isAccomplished = impl?.status === ImplementationStatus.ACCOMPLISHED;
  const isDelayed = impl?.status === ImplementationStatus.DELAYED;

  const additionalInfoSummary = request.additionalInfo
    ? handleAdditionalInfoStructured(request.additionalInfo)
    : null;

  const additionalInfoText = additionalInfoSummary
    ? `${additionalInfoSummary.label}: ${Object.values(additionalInfoSummary.data).filter(Boolean).join(", ")}`
    : null;

  return (
    <>
      <div className="flex items-start justify-between gap-3 py-3 border-b last:border-b-0">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {request.resource.iconUrl && (
              <img
                src={request.resource.iconUrl}
                alt={request.resource.name}
                className="h-4 w-4 object-contain shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <span className="text-sm font-medium">{request.resource.name}</span>
            <ImplementationStatusBadge status={impl?.status} />
          </div>

          {request.resource.isSpecial && additionalInfoText && (
            <p className="text-xs text-muted-foreground">
              {additionalInfoText}
            </p>
          )}

          {mode === "for-implementations" && (
            <p className="text-xs text-muted-foreground">
              {impl?.employeeId
                ? `Assigned to: ${impl.employeeId}`
                : "Unassigned"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-7"
            onClick={() => setInfoOpen(true)}
          >
            <Info className="h-3 w-3" />
            More Info
          </Button>

          {mode === "for-implementations" && !impl?.employeeId && (
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5 text-xs h-7"
              onClick={() => onAssign?.(request.id)}
              disabled={isSubmitting}
            >
              <UserPlus className="h-3 w-3" />
              Assign to Me
            </Button>
          )}

          {mode === "my-tasks" && !isAccomplished && (
            <>
              {!isDelayed && (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100 gap-1.5 text-xs h-7"
                  onClick={() => setDelayOpen(true)}
                  disabled={isSubmitting}
                >
                  <Clock className="h-3 w-3" />
                  Delayed
                </Button>
              )}
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 text-xs h-7"
                onClick={() => impl?.id && onMarkAccomplished?.(impl.id)}
                disabled={isSubmitting || !impl?.id}
              >
                <CheckCircle className="h-3 w-3" />
                Accomplished
              </Button>
            </>
          )}
        </div>
      </div>

      <ResourceRequestInfoModal
        open={infoOpen}
        onOpenChange={setInfoOpen}
        request={request}
      />

      {mode === "my-tasks" && (
        <DelayedReasonModal
          open={delayOpen}
          onOpenChange={setDelayOpen}
          onConfirm={(reason) => {
            if (impl?.id) onMarkDelayed?.(impl.id, reason);
            setDelayOpen(false);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
