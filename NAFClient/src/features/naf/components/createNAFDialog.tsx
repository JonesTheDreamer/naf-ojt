import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

import SearchBar from "@/components/common/searchbar";
import type { Employee } from "@/shared/types/api/employee";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchEmployees } from "@/shared/api/employeeService";
import { getResourceGroups } from "@/shared/api/resourceService";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  Laptop,
  MapPin,
  Monitor,
  User,
} from "lucide-react";
import { useNAF } from "../hooks/useNAF";
import { useAuth } from "@/features/auth/AuthContext";

const WITH_HARDWARE_AUTO_ADD = [
  "Microsoft 365 (E1)",
  "Basic Internet",
  "Active Directory",
  "Printer Access (Black and White)",
];
const NO_HARDWARE_AUTO_ADD = ["Active Directory"];

function EmployeeCard({ employee }: { employee: Employee }) {
  const initials =
    `${employee.firstName?.[0] ?? ""}${employee.lastName?.[0] ?? ""}`.toUpperCase();
  return (
    <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            {employee.lastName}, {employee.firstName}{" "}
            {employee.middleName ?? ""}
          </p>
          <p className="font-mono text-[10px] text-gray-400 mt-0.5 tracking-wider">
            {employee.id}
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Monitor className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          <span>{employee.position || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <User className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          <span>{employee.departmentDesc || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          <span>{employee.location || "—"}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyEmployeeState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        <User className="w-5 h-5 text-gray-300" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400">
          No employee selected
        </p>
        <p className="text-[10px] text-gray-300 mt-0.5">
          Search above to continue
        </p>
      </div>
    </div>
  );
}

interface CreateNAFDialogProps {
  initialEmployee?: Employee;
}

export function CreateNAFDialog({
  initialEmployee,
}: CreateNAFDialogProps = {}) {
  const { user } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    initialEmployee ?? null,
  );
  const [open, setOpen] = useState(false);
  const [showEmployeeHasNAFAlert, setShowEmployeeHasNAFAlert] = useState(false);
  const [hardwareId, setHardwareId] = useState<number>(0);
  const [dateNeeded, setDateNeeded] = useState("");

  const {
    employeeNAFs,
    createNAFAsync,
    isLoading: employeeLoading,
  } = useNAF({
    employeeId: selectedEmployee?.id,
  });

  const resourceGroupsQuery = useQuery({
    queryKey: ["resourceGroups"],
    queryFn: getResourceGroups,
    staleTime: 1000 * 60 * 10,
  });

  const hardwareResources =
    resourceGroupsQuery.data
      ?.find((g) => g.name === "Hardware")
      ?.resources.filter((r) => r.isActive) ?? [];

  const selectedHardware =
    hardwareResources.find((r) => r.id === hardwareId) ?? null;
  const autoAddedNames = selectedHardware
    ? WITH_HARDWARE_AUTO_ADD
    : NO_HARDWARE_AUTO_ADD;

  const fetchEmployee = async (query: string): Promise<Employee[]> => {
    try {
      return await searchEmployees(query);
    } catch {
      return [];
    }
  };

  const reset = () => {
    setSelectedEmployee(initialEmployee ?? null);
    setShowEmployeeHasNAFAlert(false);
    setHardwareId(0);
    setDateNeeded("");
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedEmployee || !user) return;
    try {
      await createNAFAsync({
        employeeId: selectedEmployee.id,
        requestorId: user.employeeId,
        hardwareId,
        dateNeeded: dateNeeded || null,
      });
      reset();
      setOpen(false);
    } catch {
      /* surfaced by toast */
    }
  }

  useEffect(() => {
    setShowEmployeeHasNAFAlert(
      !!(employeeNAFs.data && employeeNAFs.data.length > 0),
    );
  }, [employeeNAFs.data]);

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const canSubmit =
    !!selectedEmployee && !showEmployeeHasNAFAlert && !employeeLoading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-500 text-white hover:bg-amber-600 hover:text-white gap-1.5">
          <FileText className="w-4 h-4" />
          New NAF
        </Button>
      </DialogTrigger>

      <DialogContent className="p-0 sm:max-w-[960px] w-[90vw] overflow-hidden rounded-2xl gap-0 border-0 shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 tracking-tight">
                New Network Access Form
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Confidential · Fill in all required fields
              </p>
            </div>
            <span className="text-[10px] font-mono text-gray-300 uppercase tracking-widest">
              NAF
            </span>
          </div>

          {/* Body: two-column */}
          <div className="grid grid-cols-5" style={{ minHeight: 420 }}>
            {/* Left: Employee panel */}
            <div className="col-span-2 bg-gray-50/80 border-r border-gray-100 p-5 flex flex-col gap-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                Requesting Access For
              </p>

              <SearchBar<Employee>
                fetchResults={fetchEmployee}
                placeholder="Search by name or ID…"
                onSelect={(e) => setSelectedEmployee(e)}
                getKey={(e) => e.id}
                getValue={(e) => e.id}
                renderItem={(e) => (
                  <div className="flex flex-col py-0.5">
                    <span className="text-xs font-medium text-gray-800">
                      {e.lastName}, {e.firstName} {e.middleName ?? ""}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {e.id} · {e.position}
                    </span>
                  </div>
                )}
              />

              {selectedEmployee ? (
                <EmployeeCard employee={selectedEmployee} />
              ) : (
                <EmptyEmployeeState />
              )}

              {showEmployeeHasNAFAlert && selectedEmployee && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-700">
                      Cannot create NAF
                    </p>
                    <p className="text-[10px] text-red-600 mt-0.5 leading-snug">
                      {selectedEmployee.id} already has an active NAF for{" "}
                      {selectedEmployee.departmentDesc ?? "their department"}.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Config panel */}
            <div
              className={`col-span-3 p-5 flex flex-col gap-5 ${!selectedEmployee ? "opacity-40 pointer-events-none" : ""}`}
            >
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                Resource Configuration
              </p>

              {/* Hardware select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-gray-400" />
                  Hardware
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all pr-8"
                    value={hardwareId}
                    onChange={(e) => setHardwareId(Number(e.target.value))}
                  >
                    <option value={0}>None</option>
                    {hardwareResources.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Date needed */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-medium text-gray-600 flex items-center gap-1.5"
                  htmlFor="date-needed"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                  Date Needed
                  {/* <span className="text-[10px] text-gray-400 font-normal">(optional)</span> */}
                </label>
                <input
                  id="date-needed"
                  type="date"
                  value={dateNeeded}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDateNeeded(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all"
                />
              </div>

              {/* Auto-added resources */}
              <div className="flex-1 flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-600">
                  Automatically included
                </p>
                <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-3 space-y-1.5">
                  {selectedHardware && (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 shrink-0">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </span>
                      <span className="text-xs text-amber-800">
                        {selectedHardware.name}
                      </span>
                    </div>
                  )}
                  {autoAddedNames.map((name) => (
                    <div key={name} className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-300 shrink-0">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </span>
                      <span className="text-xs text-amber-700">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-6 py-3.5 flex items-center justify-between bg-gray-50/50">
            <p className="text-[10px] text-gray-400">
              {selectedEmployee
                ? `Submitting for ${selectedEmployee.firstName} ${selectedEmployee.lastName}`
                : "Select an employee to continue"}
            </p>
            <div className="flex items-center gap-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-gray-500"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                size="sm"
                disabled={!canSubmit}
                className="bg-amber-500 hover:bg-amber-600 text-white border-0 min-w-[80px]"
              >
                {employeeLoading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Checking…
                  </span>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
