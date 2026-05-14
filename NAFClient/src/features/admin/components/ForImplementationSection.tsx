import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImplementationStatus } from "@/shared/types/enum/status";
import { Progress } from "@/shared/types/enum/progress";
import type { NAF, ResourceRequest } from "@/shared/types/api/naf";
import { DelayedReasonModal } from "@/features/naf/components/DelayedReasonModal";
import { adminApi } from "../api";
import { ActionCard } from "./ActionCard";
import { useForImplementation } from "../hooks/useForImplementation";
import { useMyImplementationTasks } from "../hooks/useMyImplementationTasks";

interface ForImplementationSectionProps {
  locationId: number | null;
}

type FlatItem = {
  nafId: string;
  nafReference: string;
  employeeName: string;
  rr: ResourceRequest;
};

function flattenNAFs(nafs: NAF[]): FlatItem[] {
  return nafs.flatMap((naf) =>
    naf.resourceRequests
      .filter((rr) => rr.progress === Progress.IMPLEMENTATION)
      .map((rr) => ({
        nafId: naf.id,
        nafReference: naf.reference,
        employeeName:
          `${naf.employee.firstName} ${naf.employee.lastName}`.trim(),
        rr,
      })),
  );
}

function implStatusBadge(status: ImplementationStatus) {
  if (status === ImplementationStatus.IN_PROGRESS)
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
        In Progress
      </span>
    );
  if (status === ImplementationStatus.DELAYED)
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
        Delayed
      </span>
    );
  return null;
}

export function ForImplementationSection({
  locationId,
}: ForImplementationSectionProps) {
  const qc = useQueryClient();
  const { data: forImplNafs = [] } = useForImplementation(locationId);
  const { data: myTaskNafs = [] } = useMyImplementationTasks();

  const [delayTarget, setDelayTarget] = useState<string | null>(null);

  const unassigned = flattenNAFs(forImplNafs).filter(
    ({ rr }) => !rr.implementation || !rr.implementation.employeeId,
  );
  const myTasks = flattenNAFs(myTaskNafs);
  const total = unassigned.length + myTasks.length;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "for-implementation"] });
    qc.invalidateQueries({ queryKey: ["admin", "my-implementation-tasks"] });
  };

  const assignToMe = useMutation({
    mutationFn: (resourceRequestId: string) =>
      adminApi.assignToMe(resourceRequestId),
    onSuccess: () => {
      invalidate();
      toast.success("Task claimed");
    },
    onError: () => toast.error("Failed to claim task"),
  });

  const setToInProgress = useMutation({
    mutationFn: (implementationId: string) =>
      adminApi.setToInProgress(implementationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "my-implementation-tasks"] });
      toast.success("Set to In Progress");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const setToDelayed = useMutation({
    mutationFn: ({
      implementationId,
      delayReason,
    }: {
      implementationId: string;
      delayReason: string;
    }) => adminApi.setToDelayed(implementationId, delayReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "my-implementation-tasks"] });
      toast.success("Marked as Delayed");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const setToAccomplished = useMutation({
    mutationFn: (implementationId: string) =>
      adminApi.setToAccomplished(implementationId),
    onSuccess: () => {
      invalidate();
      toast.success("Marked as Accomplished");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const isSubmitting =
    assignToMe.isPending ||
    setToInProgress.isPending ||
    setToDelayed.isPending ||
    setToAccomplished.isPending;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-base font-semibold">
        For Implementation
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          · {total}
        </span>
      </h2>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Unassigned
        </p>
        {unassigned.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No unassigned implementation requests.
          </p>
        ) : (
          unassigned.map(({ nafReference, employeeName, rr }) => (
            <ActionCard
              key={rr.id}
              employeeName={employeeName}
              resourceName={rr.resource.name}
              nafReference={nafReference}
              dateNeeded={rr.dateNeeded}
              actions={
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={isSubmitting}
                  onClick={() => assignToMe.mutate(rr.id)}
                >
                  Claim
                </Button>
              }
            />
          ))
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          My Tasks
        </p>
        {myTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No implementation tasks assigned to you.
          </p>
        ) : (
          myTasks.map(({ nafReference, employeeName, rr }) => {
            const status =
              rr.implementation?.status ?? ImplementationStatus.OPEN;
            return (
              <ActionCard
                key={rr.id}
                employeeName={employeeName}
                resourceName={rr.resource.name}
                nafReference={nafReference}
                dateNeeded={rr.dateNeeded}
                badge={implStatusBadge(status)}
                actions={
                  <>
                    {status === ImplementationStatus.IN_PROGRESS && (
                      <>
                        <Button
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
                          disabled={isSubmitting}
                          onClick={() =>
                            setToAccomplished.mutate(rr.implementation!.id)
                          }
                        >
                          Mark Accomplished
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                          disabled={isSubmitting}
                          onClick={() => setDelayTarget(rr.implementation!.id)}
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
                          onClick={() =>
                            setToInProgress.mutate(rr.implementation!.id)
                          }
                        >
                          Back to In Progress
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
                          disabled={isSubmitting}
                          onClick={() =>
                            setToAccomplished.mutate(rr.implementation!.id)
                          }
                        >
                          Mark Accomplished
                        </Button>
                      </>
                    )}
                  </>
                }
              />
            );
          })
        )}
      </div>

      <DelayedReasonModal
        open={delayTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDelayTarget(null);
        }}
        onConfirm={(reason) => {
          if (delayTarget)
            setToDelayed.mutate({
              implementationId: delayTarget,
              delayReason: reason,
            });
          setDelayTarget(null);
        }}
        isSubmitting={setToDelayed.isPending}
      />
    </div>
  );
}
