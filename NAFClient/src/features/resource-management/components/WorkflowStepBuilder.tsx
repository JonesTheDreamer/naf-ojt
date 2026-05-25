import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, UserCheck, ScanSearch } from "lucide-react";
import type { StepRow } from "../types";

const STEP_ACTIONS = ["APPROVER", "FOR_SCREENING"] as const;
const APPROVER_ROLES = [
  "SUPERVISOR",
  "DEPARTMENT_HEAD",
  "SPECIFIC_EMPLOYEE",
  "ROLE_BASED",
  "TECHNICAL_HEAD",
  "RESOURCE_OWNER",
] as const;

const ACTION_LABELS: Record<string, string> = {
  APPROVER: "Approver",
  FOR_SCREENING: "For Screening",
};

const ROLE_LABELS: Record<string, string> = {
  SUPERVISOR: "Supervisor",
  DEPARTMENT_HEAD: "Department Head",
  SPECIFIC_EMPLOYEE: "Specific Employee",
  ROLE_BASED: "Role-Based",
  TECHNICAL_HEAD: "Technical Head",
  RESOURCE_OWNER: "Resource Owner",
};

type EntityConfig = { required: boolean; placeholder: string; disabled: boolean };

const ENTITY_CONFIG: Record<string, EntityConfig> = {
  SUPERVISOR:        { required: false, placeholder: "Not required", disabled: true },
  DEPARTMENT_HEAD:   { required: false, placeholder: "Dept. code (optional)", disabled: false },
  SPECIFIC_EMPLOYEE: { required: true,  placeholder: "Employee ID", disabled: false },
  ROLE_BASED:        { required: true,  placeholder: "Role name (e.g. ADMIN)", disabled: false },
  TECHNICAL_HEAD:    { required: false, placeholder: "Not required", disabled: true },
  RESOURCE_OWNER:    { required: false, placeholder: "Not required", disabled: true },
};

interface WorkflowStepBuilderProps {
  steps: StepRow[];
  onChange: (steps: StepRow[]) => void;
}

export function WorkflowStepBuilder({ steps, onChange }: WorkflowStepBuilderProps) {
  const addStep = () =>
    onChange([
      ...steps,
      { stepAction: "APPROVER", approverRole: "DEPARTMENT_HEAD", approverEntity: "" },
    ]);

  const removeStep = (index: number) =>
    onChange(steps.filter((_, i) => i !== index));

  const updateStep = (index: number, field: keyof StepRow, value: string) => {
    const updated = steps.map((s, i) => {
      if (i !== index) return s;
      const next = { ...s, [field]: value };
      if (field === "approverRole") next.approverEntity = "";
      return next;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const entityCfg =
          ENTITY_CONFIG[step.approverRole] ?? {
            required: false,
            placeholder: "",
            disabled: false,
          };
        const isScreening = step.stepAction === "FOR_SCREENING";
        const isLast = i === steps.length - 1;

        return (
          <div key={i}>
            {/* Step card */}
            <div
              className={`rounded-xl border p-4 space-y-3 transition-colors ${
                isScreening
                  ? "border-violet-200 bg-violet-50/60 dark:border-violet-900 dark:bg-violet-950/20"
                  : "border-border bg-card"
              }`}
            >
              {/* Card header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                      isScreening ? "bg-violet-500" : "bg-amber-500"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isScreening ? (
                      <ScanSearch className="w-3.5 h-3.5 text-violet-500" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        isScreening
                          ? "text-violet-600 dark:text-violet-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      Step {i + 1}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  disabled={steps.length === 1}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-25 disabled:pointer-events-none"
                  aria-label="Remove step"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action + Role */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Action
                  </label>
                  <Select
                    value={step.stepAction}
                    onValueChange={(v) => updateStep(i, "stepAction", v)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STEP_ACTIONS.map((a) => (
                        <SelectItem key={a} value={a}>
                          {ACTION_LABELS[a]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Approver Role
                  </label>
                  <Select
                    value={step.approverRole}
                    onValueChange={(v) => updateStep(i, "approverRole", v)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPROVER_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Entity field — only shown when applicable */}
              {!entityCfg.disabled && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Entity
                    {entityCfg.required && (
                      <span className="text-destructive ml-0.5">*</span>
                    )}
                  </label>
                  <Input
                    value={step.approverEntity}
                    onChange={(e) =>
                      updateStep(i, "approverEntity", e.target.value)
                    }
                    placeholder={entityCfg.placeholder}
                    className="h-9 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Flow connector between steps */}
            {!isLast && (
              <div className="flex justify-center items-center py-1 gap-0 flex-col">
                <div className="w-px h-2.5 bg-border" />
                <div
                  className="w-0 h-0"
                  style={{
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderTop: "5px solid hsl(var(--border))",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Add Step */}
      <div className={steps.length > 0 ? "pt-2" : ""}>
        <button
          type="button"
          onClick={addStep}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Step
        </button>
      </div>
    </div>
  );
}
