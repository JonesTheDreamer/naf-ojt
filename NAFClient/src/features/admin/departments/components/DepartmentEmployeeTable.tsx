import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { ExternalLink, FilePlus, Loader2, Search, Users } from "lucide-react";
import type { DepartmentEmployeeDTO } from "../types";
import { getEmployeeNAFs } from "@/features/naf/api";
import type { NAF } from "@/shared/types/api/naf";

function avatarColors(name: string): string {
  const palette = [
    "bg-amber-500 text-white",
    "bg-sky-500 text-white",
    "bg-emerald-500 text-white",
    "bg-violet-500 text-white",
    "bg-rose-500 text-white",
    "bg-cyan-600 text-white",
    "bg-orange-500 text-white",
    "bg-teal-500 text-white",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

interface Props {
  employees: DepartmentEmployeeDTO[];
  isLoading?: boolean;
}

export function DepartmentEmployeeTable({ employees, isLoading }: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const nafQueries = useQueries({
    queries: employees.map((emp) => ({
      queryKey: ["employeeNAF", emp.id],
      queryFn: () => getEmployeeNAFs(emp.id),
      staleTime: 60_000,
    })),
  });

  const nafByEmpId = useMemo(() => {
    const m = new Map<string, (typeof nafQueries)[0]>();
    employees.forEach((emp, i) => m.set(emp.id, nafQueries[i]));
    return m;
  }, [employees, nafQueries]);

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.id.toLowerCase().includes(q) ||
        (e.firstName ?? "").toLowerCase().includes(q) ||
        (e.lastName ?? "").toLowerCase().includes(q) ||
        (e.position ?? "").toLowerCase().includes(q),
    );
  }, [employees, search]);

  const allSettled = employees.length > 0 && nafQueries.every((q) => !q.isLoading);
  const withNafCount = allSettled
    ? nafQueries.filter((q) => q.data && q.data.length > 0).length
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-24 rounded bg-muted animate-pulse" />
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Employees
        </h2>

        <div className="flex items-center gap-3 flex-wrap">
          {allSettled && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>
                <span className="font-semibold text-amber-600">{withNafCount}</span>
                {" / "}
                <span className="font-semibold text-foreground">{employees.length}</span>
                {" have NAFs"}
              </span>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter employees…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-52 rounded-lg border border-border bg-background pl-8 pr-3 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Employee
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                Position
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                NAF
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No employees assigned to this department.
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No employees match{" "}
                  <span className="font-medium text-foreground">"{search}"</span>.
                </td>
              </tr>
            ) : (
              filtered.map((emp) => {
                const nafQuery = nafByEmpId.get(emp.id);
                const nafLoading = nafQuery?.isLoading ?? true;
                const nafs: NAF[] = nafQuery?.data ?? [];
                const hasNaf = !nafLoading && nafs.length > 0;
                const latestNaf = hasNaf
                  ? nafs.reduce((a, b) =>
                      new Date(a.submittedAt) > new Date(b.submittedAt) ? a : b,
                    )
                  : null;

                const initials =
                  `${emp.firstName?.[0] ?? ""}${emp.lastName?.[0] ?? ""}`.toUpperCase();
                const colorClass = avatarColors(`${emp.firstName}${emp.lastName}`);

                return (
                  <tr
                    key={emp.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors group"
                  >
                    {/* Employee */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${colorClass}`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold leading-tight text-sm truncate">
                            {emp.lastName}, {emp.firstName}
                            {emp.middleName ? ` ${emp.middleName[0]}.` : ""}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground/50 tracking-wider mt-0.5">
                            {emp.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Position */}
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell max-w-[200px]">
                      <span className="truncate block">{emp.position || "—"}</span>
                    </td>

                    {/* NAF status */}
                    <td className="px-4 py-3">
                      {nafLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/30" />
                      ) : hasNaf ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-400 border border-slate-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                          None
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right">
                      {!nafLoading && (
                        hasNaf ? (
                          <button
                            onClick={() => navigate(`/admin/NAF/${latestNaf!.id}`)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View NAF
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate("/hr/create")}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors"
                          >
                            <FilePlus className="h-3 w-3" />
                            Create NAF
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
