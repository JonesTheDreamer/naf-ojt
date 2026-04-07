"use client";

import type { NAF, ResourceRequest } from "@/types/api/naf";
import { Progress } from "@/types/enum/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Clock } from "lucide-react";

const MAX_VISIBLE_REQUESTS = 2;

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
  [Progress[Progress.ACCOMPLISHED]]: {
    label: "Completed",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  [Progress[Progress.IN_PROGRESS]]: {
    label: "In Progress",
    icon: <Clock className="h-3.5 w-3.5" />,
    className: "text-blue-600 bg-blue-50 border-blue-200",
  },
};

function EmployeeCell({ row }: { row: NAF }) {
  const { firstName, lastName, middleName, position, location } = row.employee;

  const fullName = `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ""}`;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-semibold text-sm text-foreground">{fullName}</span>
      {position && (
        <span className="text-xs text-muted-foreground">{position},</span>
      )}
      <span className="text-xs text-muted-foreground">{location}</span>
    </div>
  );
}

function RequestBadges({ requests }: { requests: ResourceRequest[] }) {
  if (!requests || requests.length === 0)
    return <span className="text-muted-foreground text-sm">—</span>;

  const visible = requests.slice(0, MAX_VISIBLE_REQUESTS);
  const overflow = requests.length - MAX_VISIBLE_REQUESTS;

  return (
    <div className="flex flex-col gap-1">
      {visible.map((req) => (
        <span
          key={req.id}
          className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-medium w-fit min-w-[70px] text-center"
          style={{
            backgroundColor: `#${req.resource.color}` || "#93c5fd",
            color: getContrastColor(`#${req.resource.color}` || "#93c5fd"),
          }}
        >
          {req.resource.name}
        </span>
      ))}
      {overflow > 0 && (
        <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-medium w-fit min-w-[70px] bg-orange-100 text-orange-700 border border-orange-200">
          + {overflow} more...
        </span>
      )}
    </div>
  );
}

function StatusCell({
  progress,
  remainingCount,
}: {
  progress: string;
  remainingCount?: number;
}) {
  const config = STATUS_CONFIG[progress];

  if (!config) {
    return <span className="text-muted-foreground text-sm">{progress}</span>;
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <Badge
        variant="outline"
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
          config.className,
        )}
      >
        <span className="flex items-center">{config.icon}</span>
        {config.label}
      </Badge>
      {progress === Progress[Progress.IN_PROGRESS] &&
        remainingCount !== undefined && (
          <span className="text-[11px] text-muted-foreground pl-1">
            ({remainingCount} request{remainingCount !== 1 ? "s" : ""}{" "}
            remaining)
          </span>
        )}
    </div>
  );
}

function getContrastColor(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#374151" : "#ffffff";
}

export const columns: ColumnDef<NAF>[] = [
  {
    id: "employee",
    header: "Employee",
    size: 220,
    accessorFn: (r) =>
      `${r.employee.lastName}, ${r.employee.firstName} ${r.employee.middleName}`,
    cell: ({ row }) => <EmployeeCell row={row.original} />,
  },
  {
    accessorKey: "reference",
    header: "Reference",
    size: 180,
    cell: ({ getValue }) => (
      <span className="font-bold text-sm tracking-wide text-foreground">
        {getValue<string>()}
      </span>
    ),
  },
  {
    id: "requests",
    header: "Requests",
    size: 160,
    accessorFn: (r) => r.resourceRequests,
    cell: ({ getValue }) => {
      const rr = getValue<ResourceRequest[]>();
      return <RequestBadges requests={rr} />;
    },
  },
  {
    id: "status",
    header: "Status",
    size: 180,
    accessorFn: (r) => Progress[r.progress],
    cell: ({ row }) => {
      const progress = Progress[row.original.progress];
      const remaining = row.original.resourceRequests?.filter(
        (r) => r.progress !== Progress.ACCOMPLISHED,
      ).length;
      return (
        <StatusCell
          progress={progress}
          remainingCount={
            progress === Progress[Progress.IN_PROGRESS] ? remaining : undefined
          }
        />
      );
    },
  },
];
