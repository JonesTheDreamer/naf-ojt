import { ProgressStatus } from "@/types/api/naf";
import { cn } from "@/lib/utils";
import { Progress } from "@/types/enum/progress";

export const PROGRESS_CONFIG: Record<
  Progress,
  { label: string; className: string }
> = {
  [Progress.OPEN]: {
    label: "Open",
    className: "text-amber-500 bg-amber-50 border-amber-200",
  },
  [Progress.IN_PROGRESS]: {
    label: "In Progress",
    className: "text-blue-600 bg-blue-50 border-blue-200",
  },
  [Progress.REJECTED]: {
    label: "Rejected",
    className: "text-red-500 bg-red-50 border-red-200",
  },
  [Progress.IMPLEMENTATION]: {
    label: "Implementation",
    className: "text-teal-600 bg-teal-50 border-teal-200",
  },
  [Progress.ACCOMPLISHED]: {
    label: "Accomplished",
    className: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  [Progress.NOT_ACCOMPLISHED]: {
    label: "Not Accomplished",
    className: "text-gray-500 bg-gray-50 border-gray-200",
  },
};

export function ProgressBadge({
  progress,
  className,
}: {
  progress: Progress;
  className?: string;
}) {
  const config = PROGRESS_CONFIG[progress] ?? {
    label: String(progress),
    className: "text-gray-500 bg-gray-50 border-gray-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
