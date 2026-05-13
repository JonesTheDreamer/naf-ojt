import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DepartmentEmployeeDTO } from "../types";
import { useDepartmentEmployeeMutations } from "../hooks/useDepartmentEmployees";
import { CreateNAFDialog } from "@/features/naf/components/createNAFDialog";
import { RoutesEnum } from "@/app/routesEnum";
import type { Employee } from "@/shared/types/api/employee";

interface Props {
  departmentId: number;
  employees: DepartmentEmployeeDTO[];
}

export function DepartmentEmployeeTable({ departmentId, employees }: Props) {
  const navigate = useNavigate();
  const { removeMutation } = useDepartmentEmployeeMutations(departmentId);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const toEmployee = (dto: DepartmentEmployeeDTO): Employee => ({
    id: dto.employeeId,
    firstName: dto.firstName,
    middleName: dto.middleName ?? undefined,
    lastName: dto.lastName,
    status: "Active",
    company: "",
    position: dto.position,
    location: "",
  });

  return (
    <>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Employee ID</th>
              <th className="px-4 py-3 text-left font-medium">Position</th>
              <th className="px-4 py-3 text-left font-medium">NAF Status</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No employees assigned to this department.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.employeeId} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    {emp.firstName} {emp.middleName ? `${emp.middleName} ` : ""}{emp.lastName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.employeeId}</td>
                  <td className="px-4 py-3">{emp.position}</td>
                  <td className="px-4 py-3">
                    {emp.nafId ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {emp.nafProgress ?? "—"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">No NAF</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {emp.nafId ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(
                              RoutesEnum.ADMIN_NAF_DETAIL.replace(":nafId", emp.nafId!),
                            )
                          }
                        >
                          View NAF
                        </Button>
                      ) : (
                        <CreateNAFDialog initialEmployee={toEmployee(emp)} />
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setConfirmRemove(emp.employeeId)}
                      >
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!confirmRemove} onOpenChange={(o) => { if (!o) setConfirmRemove(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Employee</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove this employee from the department?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={removeMutation.isPending}
              onClick={async () => {
                if (!confirmRemove) return;
                await removeMutation.mutateAsync(confirmRemove);
                setConfirmRemove(null);
              }}
            >
              {removeMutation.isPending ? "Removing…" : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
