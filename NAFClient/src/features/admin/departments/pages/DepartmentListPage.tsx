import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Search } from "lucide-react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useDepartments } from "../hooks/useDepartments";
import type { DepartmentViewDTO } from "../types";
import { RoutesEnum } from "@/app/routesEnum";

const ACCENTS = [
  {
    border: "border-l-amber-500",
    text: "text-amber-600",
    bg: "bg-amber-50",
    avatar: "bg-amber-100 text-amber-700",
  },
  {
    border: "border-l-sky-500",
    text: "text-sky-600",
    bg: "bg-sky-50",
    avatar: "bg-sky-100 text-sky-700",
  },
  {
    border: "border-l-emerald-500",
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    avatar: "bg-emerald-100 text-emerald-700",
  },
  {
    border: "border-l-violet-500",
    text: "text-violet-600",
    bg: "bg-violet-50",
    avatar: "bg-violet-100 text-violet-700",
  },
  {
    border: "border-l-rose-500",
    text: "text-rose-600",
    bg: "bg-rose-50",
    avatar: "bg-rose-100 text-rose-700",
  },
  {
    border: "border-l-cyan-600",
    text: "text-cyan-700",
    bg: "bg-cyan-50",
    avatar: "bg-cyan-100 text-cyan-700",
  },
  {
    border: "border-l-orange-500",
    text: "text-orange-600",
    bg: "bg-orange-50",
    avatar: "bg-orange-100 text-orange-700",
  },
  {
    border: "border-l-teal-500",
    text: "text-teal-600",
    bg: "bg-teal-50",
    avatar: "bg-teal-100 text-teal-700",
  },
];

function accentFor(id: string) {
  let h = 0;

  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return ACCENTS[Math.abs(h) % ACCENTS.length];
}

function DepartmentCard({
  dept,
  index,
  onClick,
}: {
  dept: DepartmentViewDTO;
  index: number;
  onClick: () => void;
}) {
  const accent = accentFor(dept.id);
  const watermark = (dept.id || "D")[0].toUpperCase();
  const headInitial = dept.departmentHead?.[0]?.toUpperCase() ?? "?";

  return (
    <button
      onClick={onClick}
      className={`
        group w-full text-left rounded-xl border border-border bg-card overflow-hidden
        hover:shadow-md hover:-translate-y-0.5 transition-all duration-200
        border-l-[3px] ${accent.border}
        opacity-0 animate-[fadeSlideUp_0.3s_ease_forwards]
      `}
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className="px-5 py-4 relative overflow-hidden">
        {/* Watermark */}
        <span
          aria-hidden
          className="pointer-events-none select-none absolute -right-1 -top-2 text-[5rem] font-black leading-none text-muted-foreground/[0.04] tracking-tight"
        >
          {watermark}
        </span>

        {/* Code chip */}
        <div className="flex items-center justify-between mb-2 relative">
          <span
            className={`font-mono text-[11px] font-bold tracking-widest ${accent.text} ${accent.bg} px-1.5 py-0.5 rounded`}
          >
            {dept.id}
          </span>
          <ArrowRight
            className={`h-3.5 w-3.5 text-muted-foreground/30 group-hover:${accent.text} group-hover:translate-x-0.5 transition-all duration-200`}
          />
        </div>

        {/* Dept name */}
        <p className="font-semibold text-[15px] leading-snug text-foreground group-hover:text-amber-600 transition-colors relative">
          {dept.departmentDesc || "—"}
        </p>

        {/* Head */}
        <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-2">
          {dept.departmentHead ? (
            <>
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${accent.avatar}`}
              >
                {headInitial}
              </div>
              <span className="text-xs text-muted-foreground truncate">
                {dept.departmentHead}
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground/40 italic">
              No head assigned
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden border-l-[3px] border-l-muted animate-pulse">
      <div className="px-5 py-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-4 w-4 rounded bg-muted" />
        </div>
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="pt-3 border-t border-border/60 flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-muted shrink-0" />
          <div className="h-3 w-28 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export default function DepartmentListPage() {
  const navigate = useNavigate();
  const { data: departments = [], isLoading } = useDepartments();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return departments;
    const q = search.toLowerCase();
    return departments.filter(
      (d) =>
        d.id.toLowerCase().includes(q) ||
        (d.departmentDesc ?? "").toLowerCase().includes(q) ||
        (d.departmentHead ?? "").toLowerCase().includes(q),
    );
  }, [departments, search]);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-500" />
              <h1 className="text-xl font-bold tracking-tight">Departments</h1>
            </div>
            {!isLoading && (
              <p className="text-xs text-muted-foreground pl-7">
                <span className="font-semibold text-foreground">
                  {departments.length}
                </span>{" "}
                department{departments.length !== 1 ? "s" : ""} registered
              </p>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
            <input
              type="text"
              placeholder="Search departments…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-60 rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? (
                <>
                  No departments match{" "}
                  <span className="font-medium text-foreground">
                    "{search}"
                  </span>
                  .
                </>
              ) : (
                "No departments found."
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((dept, i) => (
              <DepartmentCard
                key={dept.id}
                dept={dept}
                index={i}
                onClick={() =>
                  navigate(
                    RoutesEnum.ADMIN_DEPARTMENT_DETAIL.replace(
                      ":departmentId",
                      dept.id,
                    ),
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
