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
const APPROVER_ROLES = ["SUPERVISOR", "DEPARTMENT_HEAD", "POSITION", "TECHNICAL_HEAD"] as const;

interface WorkflowStepBuilderProps {
  steps: StepRow[];
  onChange: (steps: StepRow[]) => void;
}

export function WorkflowStepBuilder({ steps, onChange }: WorkflowStepBuilderProps) {
  const addStep = () =>
    onChange([...steps, { stepAction: "APPROVER", approverRole: "DEPARTMENT_HEAD", approverEntity: "" }]);

  const removeStep = (index: number) =>
    onChange(steps.filter((_, i) => i !== index));

  const updateStep = (index: number, field: keyof StepRow, value: string) =>
    onChange(steps.map((s, i) => (i === index ? { ...s, [field]: value } : s)));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 text-xs font-medium text-muted-foreground px-1">
        <span>#</span>
        <span>Action</span>
        <span>Role</span>
        <span>Entity</span>
        <span />
      </div>
      {steps.map((step, i) => (
        <div key={i} className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 items-center">
          <span className="text-sm text-muted-foreground text-center">{i + 1}</span>

          <Select value={step.stepAction} onValueChange={(v) => updateStep(i, "stepAction", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STEP_ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
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
            placeholder="e.g. IT Department"
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
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addStep} className="w-full">
        <Plus className="h-4 w-4 mr-1" /> Add Step
      </Button>
    </div>
  );
}
