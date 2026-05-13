import { useState } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDepartmentDetail, useDepartmentMutations } from "../hooks/useDepartments";
import { useDepartmentEmployees } from "../hooks/useDepartmentEmployees";
import { ChangeDepartmentHeadDialog } from "../components/ChangeDepartmentHeadDialog";
import { AddDepartmentEmployeeDialog } from "../components/AddDepartmentEmployeeDialog";
import { DepartmentEmployeeTable } from "../components/DepartmentEmployeeTable";

export default function DepartmentDetailPage() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const id = Number(departmentId);

  const { data: department, isLoading } = useDepartmentDetail(id);
  const employeesQuery = useDepartmentEmployees(id);
  const { setInactiveMutation } = useDepartmentMutations();
  const [confirmInactive, setConfirmInactive] = useState(false);

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
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-amber-500">{department.name}</h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  department.isActive
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-gray-100 text-gray-500 border border-gray-200"
                }`}
              >
                {department.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Code: {department.code}</p>
            <p className="text-sm text-muted-foreground">Location: {department.location}</p>
            {department.departmentHeadName && (
              <p className="text-sm text-muted-foreground">
                Department Head: {department.departmentHeadName}
                {department.departmentHeadPosition ? ` · ${department.departmentHeadPosition}` : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ChangeDepartmentHeadDialog departmentId={id} />
            {department.isActive && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => setConfirmInactive(true)}
              >
                Set Inactive
              </Button>
            )}
          </div>
        </div>

        {/* Employees section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Employees</h2>
            <AddDepartmentEmployeeDialog departmentId={id} />
          </div>
          <DepartmentEmployeeTable
            departmentId={id}
            employees={employeesQuery.data ?? []}
          />
        </div>
      </div>

      {/* Set Inactive confirmation */}
      <Dialog open={confirmInactive} onOpenChange={setConfirmInactive}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Department Inactive</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to set <strong>{department.name}</strong> to inactive?
            Employee assignments will not be removed.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setConfirmInactive(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={setInactiveMutation.isPending}
              onClick={async () => {
                await setInactiveMutation.mutateAsync(id);
                setConfirmInactive(false);
              }}
            >
              {setInactiveMutation.isPending ? "Saving…" : "Set Inactive"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
