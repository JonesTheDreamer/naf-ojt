import { useState } from "react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useMyTasks } from "../hooks/useMyTasks";
import { ImplementationViewToggle } from "../components/ImplementationViewToggle";
import { ImplementationNAFAccordion } from "../components/ImplementationNAFAccordion";
import { ImplementationResourceAccordion } from "../components/ImplementationResourceAccordion";

export default function MyTasksPage() {
  const [viewMode, setViewMode] = useState<"per-naf" | "per-resource">("per-naf");
  const { myTasksQuery, setToDelayedMutation, setToAccomplishedMutation } =
    useMyTasks();

  const nafs = myTasksQuery.data ?? [];

  const handleMarkDelayed = (implementationId: string, reason: string) => {
    setToDelayedMutation.mutate({ implementationId, reason });
  };

  const handleMarkAccomplished = (implementationId: string) => {
    setToAccomplishedMutation.mutate(implementationId);
  };

  const isSubmitting =
    setToDelayedMutation.isPending || setToAccomplishedMutation.isPending;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-amber-500">My Tasks</h1>
        <ImplementationViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {myTasksQuery.isLoading && (
        <p className="text-muted-foreground">Loading...</p>
      )}

      {!myTasksQuery.isLoading && nafs.length === 0 && (
        <p className="text-muted-foreground">No tasks assigned to you.</p>
      )}

      {viewMode === "per-naf" ? (
        <ImplementationNAFAccordion
          nafs={nafs}
          mode="my-tasks"
          onMarkDelayed={handleMarkDelayed}
          onMarkAccomplished={handleMarkAccomplished}
          isSubmitting={isSubmitting}
        />
      ) : (
        <ImplementationResourceAccordion
          nafs={nafs}
          mode="my-tasks"
          onMarkDelayed={handleMarkDelayed}
          onMarkAccomplished={handleMarkAccomplished}
          isSubmitting={isSubmitting}
        />
      )}
    </AdminLayout>
  );
}
