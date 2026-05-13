import { Users } from "lucide-react";
import type { SharedFolderAccessEntryDTO } from "../types";

const PROGRESS_TABS = [
  { value: "all", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "FOR_SCREENING", label: "For Screening" },
  { value: "ACCOMPLISHED", label: "Accomplished" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

function progressBadgeClass(progress: string) {
  switch (progress) {
    case "ACCOMPLISHED": return "bg-green-100 text-green-800 border border-green-200";
    case "REJECTED": return "bg-red-100 text-red-700 border border-red-200";
    case "IN_PROGRESS": return "bg-amber-100 text-amber-800 border border-amber-200";
    case "FOR_SCREENING": return "bg-blue-100 text-blue-800 border border-blue-200";
    case "CANCELLED": return "bg-gray-100 text-gray-500 border border-gray-200";
    default: return "bg-slate-100 text-slate-600 border border-slate-200";
  }
}

function progressLabel(progress: string) {
  return progress.replace(/_/g, " ");
}

interface SharedFolderAccessListProps {
  entries: SharedFolderAccessEntryDTO[];
  isLoading: boolean;
  activeProgress: string;
  onProgressChange: (value: string) => void;
  totalCount: number;
}

export function SharedFolderAccessList({
  entries,
  isLoading,
  activeProgress,
  onProgressChange,
  totalCount,
}: SharedFolderAccessListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Employees with Access{" "}
          {!isLoading && (
            <span className="text-sm font-normal text-muted-foreground">
              ({totalCount})
            </span>
          )}
        </h2>
      </div>

      <div className="flex gap-2 flex-wrap">
        {PROGRESS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onProgressChange(tab.value)}
            className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeProgress === tab.value
                ? "bg-amber-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <AccessListSkeleton />
        ) : entries.length === 0 ? (
          <AccessListEmpty />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Position</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Progress</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry, i) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{entry.employeeName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.position || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${progressBadgeClass(entry.progress)}`}>
                      {progressLabel(entry.progress)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(entry.dateRequested).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AccessListSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
          <div className="h-4 w-1/4 rounded bg-muted animate-pulse" />
          <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function AccessListEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
        <Users className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">No employees found</p>
    </div>
  );
}
