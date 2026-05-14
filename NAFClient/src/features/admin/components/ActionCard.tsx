import { User, Calendar } from "lucide-react";

interface ActionCardProps {
  employeeName: string;
  resourceName: string;
  nafReference: string;
  dateNeeded?: string | null;
  badge?: React.ReactNode;
  actions: React.ReactNode;
  accent?: "amber" | "blue";
}

export function ActionCard({
  employeeName,
  resourceName,
  nafReference,
  dateNeeded,
  badge,
  actions,
  accent = "amber",
}: ActionCardProps) {
  const accentBorder =
    accent === "amber" ? "border-l-amber-500" : "border-l-blue-500";

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-lg border border-border border-l-4 ${accentBorder} bg-card px-4 py-3 shadow-sm transition-shadow hover:shadow-md`}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-semibold text-foreground">
              {employeeName}
            </span>
          </div>
          {badge}
        </div>
        <p className="text-sm text-foreground/80">{resourceName}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
            {nafReference}
          </span>
          {dateNeeded && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(dateNeeded).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">{actions}</div>
    </div>
  );
}
