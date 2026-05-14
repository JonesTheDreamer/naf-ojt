import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkflowStepBuilder } from "./WorkflowStepBuilder";
import { CreateResourceGroupDialog } from "./CreateResourceGroupDialog";
import { useCreateResource } from "../hooks/useResourceManagement";
import type { StepRow } from "../types";
import type { ResourceGroup } from "@/shared/types/api/naf";
import { useQuery } from "@tanstack/react-query";
import { getResourceGroups } from "@/shared/api/resourceService";

interface AddResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddResourceDialog({ open, onOpenChange }: AddResourceDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [isSpecial, setIsSpecial] = useState(false);
  const [resourceGroupId, setResourceGroupId] = useState<number | undefined>();
  const [steps, setSteps] = useState<StepRow[]>([
    { stepAction: "APPROVER", approverRole: "DEPARTMENT_HEAD", approverEntity: "" },
  ]);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [extraGroups, setExtraGroups] = useState<ResourceGroup[]>([]);

  const { data: groups = [] } = useQuery({
    queryKey: ["resourceGroups"],
    queryFn: getResourceGroups,
  });

  const allGroups = [...groups, ...extraGroups.filter((eg) => !groups.some((g) => g.id === eg.id))];

  const { mutate, isPending } = useCreateResource();

  const ENTITY_REQUIRED_ROLES = ["SPECIFIC_EMPLOYEE", "ROLE_BASED"];
  const isValid =
    name.trim().length > 0 &&
    (!isSpecial ||
      steps.every(
        (s) =>
          s.stepAction &&
          s.approverRole &&
          (!ENTITY_REQUIRED_ROLES.includes(s.approverRole) || s.approverEntity.trim()),
      ));

  const handleSubmit = () => {
    if (!isValid) return;
    mutate(
      {
        name: name.trim(),
        color,
        isSpecial,
        resourceGroupId,
        steps: isSpecial
          ? steps.map((s, i) => ({ stepOrder: i + 1, stepAction: s.stepAction, approverRole: s.approverRole, approverEntity: s.approverEntity }))
          : undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setName("");
    setColor("#3b82f6");
    setIsSpecial(false);
    setResourceGroupId(undefined);
    setSteps([{ stepAction: "APPROVER", approverRole: "DEPARTMENT_HEAD", approverEntity: "" }]);
    setExtraGroups([]);
  };

  const handleGroupChange = (value: string) => {
    if (value === "__add_other__") {
      setShowGroupDialog(true);
    } else {
      setResourceGroupId(Number(value));
    }
  };

  const handleGroupCreated = (group: ResourceGroup) => {
    setExtraGroups((prev) => [...prev, group]);
    setResourceGroupId(group.id);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="resource-name">Name *</Label>
              <Input
                id="resource-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Microsoft 365 E3"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="resource-color">Color</Label>
              <div className="flex items-center gap-3">
                <input
                  id="resource-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-16 cursor-pointer rounded border border-input bg-background"
                />
                <span className="text-sm text-muted-foreground">{color}</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Resource Group</Label>
              <Select
                value={resourceGroupId?.toString() ?? ""}
                onValueChange={handleGroupChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a group (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {allGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>
                      {g.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="__add_other__" className="text-primary font-medium">
                    + Add other...
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="is-special"
                checked={isSpecial}
                onCheckedChange={(checked) => setIsSpecial(checked === true)}
              />
              <Label htmlFor="is-special">Requires approval (Special resource)</Label>
            </div>

            {isSpecial && (
              <div className="space-y-2 border rounded-md p-3">
                <Label className="text-sm font-medium">Approval Workflow Steps</Label>
                <WorkflowStepBuilder steps={steps} onChange={setSteps} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid || isPending}>
              {isPending ? "Creating..." : "Create Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateResourceGroupDialog
        open={showGroupDialog}
        onOpenChange={setShowGroupDialog}
        onCreated={handleGroupCreated}
      />
    </>
  );
}
