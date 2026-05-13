import { Activity } from "lucide-react";
import { AuditRow } from "./AuditRow";
import type { AuditTrailDTO } from "../types";

interface AuditLogListProps {
  entries: AuditTrailDTO[];
  isLoading: boolean;
  hasActiveFilter: boolean;
}

export function AuditLogList({ entries, isLoading, hasActiveFilter }: AuditLogListProps) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      {isLoading ? (
        <AuditLogSkeleton />
      ) : entries.length === 0 ? (
        <AuditEmptyState hasActiveFilter={hasActiveFilter} />
      ) : (
        <div className="divide-y divide-border">
          {entries.map((entry) => (
            <AuditRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function AuditLogSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 px-5 py-4">
          <div className="mt-0.5 w-7 h-7 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
          </div>
          <div className="w-20 h-5 rounded-full bg-muted animate-pulse shrink-0" />
        </div>
      ))}
    </div>
  );
}

function AuditEmptyState({ hasActiveFilter }: { hasActiveFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
        <Activity className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">No audit entries found</p>
      {hasActiveFilter && (
        <p className="text-xs text-muted-foreground mt-1">
          Try adjusting your search or filters.
        </p>
      )}
    </div>
  );
}
