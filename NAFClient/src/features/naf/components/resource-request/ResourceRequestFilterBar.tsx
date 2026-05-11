import { cn } from "@/shared/utils/utils";
import { Progress } from "@/shared/types/enum/progress";
import { PROGRESS_CONFIG } from "../progressBadge";

export type ProgressFilter = Progress | "all";

interface ResourceRequestFilterBarProps {
  selected: ProgressFilter;
  showInactive: boolean;
  onChange: (filter: ProgressFilter) => void;
  onToggleInactive: (checked: boolean) => void;
}

const FILTER_ORDER: Progress[] = [
  Progress.OPEN,
  Progress.IN_PROGRESS,
  Progress.FOR_SCREENING,
  Progress.IMPLEMENTATION,
  Progress.ACCOMPLISHED,
  Progress.REJECTED,
  Progress.CANCELLED,
];

export function ResourceRequestFilterBar({
  selected,
  showInactive,
  onChange,
  onToggleInactive,
}: ResourceRequestFilterBarProps) {
  return (
    <div className="space-y-2 mb-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => onChange("all")}
          className={cn(
            "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
            selected === "all"
              ? "bg-slate-800 border-slate-800 text-white"
              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700",
          )}
        >
          All
        </button>

        {FILTER_ORDER.map((p) => {
          const cfg = PROGRESS_CONFIG[p];
          const isActive = selected === p;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                isActive
                  ? cfg.className
                  : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600",
              )}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {selected === "all" && (
        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none group">
          <div
            onClick={() => onToggleInactive(!showInactive)}
            className={cn(
              "w-8 h-4 rounded-full transition-colors relative cursor-pointer",
              showInactive ? "bg-slate-700" : "bg-slate-200",
            )}
          >
            <div className={cn(
              "absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform",
              showInactive ? "translate-x-4" : "translate-x-0.5",
            )} />
          </div>
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            Show cancelled / deactivated
          </span>
        </label>
      )}
    </div>
  );
}
