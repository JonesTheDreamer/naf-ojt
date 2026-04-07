import { ProgressStatus } from "@/types/api/naf";
import { cn } from "@/lib/utils";

export const PROGRESS_CONFIG: Record<
  ProgressStatus,
  { label: string; className: string }
> = {
  [ProgressStatus.Open]: {
    label: "Open",
    className: "text-amber-500 bg-amber-50 border-amber-200",
  },
  [ProgressStatus["In Progress"]]: {
    label: "In Progress",
    className: "text-blue-600 bg-blue-50 border-blue-200",
  },
  [ProgressStatus.Rejected]: {
    label: "Rejected",
    className: "text-red-500 bg-red-50 border-red-200",
  },
  [ProgressStatus["For Screening"]]: {
    label: "For Screening",
    className: "text-teal-600 bg-teal-50 border-teal-200",
  },
  [ProgressStatus.Accomplished]: {
    label: "Accomplished",
    className: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  [ProgressStatus["Not Accomplished"]]: {
    label: "Not Accomplished",
    className: "text-gray-500 bg-gray-50 border-gray-200",
  },
};

export function ProgressBadge({
  progress,
  className,
}: {
  progress: ProgressStatus;
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
