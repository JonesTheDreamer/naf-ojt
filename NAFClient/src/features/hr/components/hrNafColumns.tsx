import type { ColumnDef } from "@tanstack/react-table";
import type { HRNafDTO } from "../types";

export const hrNafColumns: ColumnDef<HRNafDTO>[] = [
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
    accessorKey: "department",
    header: "Department",
    size: 200,
    cell: ({ getValue }) => (
      <span className="text-sm text-foreground">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "dateCreated",
    header: "Date Created",
    size: 160,
    cell: ({ getValue }) => {
      const v = getValue<string>();
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
];
