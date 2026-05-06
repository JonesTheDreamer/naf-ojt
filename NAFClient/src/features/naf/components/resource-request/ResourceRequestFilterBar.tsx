import { cn } from "@/shared/utils/utils";
import { Progress } from "@/shared/types/enum/progress";
import { PROGRESS_CONFIG } from "../progressBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
  Progress.NOT_ACCOMPLISHED,
  // Progress.DEACTIVATED,
];

export function ResourceRequestFilterBar({
  selected,
  showInactive,
  onChange,
  onToggleInactive,
}: ResourceRequestFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mb-3">
      <button
        onClick={() => onChange("all")}
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors",
          selected === "all"
            ? "bg-gray-800 border-gray-800 text-white"
            : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100",
        )}
      >
        All
      </button>

      {FILTER_ORDER.map((p) => {
        const cfg = PROGRESS_CONFIG[p];
        const active = selected === p;
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors",
              active
                ? cfg.className
                : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600",
            )}
          >
            {cfg.label}
          </button>
        );
      })}

      {selected === "all" && (
        <label className="flex items-center gap-1.5 ml-1 cursor-pointer select-none">
          <Checkbox
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={(val) => onToggleInactive(val === true)}
          />
          <Label
            htmlFor="show-inactive"
            className="text-xs text-muted-foreground font-normal cursor-pointer"
          >
            Show cancelled / deactivated
          </Label>
        </label>
      )}
    </div>
  );
}
