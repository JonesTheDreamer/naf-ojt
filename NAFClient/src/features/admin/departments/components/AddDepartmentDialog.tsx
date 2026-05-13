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
import type { LocationDTO } from "@/features/admin/types";
import { useDepartmentMutations } from "../hooks/useDepartments";

interface Props {
  locations: LocationDTO[];
}

export function AddDepartmentDialog({ locations }: Props) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState(0);
  const [headId, setHeadId] = useState("");
  const [error, setError] = useState("");

  const [headLookup, setHeadLookup] = useState<{
    state: "idle" | "loading" | "found" | "not_found";
    employee: Employee | null;
  }>({ state: "idle", employee: null });

  const { createMutation } = useDepartmentMutations();

  useEffect(() => {
    if (!headId.trim()) {
      setHeadLookup({ state: "idle", employee: null });
      return;
    }
    const timer = setTimeout(async () => {
      setHeadLookup({ state: "loading", employee: null });
      try {
        const results = await searchEmployees(headId.trim());
        const match = results.find((e) => e.id === headId.trim());
        setHeadLookup(
          match
            ? { state: "found", employee: match }
            : { state: "not_found", employee: null },
        );
      } catch {
        setHeadLookup({ state: "not_found", employee: null });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [headId]);

  const reset = () => {
    setCode("");
    setName("");
    setLocationId(0);
    setHeadId("");
    setError("");
    setHeadLookup({ state: "idle", employee: null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (headLookup.state !== "found") {
      setError("Department head not found. Enter a valid employee ID.");
      return;
    }
    if (!locationId) {
      setError("Please select a location.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        code,
        name,
        departmentHeadId: headId,
        locationId,
      });
      reset();
      setOpen(false);
    } catch {
      setError("Failed to create department. The code may already be in use.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm">Add Department</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Department</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-1">
            <Label>Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. IT" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Information Technology" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Location</Label>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={locationId}
              onChange={(e) => setLocationId(Number(e.target.value))}
              required
            >
              <option value={0}>Select location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Department Head Employee ID</Label>
            <Input value={headId} onChange={(e) => setHeadId(e.target.value)} placeholder="e.g. EMP001" required />
            {headLookup.state === "loading" && <p className="text-xs text-muted-foreground">Looking up employee…</p>}
            {headLookup.state === "found" && headLookup.employee && (
              <p className="text-xs text-green-700">
                {headLookup.employee.firstName} {headLookup.employee.lastName} · {headLookup.employee.position}
              </p>
            )}
            {headLookup.state === "not_found" && <p className="text-xs text-red-500">Employee not found</p>}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? "Creating…" : "Create Department"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
