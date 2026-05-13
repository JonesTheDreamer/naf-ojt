import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDepartmentMutations } from "../hooks/useDepartments";
import { useDepartmentEmployees } from "../hooks/useDepartmentEmployees";
import type { DepartmentEmployeeDTO } from "../types";

interface Props {
  departmentId: number;
}

export function ChangeDepartmentHeadDialog({ departmentId }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<DepartmentEmployeeDTO | null>(null);
  const [error, setError] = useState("");

  const { changeHeadMutation } = useDepartmentMutations();
  const { data: employees = [], isLoading } = useDepartmentEmployees(departmentId);

  const reset = () => {
    setSelected(null);
    setError("");
  };

  const handleSave = async () => {
    if (!selected) {
      setError("Please select an employee.");
      return;
    }
    setError("");
    try {
      await changeHeadMutation.mutateAsync({ id: departmentId, employeeId: selected.employeeId });
      reset();
      setOpen(false);
    } catch {
      setError("Failed to change department head.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Change Department Head</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Department Head</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          <p className="text-sm text-muted-foreground">Select a department employee to be the new department head.</p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading employees…</p>
          ) : employees.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employees assigned to this department.</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto rounded-md border">
              {employees.map((emp) => (
                <button
                  key={emp.employeeId}
                  type="button"
                  onClick={() => setSelected(emp)}
                  className={`flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/60 ${
                    selected?.employeeId === emp.employeeId
                      ? "bg-amber-50 border-l-2 border-amber-500"
                      : "border-l-2 border-transparent"
                  }`}
                >
                  <span className="font-medium">
                    {emp.firstName} {emp.middleName ? `${emp.middleName} ` : ""}{emp.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground">{emp.position}</span>
                </button>
              ))}
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { reset(); setOpen(false); }}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!selected || changeHeadMutation.isPending}
              onClick={handleSave}
            >
              {changeHeadMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
