import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Pencil, Trash2, Plus, Check, X, Clock } from "lucide-react";
import { adminApi } from "@/features/admin/api";
import {
  useResourceAllowancesByResource,
  useCreateAllowance,
  useUpdateAllowance,
  useDeleteAllowance,
} from "@/features/admin/hooks/useResourceAllowance";
import type { ResourceRequestAllowance } from "@/shared/types/api/resourceRequestAllowance";

interface ResourceAllowanceSectionProps {
  resourceId: number;
}

export function ResourceAllowanceSection({
  resourceId,
}: ResourceAllowanceSectionProps) {
  const { data: allowances = [], isLoading: loadingAllowances } =
    useResourceAllowancesByResource(resourceId);
  const locationsQuery = useQuery({
    queryKey: ["admin", "admin-locations"],
    queryFn: adminApi.getAdminLocations,
  });

  const createMutation = useCreateAllowance();
  const updateMutation = useUpdateAllowance();
  const deleteMutation = useDeleteAllowance();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDays, setEditDays] = useState(0);
  const [addingLocationId, setAddingLocationId] = useState<number | null>(null);
  const [addDays, setAddDays] = useState(1);

  const isLoading = loadingAllowances || locationsQuery.isLoading;
  const locations = locationsQuery.data ?? [];
  const allowanceByLocation = new Map<number, ResourceRequestAllowance>(
    allowances.map((a) => [a.locationId, a]),
  );

  const commitAdd = (locationId: number) => {
    createMutation.mutate(
      { resourceId, locationId, allowanceDays: addDays },
      {
        onSuccess: () => {
          setAddingLocationId(null);
          setAddDays(1);
        },
      },
    );
  };

  const commitEdit = (id: number) => {
    updateMutation.mutate(
      { id, dto: { allowanceDays: editDays } },
      { onSuccess: () => setEditingId(null) },
    );
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Request Lead Time
        </h2>
        <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
          <Clock className="h-3 w-3" />
          <span>min. days before date needed</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-11 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : locations.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No locations configured.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {locations.map((loc) => {
              const existing = allowanceByLocation.get(loc.id);
              const isEditing = existing ? editingId === existing.id : false;
              const isAdding = !existing && addingLocationId === loc.id;

              return (
                <div
                  key={loc.id}
                  className="group flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors min-h-[44px]"
                >
                  {/* Location name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                    <span className="text-sm font-medium truncate">{loc.name}</span>
                  </div>

                  {/* Right side: value + actions */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-4">
                    {existing ? (
                      isEditing ? (
                        <>
                          <input
                            type="number"
                            min={0}
                            className="w-14 rounded-md border border-amber-300 bg-amber-50/60 px-2 py-1 text-sm text-right font-semibold text-amber-800 focus:outline-none focus:ring-1 focus:ring-amber-400"
                            value={editDays}
                            onChange={(e) => setEditDays(+e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit(existing.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                          />
                          <span className="text-xs text-muted-foreground">days</span>
                          <button
                            onClick={() => commitEdit(existing.id)}
                            disabled={updateMutation.isPending}
                            className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 transition-colors"
                            title="Save"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-bold tabular-nums text-amber-600 min-w-[2ch] text-right">
                            {existing.allowanceDays}
                          </span>
                          <span className="text-xs text-muted-foreground mr-1">days</span>
                          <button
                            onClick={() => {
                              setEditingId(existing.id);
                              setEditDays(existing.allowanceDays);
                            }}
                            className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                            title="Edit"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(existing.id)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all"
                            title="Remove"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )
                    ) : isAdding ? (
                      <>
                        <input
                          type="number"
                          min={0}
                          className="w-14 rounded-md border border-amber-300 bg-amber-50/60 px-2 py-1 text-sm text-right font-semibold text-amber-800 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          value={addDays}
                          onChange={(e) => setAddDays(+e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitAdd(loc.id);
                            if (e.key === "Escape") {
                              setAddingLocationId(null);
                              setAddDays(1);
                            }
                          }}
                          autoFocus
                        />
                        <span className="text-xs text-muted-foreground">days</span>
                        <button
                          onClick={() => commitAdd(loc.id)}
                          disabled={createMutation.isPending}
                          className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 transition-colors"
                          title="Save"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setAddingLocationId(null);
                            setAddDays(1);
                          }}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-muted-foreground/40 italic mr-1">
                          not set
                        </span>
                        <button
                          onClick={() => {
                            setAddingLocationId(loc.id);
                            setAddDays(1);
                          }}
                          className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-amber-50 text-muted-foreground/50 hover:text-amber-600 transition-all"
                          title="Set allowance"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
