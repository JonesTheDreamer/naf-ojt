import type { ColumnDef } from "@tanstack/react-table";
import { ProgressBadge } from "@/features/naf/components/progressBadge";
import type { AdminResourceRequestDTO } from "../types";

export const resourceRequestColumns: ColumnDef<AdminResourceRequestDTO>[] = [
  {
    accessorKey: "employeeName",
    header: "Employee",
    size: 200,
    cell: ({ getValue }) => (
      <span className="font-semibold text-sm text-foreground">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "resourceName",
    header: "Resource",
    size: 160,
    cell: ({ getValue }) => (
      <span className="text-sm text-foreground">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "progress",
    header: "Progress",
    size: 160,
    cell: ({ getValue }) => <ProgressBadge progress={getValue<number>()} />,
  },
  {
    accessorKey: "dateNeeded",
    header: "Date Needed",
    size: 140,
    cell: ({ getValue }) => {
      const v = getValue<string | undefined>();
      if (!v) return <span className="text-muted-foreground text-sm">—</span>;
      return (
        <span className="text-sm">
          {new Date(v).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      );
    },
  },
  {
    accessorKey: "nafReference",
    header: "NAF Reference",
    size: 200,
    cell: ({ getValue }) => (
      <span className="font-bold text-sm tracking-wide text-foreground">
        {getValue<string>()}
      </span>
    ),
  },
];
