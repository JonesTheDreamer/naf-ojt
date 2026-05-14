interface ActionCardProps {
  employeeName: string;
  resourceName: string;
  nafReference: string;
  dateNeeded?: string | null;
  badge?: React.ReactNode;
  actions: React.ReactNode;
}

export function ActionCard({
  employeeName,
  resourceName,
  nafReference,
  dateNeeded,
  badge,
  actions,
}: ActionCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{employeeName}</span>
          {badge}
        </div>
        <p className="text-sm text-muted-foreground">{resourceName}</p>
        <p className="text-xs text-muted-foreground">
          {nafReference}
          {dateNeeded &&
            ` · Needed by ${new Date(dateNeeded).toLocaleDateString()}`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">{actions}</div>
    </div>
  );
}
