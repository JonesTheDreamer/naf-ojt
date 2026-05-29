import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useDepartmentDetail } from "../hooks/useDepartments";
import { useDepartmentEmployees } from "../hooks/useDepartmentEmployees";
import { DepartmentEmployeeTable } from "../components/DepartmentEmployeeTable";

function SkeletonPage() {
  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5 animate-pulse">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="h-40 rounded-xl bg-muted" />
        <div className="h-96 rounded-xl bg-muted" />
      </div>
    </AdminLayout>
  );
}

export default function DepartmentDetailPage() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const id = departmentId ?? "";
  const navigate = useNavigate();

  const { data: department, isLoading } = useDepartmentDetail(id);
  const employeesQuery = useDepartmentEmployees(id);
  const employees = employeesQuery.data ?? [];

  if (isLoading) return <SkeletonPage />;

  if (!department) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm text-muted-foreground">Department not found.</p>
          <button
            onClick={() => navigate("/admin/departments")}
            className="mt-3 text-xs text-amber-600 hover:underline"
          >
            ← Back to Departments
          </button>
        </div>
      </AdminLayout>
    );
  }

  const headInitial = department.departmentHead?.[0]?.toUpperCase() ?? "—";
  const codeWatermark = (department.id || "D")[0].toUpperCase();

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="px-6 pt-5 pb-0">
          <button
            onClick={() => navigate("/admin/departments")}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Departments
          </button>
        </div>

        {/* Header card */}
        <div className="mx-6 mt-4 rounded-xl border border-border bg-card overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300" />
          <div className="px-6 py-5 relative overflow-hidden">
            {/* Watermark */}
            <span
              aria-hidden
              className="pointer-events-none select-none absolute -right-2 -top-3 text-[7rem] font-black leading-none text-muted-foreground/[0.04]"
            >
              {codeWatermark}
            </span>

            <div className="flex items-start justify-between gap-4 relative">
              <div className="space-y-2 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700">
                  <Building2 className="h-3 w-3 shrink-0" />
                  <span className="text-[11px] font-mono font-bold tracking-widest">
                    {department.id}
                  </span>
                </div>
                <h1 className="text-xl font-bold tracking-tight leading-tight">
                  {department.departmentDesc || "—"}
                </h1>
              </div>

              {/* Employee count stat */}
              {!employeesQuery.isLoading && (
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-black tabular-nums text-amber-500 leading-tight">
                    {employees.length}
                  </p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                    Employees
                  </p>
                </div>
              )}
            </div>

            {/* Department head */}
            {department.departmentHead && (
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 text-xs font-bold shrink-0">
                  {headInitial}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                    Department Head
                  </p>
                  <p className="text-sm font-semibold leading-tight">
                    {department.departmentHead}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Employee table */}
        <div className="mx-6 mt-6 pb-8">
          <DepartmentEmployeeTable
            employees={employees}
            isLoading={employeesQuery.isLoading}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
