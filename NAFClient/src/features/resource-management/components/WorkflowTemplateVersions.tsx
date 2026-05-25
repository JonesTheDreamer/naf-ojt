import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Eye,
  User,
} from "lucide-react";
import type { WorkflowTemplateVersion } from "../types";

interface WorkflowTemplateVersionsProps {
  versions: WorkflowTemplateVersion[];
}

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: typeof CheckCircle2; color: string }
> = {
  APPROVER: {
    label: "Approval",
    icon: CheckCircle2,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  FOR_SCREENING: {
    label: "Screening",
    icon: Eye,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
};

const ROLE_LABELS: Record<string, string> = {
  SUPERVISOR: "Supervisor",
  DEPARTMENT_HEAD: "Dept. Head",
  POSITION: "Position",
  TECHNICAL_HEAD: "Tech Head",
};

export function WorkflowTemplateVersions({
  versions,
}: WorkflowTemplateVersionsProps) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(versions.filter((v) => v.isActive).map((v) => v.id)),
  );

  if (versions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-5 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          No workflow templates defined.
        </p>
      </div>
    );
  }

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="space-y-2">
      {versions.map((v) => {
        const isOpen = expanded.has(v.id);
        return (
          <div
            key={v.id}
            className={`rounded-xl border overflow-hidden transition-colors
              ${v.isActive ? "border-amber-300 bg-amber-50/40" : "border-border bg-card"}`}
          >
            <button
              onClick={() => toggle(v.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold
                    ${v.isActive ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}
                >
                  v{v.version}
                </span>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      Version {v.version}
                    </span>
                    {v.isActive && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {v.steps.length} step{v.steps.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {isOpen && (
              <div className="px-4 pb-4">
                {/* Timeline */}
                <div className="relative pl-4">
                  {/* Vertical line */}
                  <div className="absolute left-[1.375rem] top-2 bottom-2 w-px bg-border" />

                  <div className="space-y-3">
                    {v.steps.map((s) => {
                      const config =
                        ACTION_CONFIG[s.stepAction] ?? ACTION_CONFIG.APPROVER;
                      const Icon = config.icon;
                      return (
                        <div
                          key={s.stepOrder}
                          className="flex items-start gap-3 relative"
                        >
                          {/* Node */}
                          <div
                            className={`flex items-center justify-center w-7 h-7 rounded-full border-2 text-xs font-bold shrink-0 bg-white z-10
                              ${v.isActive ? "border-amber-400 text-amber-600" : "border-border text-muted-foreground"}`}
                          >
                            {s.stepOrder}
                          </div>

                          {/* Card */}
                          <div className="flex-1 rounded-lg border bg-white px-3 py-2 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wide shrink-0 ${config.color}`}
                              >
                                <Icon className="h-3 w-3" />
                                {config.label}
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                {ROLE_LABELS[s.approverRole] ??
                                  s.approverRole.replace(/_/g, " ")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-medium truncate max-w-32">
                                {s.approverEntity || ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
