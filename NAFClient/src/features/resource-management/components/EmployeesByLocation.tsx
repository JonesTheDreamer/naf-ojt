import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { EmployeesByLocation as EmployeesByLocationData } from "../types";

const PROGRESS_COLORS: Record<string, string> = {
  OPEN: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  FOR_SCREENING: "bg-yellow-100 text-yellow-700",
  IMPLEMENTATION: "bg-purple-100 text-purple-700",
};

interface EmployeesByLocationProps {
  groups: EmployeesByLocationData[];
}

export function EmployeesByLocation({ groups }: EmployeesByLocationProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<number>>(new Set(groups.map((g) => g.locationId)));

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">No active requests for this resource.</p>;
  }

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <div key={group.locationId} className="border rounded-md overflow-hidden">
          <button
            onClick={() => toggle(group.locationId)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium bg-muted/40 hover:bg-muted/60 transition-colors"
          >
            <span>{group.locationName}</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">{group.employees.length} employee{group.employees.length !== 1 ? "s" : ""}</span>
              {expanded.has(group.locationId) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </button>

          {expanded.has(group.locationId) && (
            <div className="divide-y">
              {group.employees.map((emp) => (
                <button
                  key={emp.resourceRequestId}
                  onClick={() => navigate(`/NAF/${emp.employeeId}/${emp.nafId}`)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors text-left"
                >
                  <span>{emp.employeeName}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      PROGRESS_COLORS[emp.progress] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {emp.progress.replace(/_/g, " ")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
