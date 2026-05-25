import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { DataTable } from "@/shared/components/ui/datatable";
import { useDepartments } from "../hooks/useDepartments";
import type { DepartmentViewDTO } from "../types";
import { RoutesEnum } from "@/app/routesEnum";

const columns: ColumnDef<DepartmentViewDTO>[] = [
  {
    accessorKey: "id",
    header: "Code",
    cell: ({ row }) => <span className="font-medium">{row.original.id}</span>,
  },
  {
    accessorKey: "departmentDesc",
    header: "Description",
    cell: ({ row }) => row.original.departmentDesc || "—",
  },
  {
    accessorKey: "departmentHead",
    header: "Department Head",
    cell: ({ row }) => row.original.departmentHead || "—",
  },
];

export default function DepartmentListPage() {
  const navigate = useNavigate();
  const { data: departments = [], isLoading } = useDepartments();

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-500">
            Department Management
          </h1>
        </div>

        <DataTable
          columns={columns}
          data={departments}
          isLoading={isLoading}
          onRowClick={(d) =>
            navigate(
              RoutesEnum.ADMIN_DEPARTMENT_DETAIL.replace(
                ":departmentId",
                d.id,
              ),
            )
          }
          emptyMessage="No departments found."
        />
      </div>
    </AdminLayout>
  );
}
