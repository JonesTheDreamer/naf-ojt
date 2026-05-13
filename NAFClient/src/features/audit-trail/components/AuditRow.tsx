import { getEntityMeta } from "./entityConfig";
import type { AuditTrailDTO } from "../types";

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function convertDateTime(ts: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(ts));
}

interface AuditRowProps {
  entry: AuditTrailDTO;
}

export function AuditRow({ entry }: AuditRowProps) {
  const meta = getEntityMeta(entry.entity);

  return (
    <div className="flex items-start gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
      <div
        className={`mt-0.5 flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${meta.pill}`}
      >
        {meta.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">{entry.activity}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatTimestamp(entry.timestamp)}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.pill}`}
        >
          {meta.icon}
          {meta.label}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {convertDateTime(entry.timestamp)}
        </span>
      </div>
    </div>
  );
}
