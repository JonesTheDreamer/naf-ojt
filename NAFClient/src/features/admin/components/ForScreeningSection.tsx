import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { claimScreeningStep } from "@/features/naf/api";
import { ActionCard } from "./ActionCard";
import { useForScreening } from "../hooks/useForScreening";

interface ForScreeningSectionProps {
  locationId: number | null;
  currentEmployeeId: string;
}

export function ForScreeningSection({
  locationId,
  currentEmployeeId,
}: ForScreeningSectionProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data = [], isLoading } = useForScreening(locationId);

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

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-base font-semibold">
        For Screening
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          · {isLoading ? "…" : total}
        </span>
      </h2>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Unassigned
        </p>
        {unassigned.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No unassigned screening requests.
          </p>
        ) : (
          unassigned.map((item) => (
            <ActionCard
              key={item.resourceRequestId}
              employeeName={item.employeeName}
              resourceName={item.resourceName}
              nafReference={item.nafReference}
              dateNeeded={item.dateNeeded}
              actions={
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={claim.isPending}
                  onClick={() => claim.mutate(item.currentStepId)}
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
            No screening tasks assigned to you.
          </p>
        ) : (
          myTasks.map((item) => (
            <ActionCard
              key={item.resourceRequestId}
              employeeName={item.employeeName}
              resourceName={item.resourceName}
              nafReference={item.nafReference}
              dateNeeded={item.dateNeeded}
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
      </div>
    </div>
  );
}
