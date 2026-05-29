import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Wrench, CheckCircle } from "lucide-react";
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

type Tab = "unassigned" | "mine";

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

function ImplStatusBadge({ status }: { status: ImplementationStatus }) {
  if (status === ImplementationStatus.IN_PROGRESS)
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
        In Progress
      </span>
    );
  if (status === ImplementationStatus.DELAYED)
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400">
        Delayed
      </span>
    );
  return null;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <CheckCircle className="w-8 h-8 text-muted-foreground/25" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function ForImplementationSection({
  locationId,
}: ForImplementationSectionProps) {
  const qc = useQueryClient();
  const { data: forImplNafs = [] } = useForImplementation(locationId);
  const { data: myTaskNafs = [] } = useMyImplementationTasks();
  const [tab, setTab] = useState<Tab>("unassigned");
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
  });

  const setToInProgress = useMutation({
    mutationFn: (implementationId: string) =>
      adminApi.setToInProgress(implementationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "my-implementation-tasks"] });
      toast.success("Set to In Progress");
    },
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
  });

  const setToAccomplished = useMutation({
    mutationFn: (implementationId: string) =>
      adminApi.setToAccomplished(implementationId),
    onSuccess: () => {
      invalidate();
      toast.success("Marked as Accomplished");
    },
  });

  const isSubmitting =
    assignToMe.isPending ||
    setToInProgress.isPending ||
    setToDelayed.isPending ||
    setToAccomplished.isPending;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "unassigned", label: "Unassigned", count: unassigned.length },
    { key: "mine", label: "My Tasks", count: myTasks.length },
  ];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold leading-none">
              For Implementation
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Claim and manage implementation tasks
            </p>
          </div>
        </div>
        {total > 0 && (
          <span className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 px-2.5 py-0.5 text-xs font-medium tabular-nums">
            {total}
          </span>
        )}
      </div>

      <div className="flex gap-1 px-5 pt-3 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-2.5 px-1 text-xs font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            <span className="ml-1.5 tabular-nums text-[11px] opacity-70">
              ({t.count})
            </span>
          </button>
        ))}
      </div>

      <div className="p-4 space-y-2">
        {tab === "unassigned" ? (
          unassigned.length === 0 ? (
            <EmptyState message="No unassigned implementation requests." />
          ) : (
            unassigned.map(({ nafReference, employeeName, rr }) => (
              <ActionCard
                key={rr.id}
                employeeName={employeeName}
                resourceName={rr.resource.name}
                nafReference={nafReference}
                dateNeeded={rr.dateNeeded}
                accent="amber"
                actions={
                  <Button
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    disabled={isSubmitting}
                    onClick={() => assignToMe.mutate(rr.id)}
                  >
                    Start Implementation
                  </Button>
                }
              />
            ))
          )
        ) : myTasks.length === 0 ? (
          <EmptyState message="No implementation tasks assigned to you." />
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
                accent="blue"
                badge={<ImplStatusBadge status={status} />}
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
