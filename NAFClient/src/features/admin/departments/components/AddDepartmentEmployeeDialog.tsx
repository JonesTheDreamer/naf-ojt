import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { searchEmployees } from "@/shared/api/employeeService";
import type { Employee } from "@/shared/types/api/employee";
import { useDepartmentEmployeeMutations } from "../hooks/useDepartmentEmployees";

interface Props {
  departmentId: number;
}

export function AddDepartmentEmployeeDialog({ departmentId }: Props) {
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const [lookup, setLookup] = useState<{
    state: "idle" | "loading" | "found" | "not_found";
    employee: Employee | null;
  }>({ state: "idle", employee: null });

  const { addMutation } = useDepartmentEmployeeMutations(departmentId);

  useEffect(() => {
    if (!employeeId.trim()) {
      setLookup({ state: "idle", employee: null });
      return;
    }
    const timer = setTimeout(async () => {
      setLookup({ state: "loading", employee: null });
      try {
        const results = await searchEmployees(employeeId.trim());
        const match = results.find((e) => e.id === employeeId.trim());
        setLookup(
          match
            ? { state: "found", employee: match }
            : { state: "not_found", employee: null },
        );
      } catch {
        setLookup({ state: "not_found", employee: null });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [employeeId]);

  const reset = () => {
    setEmployeeId("");
    setError("");
    setLookup({ state: "idle", employee: null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (lookup.state !== "found") {
      setError("Employee not found. Enter a valid employee ID.");
      return;
    }
    try {
      await addMutation.mutateAsync(employeeId);
      reset();
      setOpen(false);
    } catch {
      setError("Failed to add employee. They may already be in this department.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm">Add Employee</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Employee to Department</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-1">
            <Label>Employee ID</Label>
            <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="e.g. EMP001" required />
            {lookup.state === "loading" && <p className="text-xs text-muted-foreground">Looking up employee…</p>}
            {lookup.state === "found" && lookup.employee && (
              <p className="text-xs text-green-700">
                {lookup.employee.firstName} {lookup.employee.lastName} · {lookup.employee.position}
              </p>
            )}
            {lookup.state === "not_found" && <p className="text-xs text-red-500">Employee not found</p>}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={addMutation.isPending} className="w-full">
            {addMutation.isPending ? "Adding…" : "Add Employee"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
