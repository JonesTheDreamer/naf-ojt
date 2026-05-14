import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WorkflowStepBuilder } from "./WorkflowStepBuilder";
import { useAddWorkflowTemplate } from "../hooks/useResourceManagement";
import type { StepRow } from "../types";

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
  const [steps, setSteps] = useState<StepRow[]>([
    { stepAction: "APPROVER", approverRole: "DEPARTMENT_HEAD", approverEntity: "" },
  ]);
  const { mutate, isPending } = useAddWorkflowTemplate();

  const ENTITY_REQUIRED_ROLES = ["SPECIFIC_EMPLOYEE", "ROLE_BASED"];
  const isValid =
    steps.length > 0 &&
    steps.every(
      (s) =>
        s.stepAction &&
        s.approverRole &&
        (!ENTITY_REQUIRED_ROLES.includes(s.approverRole) || s.approverEntity.trim()),
    );

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
          setSteps([{ stepAction: "APPROVER", approverRole: "DEPARTMENT_HEAD", approverEntity: "" }]);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Workflow Template</DialogTitle>
        </DialogHeader>

        {currentActiveVersion > 0 && (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
            This will replace the current active template (v{currentActiveVersion}).
          </div>
        )}

        <div className="py-2">
          <WorkflowStepBuilder steps={steps} onChange={setSteps} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            {isPending ? "Saving..." : "Save Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
