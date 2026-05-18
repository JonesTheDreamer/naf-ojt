import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, AlertTriangle, Users } from "lucide-react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useAuth } from "@/features/auth/AuthContext";
import { useAdminLocations } from "../hooks/useAdminLocations";
import { useAdminDashboardStats } from "../hooks/useAdminDashboardStats";
import { useAdminDashboardAverageTime } from "../hooks/useAdminDashboardAverageTime";
import { Progress } from "@/shared/types/enum/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_SITES_VALUE = "__all__";

const STATUS_TABS = [
  { label: "Open", value: Progress.OPEN, key: "OPEN" },
  { label: "In Progress", value: Progress.IN_PROGRESS, key: "IN_PROGRESS" },
  { label: "For Screening", value: Progress.FOR_SCREENING, key: "FOR_SCREENING" },
  { label: "Implementation", value: Progress.IMPLEMENTATION, key: "IMPLEMENTATION" },
  { label: "Accomplished", value: Progress.ACCOMPLISHED, key: "ACCOMPLISHED" },
  { label: "Rejected", value: Progress.REJECTED, key: "REJECTED" },
  { label: "Cancelled", value: Progress.CANCELLED, key: "CANCELLED" },
  { label: "Deactivated", value: Progress.DEACTIVATED, key: "DEACTIVATED" },
] as const;

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

  const formatDays = (days: number | null | undefined) => {
    if (days == null) return "N/A";
    return `${days.toFixed(1)}d`;
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-amber-500">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Welcome, {user?.name}.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="shrink-0">Site:</span>
            <Select value={selectValue} onValueChange={handleLocationChange}>
              <SelectTrigger className="w-48 h-8 text-sm">
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

        {/* Stat cards row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Beyond Deadline */}
          <button
            onClick={() => navigate("/admin/resource-requests")}
            className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-5 text-left hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
          >
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Beyond Deadline</span>
            </div>
            <p className="text-4xl font-bold text-red-600 dark:text-red-400">
              {statsQuery.isLoading ? "..." : (stats?.beyondDeadlineCount ?? 0)}
            </p>
            <p className="text-xs text-red-500/70 mt-1">
              active requests past date needed · click to view
            </p>
          </button>

          {/* Resource Access Counts */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">
                Employee Access by Resource
              </span>
            </div>
            {statsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : !stats?.resourceAccessCounts.length ? (
              <p className="text-sm text-muted-foreground">
                No accomplished requests yet.
              </p>
            ) : (
              <div className="space-y-2">
                {stats.resourceAccessCounts.map((item) => (
                  <div
                    key={item.resourceId}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{item.resourceName}</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Average Time Card */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Average Time to Accomplish
            </span>
          </div>
          {avgTimeQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !avgTime?.sampleCount ? (
            <p className="text-sm text-muted-foreground">
              No accomplished requests yet.
            </p>
          ) : (
            <>
              <p className="text-4xl font-bold text-amber-500 mb-1">
                {formatDays(avgTime.overallAvgDays)}
              </p>
              <p className="text-xs text-muted-foreground mb-5">
                Based on {avgTime.sampleCount} accomplished requests · refreshes
                every 8 hours
              </p>
              <div className="space-y-0">
                {[
                  {
                    label: "Open → First Approval Action",
                    value: avgTime.openToApprovalAvgDays,
                  },
                  {
                    label: "Approval → Screening / Implementation",
                    value: avgTime.approvalToScreeningAvgDays,
                  },
                  {
                    label: "Screening → Implementation Start",
                    value: avgTime.screeningToImplementationAvgDays,
                  },
                  {
                    label: "Implementation → Accomplished",
                    value: avgTime.implementationToAccomplishedAvgDays,
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {label}
                    </span>
                    <span className="text-sm font-medium tabular-nums">
                      {formatDays(value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recent Requests by Status */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">Recent Requests by Status</h2>
          </div>

          <div className="flex gap-1.5 flex-wrap px-5 py-3 border-b border-border">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveStatus(tab.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeStatus === tab.value
                    ? "bg-amber-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {statsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Loading...
              </p>
            ) : activeRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No recent requests.
              </p>
            ) : (
              <div className="space-y-1">
                {activeRequests.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => navigate(`/admin/NAF/${req.nafId}`)}
                    className="w-full flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="flex-1 text-sm font-medium truncate">
                      {req.employeeName}
                    </span>
                    <span className="text-sm text-muted-foreground truncate max-w-[140px]">
                      {req.resourceName}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDate(req.dateNeeded)}
                    </span>
                    <span className="text-xs font-mono font-bold shrink-0">
                      {req.nafReference}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
