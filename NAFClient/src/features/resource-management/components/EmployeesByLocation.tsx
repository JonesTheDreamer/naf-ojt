import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, MapPin, ArrowUpRight } from "lucide-react";
import type { EmployeesByLocation as EmployeesByLocationData } from "../types";

const PROGRESS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN: {
    label: "Open",
    color: "bg-slate-100 text-slate-600 border-slate-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  FOR_SCREENING: {
    label: "Screening",
    color: "bg-violet-100 text-violet-700 border-violet-200",
  },
  IMPLEMENTATION: {
    label: "Implementation",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
};

interface EmployeesByLocationProps {
  groups: EmployeesByLocationData[];
}

export function EmployeesByLocation({ groups }: EmployeesByLocationProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<number>>(
    new Set(groups.map((g) => g.locationId)),
  );

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-5 py-8 text-center">
        <MapPin className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          No active requests for this resource.
        </p>
      </div>
    );
  }

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const totalEmployees = groups.reduce((sum, g) => sum + g.employees.length, 0);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {totalEmployees} employee{totalEmployees !== 1 ? "s" : ""} across{" "}
        {groups.length} location{groups.length !== 1 ? "s" : ""}
      </p>

      {groups.map((group) => {
        const isOpen = expanded.has(group.locationId);
        return (
          <div
            key={group.locationId}
            className="rounded-xl border bg-card overflow-hidden"
          >
            <button
              onClick={() => toggle(group.locationId)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-semibold">
                  {group.locationName}
                </span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {group.employees.length}
                </span>
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {isOpen && (
              <div className="border-t divide-y">
                {group.employees.map((emp) => {
                  const prog = PROGRESS_CONFIG[emp.progress] ?? {
                    label: emp.progress.replace(/_/g, " "),
                    color: "bg-slate-100 text-slate-600 border-slate-200",
                  };
                  return (
                    <button
                      key={emp.resourceRequestId}
                      onClick={() => navigate(`/admin/NAF/${emp.nafId}`)}
                      className="group w-full flex items-center justify-between px-4 py-2.5 hover:bg-amber-50/50 transition-colors text-left"
                    >
                      <span className="text-sm text-foreground/90 group-hover:text-foreground transition-colors">
                        {emp.employeeName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${prog.color}`}
                        >
                          {prog.label}
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
