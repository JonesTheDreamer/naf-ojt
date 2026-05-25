import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useCreateAllowance,
  useDeleteAllowance,
  useResourceAllowances,
  useToggleLocationWeekend,
  useUpdateAllowance,
} from "../hooks/useResourceAllowance";
import { adminApi } from "../api";
import { Button } from "@/components/ui/button";
import type { CreateResourceRequestAllowanceDTO } from "@/shared/types/api/resourceRequestAllowance";

export function ResourceAllowanceManager() {
  const { data: allowances = [], isLoading } = useResourceAllowances();
  const locationsQuery = useQuery({
    queryKey: ["admin", "admin-locations"],
    queryFn: adminApi.getAdminLocations,
  });
  const createMutation = useCreateAllowance();
  const updateMutation = useUpdateAllowance();
  const deleteMutation = useDeleteAllowance();
  const toggleWeekendMutation = useToggleLocationWeekend();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDays, setEditDays] = useState(0);

  const [form, setForm] = useState<CreateResourceRequestAllowanceDTO>({
    resourceId: 0,
    locationId: 0,
    allowanceDays: 0,
  });

  return (
    <div className="space-y-6">
      {/* Resource Request Allowances */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 to-amber-400" />
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Resource Request Allowances
          </h2>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            Minimum days before date needed per resource and location
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 rounded bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="text-left p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Location
                  </th>
                  <th className="text-left p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Min Days
                  </th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {allowances.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-4 text-center text-sm text-muted-foreground"
                    >
                      No allowances configured.
                    </td>
                  </tr>
                ) : (
                  allowances.map((a) => (
                    <tr key={a.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                      <td className="p-2 text-sm">{a.resourceName}</td>
                      <td className="p-2 text-sm">{a.locationName}</td>
                      <td className="p-2 text-sm font-medium tabular-nums">
                        {editingId === a.id ? (
                          <input
                            type="number"
                            className="border border-border rounded px-2 py-1 w-20 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                            value={editDays}
                            onChange={(e) => setEditDays(+e.target.value)}
                          />
                        ) : (
                          a.allowanceDays
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2 justify-end">
                          {editingId === a.id ? (
                            <>
                              <Button
                                size="sm"
                                disabled={updateMutation.isPending}
                                onClick={() => {
                                  updateMutation.mutate({ id: a.id, dto: { allowanceDays: editDays } });
                                  setEditingId(null);
                                }}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setEditingId(a.id); setEditDays(a.allowanceDays); }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate(a.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Create form */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Add Allowance
            </p>
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">
                  Resource ID
                </label>
                <input
                  type="number"
                  className="border border-border rounded-lg px-2 py-1.5 w-24 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                  value={form.resourceId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, resourceId: +e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">
                  Location ID
                </label>
                <input
                  type="number"
                  className="border border-border rounded-lg px-2 py-1.5 w-24 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                  value={form.locationId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, locationId: +e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">
                  Min Days
                </label>
                <input
                  type="number"
                  className="border border-border rounded-lg px-2 py-1.5 w-20 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                  value={form.allowanceDays}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, allowanceDays: +e.target.value }))
                  }
                />
              </div>
              <Button
                disabled={createMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600 text-white border-0"
                onClick={() => createMutation.mutate(form)}
              >
                {createMutation.isPending ? "Adding…" : "Add"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Location Weekend Toggle */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 to-amber-400" />
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Location Settings
          </h2>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            Toggle whether employees at each site can select weekend dates
          </p>
        </div>

        <div className="px-6 py-4">
          {locationsQuery.isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-10 rounded bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : !locationsQuery.data?.length ? (
            <p className="text-sm text-muted-foreground">No locations found.</p>
          ) : (
            <div className="divide-y divide-border">
              {locationsQuery.data.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{loc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Weekend dates:{" "}
                      <span
                        className={
                          loc.allowWeekendDateNeeded
                            ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                            : "text-muted-foreground"
                        }
                      >
                        {loc.allowWeekendDateNeeded ? "allowed" : "blocked"}
                      </span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={loc.allowWeekendDateNeeded ? "destructive" : "outline"}
                    disabled={toggleWeekendMutation.isPending}
                    onClick={() =>
                      toggleWeekendMutation.mutate({
                        id: loc.id,
                        allow: !loc.allowWeekendDateNeeded,
                      })
                    }
                  >
                    {loc.allowWeekendDateNeeded ? "Block weekends" : "Allow weekends"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
