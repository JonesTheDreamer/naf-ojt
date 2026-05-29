import { useQuery } from "@tanstack/react-query";
import { useToggleLocationWeekend } from "../hooks/useResourceAllowance";
import { adminApi } from "../api";
import { Button } from "@/components/ui/button";

export function ResourceAllowanceManager() {
  const locationsQuery = useQuery({
    queryKey: ["admin", "admin-locations"],
    queryFn: adminApi.getAdminLocations,
  });
  const toggleWeekendMutation = useToggleLocationWeekend();

  return (
    <div className="space-y-6">
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
