import type { ColumnDef } from "@tanstack/react-table";
import type { NAF, ResourceRequest } from "@/shared/types/api/naf";
import { Progress } from "@/shared/types/enum/progress";

function getContrastColor(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#374151" : "#ffffff";
}

export function getClosestDateNeeded(naf: NAF): string | undefined {
  const dates = naf.resourceRequests
    .filter(
      (rr) =>
        (rr.progress as unknown as Progress) === Progress.IMPLEMENTATION &&
        rr.dateNeeded,
    )
    .map((rr) => rr.dateNeeded!);
  if (!dates.length) return undefined;
  return dates.sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  )[0];
}

function EmployeeCell({ row }: { row: NAF }) {
  const { firstName, lastName, middleName, departmentDesc, departmentId } =
    row.employee;
  const fullName = `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ""}`;
  const dept = departmentDesc ?? departmentId;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-semibold text-sm text-foreground">{fullName}</span>
      {dept && <span className="text-xs text-muted-foreground">{dept}</span>}
    </div>
  );
}

function ImplementationRequestBadges({
  requests,
}: {
  requests: ResourceRequest[];
}) {
  const implRequests = requests.filter(
    (rr) => (rr.progress as unknown as Progress) === Progress.IMPLEMENTATION,
  );
  if (!implRequests.length)
    return <span className="text-muted-foreground text-sm">—</span>;

  const first = implRequests[0];
  const overflow = implRequests.length - 1;

  return (
    <div className="flex flex-col gap-1">
      <span
        className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-medium w-fit min-w-[70px] text-center"
        style={{
          backgroundColor: `#${first.resource.color}` || "#93c5fd",
          color: getContrastColor(`#${first.resource.color}` || "#93c5fd"),
        }}
      >
        {first.resource.name}
      </span>
      {overflow > 0 && (
        <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-medium w-fit bg-orange-100 text-orange-700 border border-orange-200">
          + {overflow} more...
        </span>
      )}
    </div>
  );
}

export const implementationColumns: ColumnDef<NAF>[] = [
  {
    id: "employee",
    header: "Employee",
    size: 220,
    cell: ({ row }) => <EmployeeCell row={row.original} />,
  },
  {
    id: "requests",
    header: "Requests",
    size: 160,
    cell: ({ row }) => (
      <ImplementationRequestBadges requests={row.original.resourceRequests} />
    ),
  },
  {
    id: "dateNeeded",
    header: "Date Needed",
    size: 160,
    cell: ({ row }) => {
      const date = getClosestDateNeeded(row.original);
      if (!date) return <span className="text-muted-foreground text-sm">—</span>;
      return (
        <span className="text-sm">
          {new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      );
    },
  },
];
