import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
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

type EntityConfig = { required: boolean; placeholder: string; disabled: boolean };

const ENTITY_CONFIG: Record<string, EntityConfig> = {
  SUPERVISOR:        { required: false, placeholder: "Not required", disabled: true },
  DEPARTMENT_HEAD:   { required: false, placeholder: "Dept code (optional, blank = own dept)", disabled: false },
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
    onChange([...steps, { stepAction: "APPROVER", approverRole: "DEPARTMENT_HEAD", approverEntity: "" }]);

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
    <div className="space-y-3">
      <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 text-xs font-medium text-muted-foreground px-1">
        <span>#</span>
        <span>Action</span>
        <span>Role</span>
        <span>Entity</span>
        <span />
      </div>
      {steps.map((step, i) => {
        const entityCfg = ENTITY_CONFIG[step.approverRole] ?? { required: false, placeholder: "", disabled: false };
        return (
          <div key={i} className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 items-center">
            <span className="text-sm text-muted-foreground text-center">{i + 1}</span>

            <Select value={step.stepAction} onValueChange={(v) => updateStep(i, "stepAction", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STEP_ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={step.approverRole} onValueChange={(v) => updateStep(i, "approverRole", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPROVER_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={step.approverEntity}
              onChange={(e) => updateStep(i, "approverEntity", e.target.value)}
              placeholder={entityCfg.placeholder}
              disabled={entityCfg.disabled}
              className={entityCfg.disabled ? "bg-muted text-muted-foreground" : ""}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeStep(i)}
              disabled={steps.length === 1}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={addStep} className="w-full">
        <Plus className="h-4 w-4 mr-1" /> Add Step
      </Button>
    </div>
  );
}
