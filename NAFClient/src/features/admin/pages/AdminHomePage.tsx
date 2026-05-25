import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  AlertTriangle,
  Users,
  Clock,
  ChevronRight,
  RefreshCw,
  Settings,
} from "lucide-react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useAuth } from "@/features/auth/AuthContext";
import { useAdminLocations } from "../hooks/useAdminLocations";
import { useAdminDashboardStats } from "../hooks/useAdminDashboardStats";
import { useAdminDashboardAverageTime } from "../hooks/useAdminDashboardAverageTime";
import { useRefreshCache } from "../hooks/useResourceAllowance";
import { ResourceAllowanceManager } from "../components/ResourceAllowanceManager";
import { Progress } from "@/shared/types/enum/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ALL_SITES_VALUE = "__all__";

const STATUS_TABS = [
  { label: "Open", value: Progress.OPEN, key: "OPEN" },
  { label: "In Progress", value: Progress.IN_PROGRESS, key: "IN_PROGRESS" },
  {
    label: "For Screening",
    value: Progress.FOR_SCREENING,
    key: "FOR_SCREENING",
  },
  {
    label: "Implementation",
    value: Progress.IMPLEMENTATION,
    key: "IMPLEMENTATION",
  },
  { label: "Accomplished", value: Progress.ACCOMPLISHED, key: "ACCOMPLISHED" },
  { label: "Rejected", value: Progress.REJECTED, key: "REJECTED" },
  { label: "Cancelled", value: Progress.CANCELLED, key: "CANCELLED" },
  { label: "Deactivated", value: Progress.DEACTIVATED, key: "DEACTIVATED" },
] as const;

const TAB_STYLES: Record<
  string,
  { active: string; inactive: string; accent: string }
> = {
  OPEN: {
    active: "bg-sky-500 text-white border-sky-500",
    inactive:
      "text-sky-600 bg-sky-50 border-sky-200 hover:bg-sky-100 dark:bg-sky-950/30 dark:border-sky-800 dark:text-sky-400 dark:hover:bg-sky-950/50",
    accent: "bg-sky-400",
  },
  IN_PROGRESS: {
    active: "bg-blue-500 text-white border-blue-500",
    inactive:
      "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/50",
    accent: "bg-blue-400",
  },
  FOR_SCREENING: {
    active: "bg-violet-500 text-white border-violet-500",
    inactive:
      "text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100 dark:bg-violet-950/30 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/50",
    accent: "bg-violet-400",
  },
  IMPLEMENTATION: {
    active: "bg-amber-500 text-white border-amber-500",
    inactive:
      "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/50",
    accent: "bg-amber-400",
  },
  ACCOMPLISHED: {
    active: "bg-emerald-500 text-white border-emerald-500",
    inactive:
      "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/50",
    accent: "bg-emerald-400",
  },
  REJECTED: {
    active: "bg-red-500 text-white border-red-500",
    inactive:
      "text-red-600 bg-red-50 border-red-200 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50",
    accent: "bg-red-400",
  },
  CANCELLED: {
    active: "bg-zinc-500 text-white border-zinc-500",
    inactive:
      "text-zinc-600 bg-zinc-100 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700",
    accent: "bg-zinc-400",
  },
  DEACTIVATED: {
    active: "bg-slate-400 text-white border-slate-400",
    inactive:
      "text-slate-500 bg-slate-100 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700",
    accent: "bg-slate-400",
  },
};

function CardHeader({
  icon,
  label,
  color = "amber",
}: {
  icon: React.ReactNode;
  label: string;
  color?: "amber" | "red";
}) {
  const barClass =
    color === "red" ? "from-red-500 to-red-400" : "from-amber-500 to-amber-400";
  const iconBg = color === "red" ? "bg-red-100 dark:bg-red-950/40" : "bg-muted";
  const textClass =
    color === "red"
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground";

  return (
    <>
      <div className={`h-0.5 w-full bg-gradient-to-r ${barClass}`} />
      <div className={`flex items-center gap-2 px-6 pt-5 pb-1 ${textClass}`}>
        <div className={`p-1.5 rounded-lg ${iconBg}`}>{icon}</div>
        <span className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
    </>
  );
}

