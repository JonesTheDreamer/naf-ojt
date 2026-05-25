import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchCheck, CheckCircle } from "lucide-react";
import { claimScreeningStep } from "@/features/naf/api";
import { ActionCard } from "./ActionCard";
import { useForScreening } from "../hooks/useForScreening";

interface ForScreeningSectionProps {
  locationId: number | null;
  currentEmployeeId: string;
}

type Tab = "unassigned" | "mine";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <CheckCircle className="w-8 h-8 text-muted-foreground/25" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function ForScreeningSection({
  locationId,
  currentEmployeeId,
}: ForScreeningSectionProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data = [], isLoading } = useForScreening(locationId);
  const [tab, setTab] = useState<Tab>("unassigned");

  const unassigned = data.filter((item) => item.stepClaimedBy === null);
  const myTasks = data.filter(
    (item) => item.stepClaimedBy === currentEmployeeId,
  );
  const total = unassigned.length + myTasks.length;

  const claim = useMutation({
    mutationFn: (stepId: string) => claimScreeningStep(stepId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin", "for-screening", locationId],
      });
      toast.success("Screening step claimed");
    },
    onError: () => toast.error("Failed to claim step"),
  });

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "unassigned", label: "Unassigned", count: unassigned.length },
    { key: "mine", label: "My Tasks", count: myTasks.length },
  ];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2 bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
            <SearchCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold leading-none">
              For Screening
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Claim and review screening steps
            </p>
          </div>
        </div>
        {!isLoading && total > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 px-2.5 py-0.5 text-xs font-medium tabular-nums">
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
                ? "border-amber-500 text-amber-600"
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
            <EmptyState message="No unassigned screening requests." />
          ) : (
            unassigned.map((item) => (
              <ActionCard
                key={item.resourceRequestId}
                employeeName={item.employeeName}
                resourceName={item.resourceName}
                nafReference={item.nafReference}
                dateNeeded={item.dateNeeded}
                accent="amber"
                actions={
                  <Button
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    disabled={claim.isPending}
                    onClick={() => claim.mutate(item.currentStepId)}
                  >
                    Start Screening
                  </Button>
                }
              />
            ))
          )
        ) : myTasks.length === 0 ? (
          <EmptyState message="No screening tasks assigned to you." />
        ) : (
          myTasks.map((item) => (
            <ActionCard
              key={item.resourceRequestId}
              employeeName={item.employeeName}
              resourceName={item.resourceName}
              nafReference={item.nafReference}
              dateNeeded={item.dateNeeded}
              accent="amber"
              actions={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/admin/NAF/${item.nafId}`)}
                >
                  View NAF
                </Button>
              }
            />
          ))
        )}

        {isLoading && (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-muted animate-pulse border-l-4 border-l-amber-200"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
