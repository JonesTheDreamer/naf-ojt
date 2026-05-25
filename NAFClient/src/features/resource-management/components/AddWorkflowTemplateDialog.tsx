import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WorkflowStepBuilder } from "./WorkflowStepBuilder";
import { useAddWorkflowTemplate } from "../hooks/useResourceManagement";
import type { StepRow } from "../types";
import { GitBranch, AlertTriangle } from "lucide-react";

const DEFAULT_STEP: StepRow = {
  stepAction: "APPROVER",
  approverRole: "DEPARTMENT_HEAD",
  approverEntity: "",
};

const ENTITY_REQUIRED_ROLES = ["SPECIFIC_EMPLOYEE", "ROLE_BASED"];

interface AddWorkflowTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: number;
  currentActiveVersion: number;
}

export function AddWorkflowTemplateDialog({
  open,
  onOpenChange,
  resourceId,
  currentActiveVersion,
}: AddWorkflowTemplateDialogProps) {
  const [steps, setSteps] = useState<StepRow[]>([{ ...DEFAULT_STEP }]);
  const { mutate, isPending } = useAddWorkflowTemplate();

  const isValid =
    steps.length > 0 &&
    steps.every(
      (s) =>
        s.stepAction &&
        s.approverRole &&
        (!ENTITY_REQUIRED_ROLES.includes(s.approverRole) ||
          s.approverEntity.trim()),
    );

  const reset = () => setSteps([{ ...DEFAULT_STEP }]);

  const handleSubmit = () => {
    if (!isValid) return;
    mutate(
      {
        resourceId,
        payload: {
          steps: steps.map((s, i) => ({
            stepOrder: i + 1,
            stepAction: s.stepAction,
            approverRole: s.approverRole,
            approverEntity: s.approverEntity,
          })),
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          reset();
        },
      },
    );
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  const stepCount = steps.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/40 mt-0.5">
            <GitBranch className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <DialogTitle className="text-base font-semibold leading-none">
              New Workflow Template
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1.5">
              {stepCount === 1 ? "1 approval step" : `${stepCount} approval steps`} configured
            </p>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {currentActiveVersion > 0 && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 px-3.5 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                This will replace the current active template{" "}
                <span className="font-semibold">(v{currentActiveVersion})</span>{" "}
                and take effect immediately.
              </p>
            </div>
          )}

          <WorkflowStepBuilder steps={steps} onChange={setSteps} />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isPending ? "Saving…" : "Save Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