function SkeletonBar({ widthClass = "w-3/4" }: { widthClass?: string }) {
  return (
    <div className={`h-3.5 rounded ${widthClass} bg-muted animate-pulse`} />
  );
}

export default function AdminHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [locationId, setLocationId] = useState<number | null>(
    user?.locationId ?? null,
  );
  const [activeStatus, setActiveStatus] = useState<Progress>(Progress.OPEN);

  const { locationsQuery } = useAdminLocations();
  const { query: statsQuery } = useAdminDashboardStats(locationId);
  const { query: avgTimeQuery } = useAdminDashboardAverageTime(locationId);
  const refreshCache = useRefreshCache();

  const stats = statsQuery.data;
  const avgTime = avgTimeQuery.data;

  const selectValue =
    locationId === null ? ALL_SITES_VALUE : String(locationId);

  const handleLocationChange = (value: string) => {
    setLocationId(value === ALL_SITES_VALUE ? null : Number(value));
  };

  const activeTab = STATUS_TABS.find((t) => t.value === activeStatus);
  const activeRequests = activeTab
    ? (stats?.recentByStatus[activeTab.key] ?? [])
    : [];

  const formatDuration = (minutes: number | null | undefined) => {
    if (minutes == null) return "N/A";
    const totalMinutes = Math.round(minutes);
    const d = Math.floor(totalMinutes / (60 * 24));
    const h = Math.floor((totalMinutes % (60 * 24)) / 60);
    const m = totalMinutes % 60;
    if (d > 0) return h > 0 ? `${d}d ${h}h` : `${d}d`;
    if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
    return `${m}m`;
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const phases = [
    { label: "Open → Approval", value: avgTime?.openToApprovalAvgMinutes },
    {
      label: "Approval → Screening",
      value: avgTime?.approvalToScreeningAvgMinutes,
    },
    {
      label: "Screening → Implementation",
      value: avgTime?.screeningToImplementationAvgMinutes,
    },
    {
      label: "Implementation → Accomplished",
      value: avgTime?.implementationToAccomplishedAvgMinutes,
    },
  ];
  const maxPhaseValue = Math.max(...phases.map((p) => p.value ?? 0), 0.01);

  const maxResourceCount = Math.max(
    ...(stats?.resourceAccessCounts.map((r) => r.count) ?? [0]),
    1,
  );

  const activeTabStyles = TAB_STYLES[activeTab?.key ?? "OPEN"];

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-amber-500 tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Welcome back,{" "}
              <span className="font-medium text-foreground">{user?.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              disabled={refreshCache.isPending}
              onClick={() => refreshCache.mutate()}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshCache.isPending ? "animate-spin" : ""}`}
              />
              {refreshCache.isPending ? "Refreshing…" : "Refresh Employee Cache"}
            </Button>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="shrink-0 text-xs">Site:</span>
              <Select value={selectValue} onValueChange={handleLocationChange}>
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_SITES_VALUE}>All Sites</SelectItem>
                  {locationsQuery.data?.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:items-start">
          {/* Beyond Deadline */}
          <button
            onClick={() => navigate("/admin/resource-requests")}
            className="group rounded-xl border border-red-200 dark:border-red-900 bg-card text-left overflow-hidden hover:border-red-300 dark:hover:border-red-800 hover:shadow-sm transition-all"
          >
            <CardHeader
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              label="Beyond Deadline"
              color="red"
            />
            <div className="px-6 pb-6 pt-4">
              <div className="flex items-end justify-between gap-2">
                <div>
                  {statsQuery.isLoading ? (
                    <div className="h-14 w-20 bg-muted rounded animate-pulse" />
                  ) : (
                    <p className="text-5xl font-black text-red-600 dark:text-red-400 tabular-nums leading-none">
                      {stats?.beyondDeadlineCount ?? 0}
                    </p>
                  )}
                  <p className="text-xs text-red-400/70 dark:text-red-500/60 mt-2">
                    active requests past date needed
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-red-400 dark:text-red-500 mb-0.5">
                  <span>View</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </button>

          {/* Resource Access Counts */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <CardHeader
              icon={<Users className="w-3.5 h-3.5" />}
              label="Employee Access by Resource"
            />
            <div className="px-6 pb-6 pt-4">
              {statsQuery.isLoading ? (
                <div className="space-y-3">
                  <SkeletonBar widthClass="w-full" />
                  <SkeletonBar widthClass="w-4/5" />
                  <SkeletonBar widthClass="w-3/5" />
                </div>
              ) : !stats?.resourceAccessCounts.length ? (
                <p className="text-sm text-muted-foreground py-1">
                  No accomplished requests yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.resourceAccessCounts.map((item) => (
                    <div key={item.resourceId} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground truncate">
                          {item.resourceName}
                        </span>
                        <span className="text-xs font-bold tabular-nums text-foreground shrink-0">
                          {item.count}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                          style={{
                            width: `${(item.count / maxResourceCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Average Time Card */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <CardHeader
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Average Time to Accomplish"
          />
          <div className="px-6 pb-6 pt-4">
            {avgTimeQuery.isLoading ? (
              <div className="space-y-3">
                <div className="h-12 w-28 bg-muted rounded animate-pulse" />
                <SkeletonBar widthClass="w-48" />
                <div className="space-y-2.5 mt-4">
                  {[1, 2, 3, 4].map((i) => (
                    <SkeletonBar key={i} widthClass="w-full" />
                  ))}
                </div>
              </div>
            ) : !avgTime?.sampleCount ? (
              <p className="text-sm text-muted-foreground py-1">
                No accomplished requests yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-5 items-start">
                {/* Overall stat */}
                <div className="lg:border-r lg:border-border lg:pr-5 pb-4 lg:pb-0 border-b lg:border-b-0 border-border">
                  <p className="text-5xl font-black text-amber-500 tabular-nums leading-none">
                    {formatDuration(avgTime.overallAvgMinutes)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    avg. from open
                    <br />
                    to accomplished
                  </p>
                  <p className="text-xs text-muted-foreground/50 mt-4 border-t border-border pt-3">
                    {avgTime.sampleCount} requests
                    <br />
                    cached every 8h
                  </p>
                </div>

                {/* Phase breakdown */}
                <div className="space-y-3">
                  {phases.map(({ label, value }) => {
                    const pct =
                      value != null ? (value / maxPhaseValue) * 100 : 0;
                    return (
                      <div key={label} className="space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-muted-foreground">
                            {label}
                          </span>
                          <span className="text-xs font-semibold tabular-nums text-foreground shrink-0">
                            {formatDuration(value)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                            style={{
                              width: value != null ? `${pct}%` : "0%",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Admin Settings */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 to-amber-400" />
          <div className="flex items-center gap-2 px-6 pt-5 pb-1 text-muted-foreground">
            <div className="p-1.5 rounded-lg bg-muted">
              <Settings className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider">
              Admin Settings
            </span>
          </div>
          <div className="px-6 pb-6 pt-4">
            <ResourceAllowanceManager />
          </div>
        </div>

        {/* Recent Requests by Status */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-border">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Requests by Status
            </h2>
          </div>

          <div className="flex gap-1.5 flex-wrap px-6 py-4 border-b border-border">
            {STATUS_TABS.map((tab) => {
              const styles = TAB_STYLES[tab.key];
              const isActive = activeStatus === tab.value;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveStatus(tab.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    isActive ? styles.active : styles.inactive
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="divide-y divide-border">
            {statsQuery.isLoading ? (
              <div className="px-6 py-5 space-y-3">
                {[1, 2, 3].map((i) => (
                  <SkeletonBar key={i} widthClass="w-full" />
                ))}
              </div>
            ) : activeRequests.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No recent requests.
              </div>
            ) : (
              activeRequests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => navigate(`/admin/NAF/${req.nafId}`)}
                  className="w-full flex items-center gap-3 px-6 py-4 hover:bg-muted/40 transition-colors text-left group"
                >
                  <div
                    className={`w-0.5 h-7 rounded-full shrink-0 ${activeTabStyles.accent}`}
                  />
                  <span className="flex-1 text-sm font-medium truncate">
                    {req.employeeName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[140px] hidden sm:block">
                    {req.resourceName}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 hidden md:block">
                    {formatDate(req.dateNeeded)}
                  </span>
                  <span className="text-xs font-mono font-semibold shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
                    {req.nafReference}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
