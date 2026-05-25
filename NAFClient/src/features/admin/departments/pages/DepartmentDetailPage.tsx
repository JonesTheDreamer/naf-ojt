import { useParams } from "react-router-dom";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useDepartmentDetail } from "../hooks/useDepartments";
import { useDepartmentEmployees } from "../hooks/useDepartmentEmployees";
import { DepartmentEmployeeTable } from "../components/DepartmentEmployeeTable";

export default function DepartmentDetailPage() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const id = departmentId ?? "";

  const { data: department, isLoading } = useDepartmentDetail(id);
  const employeesQuery = useDepartmentEmployees(id);

  if (isLoading || !department) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground">Loading…</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-amber-500">
            {department.departmentDesc || "—"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Code: {department.id}
          </p>
          <p className="text-sm text-muted-foreground">
            Department Head: {department.departmentHead || "—"}
          </p>
        </div>

        {/* Employees section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Employees</h2>
          <DepartmentEmployeeTable
            employees={employeesQuery.data ?? []}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
