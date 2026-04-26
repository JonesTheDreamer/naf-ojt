import { useState } from "react";
import { useForImplementations } from "../hooks/useForImplementations";
import { ImplementationViewToggle } from "../components/ImplementationViewToggle";
import { ImplementationNAFAccordion } from "../components/ImplementationNAFAccordion";
import { ImplementationResourceAccordion } from "../components/ImplementationResourceAccordion";
import AdminLayout from "@/shared/components/layout/AdminLayout";

export default function ForImplementationsPage() {
  const [viewMode, setViewMode] = useState<"per-naf" | "per-resource">(
    "per-naf",
  );
  const { forImplementationsQuery, assignToMeMutation } =
    useForImplementations();

  const nafs = forImplementationsQuery.data ?? [];

  const handleAssign = (requestId: string) => {
    assignToMeMutation.mutate(requestId);
  };

  const handleAssignAll = (requestIds: string[]) => {
    for (const id of requestIds) {
      assignToMeMutation.mutate(id);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-amber-500">
          For Implementations
        </h1>
        <ImplementationViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {forImplementationsQuery.isLoading && (
        <p className="text-muted-foreground">Loading...</p>
      )}

      {!forImplementationsQuery.isLoading && nafs.length === 0 && (
        <p className="text-muted-foreground">No items for implementation.</p>
      )}

      {viewMode === "per-naf" ? (
        <ImplementationNAFAccordion
          nafs={nafs}
          mode="for-implementations"
          onAssign={handleAssign}
          onAssignAll={handleAssignAll}
          isSubmitting={assignToMeMutation.isPending}
        />
      ) : (
        <ImplementationResourceAccordion
          nafs={nafs}
          mode="for-implementations"
          onAssign={handleAssign}
          onAssignAll={handleAssignAll}
          isSubmitting={assignToMeMutation.isPending}
        />
      )}
    </AdminLayout>
  );
}
