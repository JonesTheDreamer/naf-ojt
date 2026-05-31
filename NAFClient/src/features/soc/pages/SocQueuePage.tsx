import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { RoutesEnum } from "@/app/routesEnum";
import { toast } from "sonner";
import { ShieldCheck, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { claimSocStep } from "@/features/naf/api";
import { useForSocReview } from "../hooks/useForSocReview";
import { useAuth } from "@/features/auth";

type Tab = "unassigned" | "mine";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <CheckCircle className="w-8 h-8 text-muted-foreground/25" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default function SocQueuePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const currentEmployeeId = user?.employeeId ?? "";
  const { data = [], isLoading } = useForSocReview();
  const [tab, setTab] = useState<Tab>("unassigned");

  const unassigned = data.filter((item) => item.stepClaimedBy === null);
  const myTasks = data.filter(
    (item) => item.stepClaimedBy === currentEmployeeId,
  );
  const total = unassigned.length + myTasks.length;

  const claim = useMutation({
    mutationFn: (stepId: string) => claimSocStep(stepId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["soc", "for-soc-review"] });
      toast.success("SOC review step claimed");
    },
  });

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "unassigned", label: "Unassigned", count: unassigned.length },
    { key: "mine", label: "My Tasks", count: myTasks.length },
  ];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderItems = tab === "unassigned" ? unassigned : myTasks;
  const emptyMessage =
    tab === "unassigned"
      ? "No unassigned SOC review requests."
      : "No SOC review tasks assigned to you.";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">SOC Review Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Claim and review internet resource requests
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-blue-50 text-blue-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold leading-none">
                  For SOC Review
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Claim and review internet resource requests
                </p>
              </div>
            </div>
            {!isLoading && total > 0 && (
              <span className="rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium tabular-nums">
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
            {isLoading && (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-lg bg-muted animate-pulse border-l-4 border-l-blue-200"
                  />
                ))}
              </div>
            )}

            {!isLoading && renderItems.length === 0 && (
              <EmptyState message={emptyMessage} />
            )}

            {!isLoading &&
              renderItems.map((item) => (
                <div
                  key={item.resourceRequestId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/10 px-4 py-3 border-l-4 border-l-blue-300"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {item.employeeName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.resourceName} · {item.nafReference}
                    </p>
                    {item.dateNeeded && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Needed: {formatDate(item.dateNeeded)}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {tab === "unassigned" ? (
                      <Button
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        disabled={claim.isPending}
                        onClick={() => claim.mutate(item.currentStepId)}
                      >
                        Start Review
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(RoutesEnum.SOC_NAF_DETAIL.replace(":nafId", item.nafId))}
                      >
                        View NAF
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
