import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { DataTable } from "@/shared/components/ui/datatable";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/api";
import { useDepartments } from "../hooks/useDepartments";
import { AddDepartmentDialog } from "../components/AddDepartmentDialog";
import type { DepartmentDTO } from "../types";
import { RoutesEnum } from "@/app/routesEnum";

const columns: ColumnDef<DepartmentDTO>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  { accessorKey: "code", header: "Code" },
  { accessorKey: "location", header: "Location", cell: ({ row }) => row.original.location || "—" },
  {
    accessorKey: "departmentHeadId",
    header: "Department Head",
    cell: ({ row }) => row.original.departmentHeadId || "—",
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          row.original.isActive
            ? "bg-green-100 text-green-800 border border-green-200"
            : "bg-gray-100 text-gray-500 border border-gray-200"
        }`}
      >
        {row.original.isActive ? "Active" : "Inactive"}
      </span>
    ),
  },
];

export default function DepartmentListPage() {
  const navigate = useNavigate();
  const [locationId, setLocationId] = useState<number | undefined>(undefined);

  const locationsQuery = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: adminApi.getLocations,
  });

  const { data: departments = [], isLoading } = useDepartments(locationId);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-500">Department Management</h1>
          <AddDepartmentDialog locations={locationsQuery.data ?? []} />
        </div>

        <div className="flex items-center gap-3">
          <select
            className="border rounded px-3 py-2 text-sm max-w-xs"
            value={locationId ?? ""}
            onChange={(e) =>
              setLocationId(e.target.value ? Number(e.target.value) : undefined)
            }
          >
            <option value="">All Locations</option>
            {locationsQuery.data?.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <DataTable
          columns={columns}
          data={departments}
          isLoading={isLoading}
          onRowClick={(d) =>
            navigate(
              RoutesEnum.ADMIN_DEPARTMENT_DETAIL.replace(":departmentId", String(d.id)),
            )
          }
          emptyMessage="No departments found."
        />
      </div>
    </AdminLayout>
  );
}
