import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Package, Zap, ShieldCheck, Check, Pipette } from "lucide-react";

const COLOR_PRESETS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
];

const DEFAULT_STEP: StepRow = {
  stepAction: "APPROVER",
  approverRole: "DEPARTMENT_HEAD",
  approverEntity: "",
};

const ENTITY_REQUIRED_ROLES = ["SPECIFIC_EMPLOYEE", "ROLE_BASED"];

interface AddResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddResourceDialog({
  open,
  onOpenChange,
}: AddResourceDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [isSpecial, setIsSpecial] = useState(false);
  const [resourceGroupId, setResourceGroupId] = useState<number | undefined>();
  const [steps, setSteps] = useState<StepRow[]>([{ ...DEFAULT_STEP }]);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [extraGroups, setExtraGroups] = useState<ResourceGroup[]>([]);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const { data: groups = [] } = useQuery({
    queryKey: ["resourceGroups"],
    queryFn: getResourceGroups,
  });

  const allGroups = [
    ...groups,
    ...extraGroups.filter((eg) => !groups.some((g) => g.id === eg.id)),
  ];

  const { mutate, isPending } = useCreateResource();

  const isValid =
    name.trim().length > 0 &&
    (!isSpecial ||
      steps.every(
        (s) =>
          s.stepAction &&
          s.approverRole &&
          (!ENTITY_REQUIRED_ROLES.includes(s.approverRole) ||
            s.approverEntity.trim()),
      ));

  const resetForm = () => {
    setName("");
    setColor("#3b82f6");
    setIsSpecial(false);
    setResourceGroupId(undefined);
    setSteps([{ ...DEFAULT_STEP }]);
    setExtraGroups([]);
  };

  const handleSubmit = () => {
    if (!isValid) return;
    mutate(
      {
        name: name.trim(),
        color,
        isSpecial,
        resourceGroupId,
        steps: isSpecial
          ? steps.map((s, i) => ({
              stepOrder: i + 1,
              stepAction: s.stepAction,
              approverRole: s.approverRole,
              approverEntity: s.approverEntity,
            }))
          : undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      },
    );
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

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const isPreset = COLOR_PRESETS.includes(color);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) handleClose();
          else onOpenChange(o);
        }}
      >
        <DialogContent className="max-w-lg p-0 gap-0 flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div
              className="p-2 rounded-lg mt-0.5 shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              <Package className="w-4 h-4" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0 pr-8">
              <DialogTitle className="text-base font-semibold leading-none">
                Add Resource
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1.5">
                Configure the new resource and its access type
              </p>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Microsoft 365 E3"
                className="h-9"
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Color
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setColor(preset)}
                    className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-ring"
                    style={{
                      backgroundColor: preset,
                      borderColor: color === preset ? preset : "transparent",
                      boxShadow:
                        color === preset
                          ? `0 0 0 2px white, 0 0 0 4px ${preset}`
                          : undefined,
                    }}
                    aria-label={preset}
                  >
                    {color === preset && (
                      <Check className="w-3 h-3 text-white mx-auto" />
                    )}
                  </button>
                ))}

                {/* Custom color */}
                <button
                  type="button"
                  onClick={() => colorInputRef.current?.click()}
                  className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-ring flex items-center justify-center bg-muted border-border"
                  style={
                    !isPreset
                      ? {
                          backgroundColor: color,
                          borderColor: color,
                          boxShadow: `0 0 0 2px white, 0 0 0 4px ${color}`,
                        }
                      : undefined
                  }
                  aria-label="Custom color"
                >
                  {isPreset ? (
                    <Pipette className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </button>
                <input
                  ref={colorInputRef}
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="sr-only"
                  aria-label="Custom color picker"
                />

                <span
                  className="text-xs font-mono text-muted-foreground ml-1"
                  style={{ color }}
                >
                  {color}
                </span>
              </div>
            </div>

            {/* Resource Group */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Resource Group
              </label>
              <Select
                value={resourceGroupId?.toString() ?? ""}
                onValueChange={handleGroupChange}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="None (ungrouped)" />
                </SelectTrigger>
                <SelectContent>
                  {allGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>
                      {g.name}
                    </SelectItem>
                  ))}
                  <SelectItem
                    value="__add_other__"
                    className="text-amber-600 dark:text-amber-400 font-medium"
                  >
                    + Create new group…
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Access type selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Access Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Basic */}
                <button
                  type="button"
                  onClick={() => setIsSpecial(false)}
                  className={`rounded-xl border-2 p-3.5 text-left transition-all ${
                    !isSpecial
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2.5 ${
                      !isSpecial
                        ? "bg-amber-100 dark:bg-amber-950/50"
                        : "bg-muted"
                    }`}
                  >
                    <Zap
                      className={`w-4 h-4 ${!isSpecial ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
                    />
                  </div>
                  <p
                    className={`text-sm font-semibold leading-none mb-1 ${!isSpecial ? "text-amber-700 dark:text-amber-300" : "text-foreground"}`}
                  >
                    Basic
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Auto-approved, no workflow needed
                  </p>
                </button>

                {/* Special */}
                <button
                  type="button"
                  onClick={() => setIsSpecial(true)}
                  className={`rounded-xl border-2 p-3.5 text-left transition-all ${
                    isSpecial
                      ? "border-violet-400 bg-violet-50 dark:bg-violet-950/20 dark:border-violet-700"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2.5 ${
                      isSpecial
                        ? "bg-violet-100 dark:bg-violet-950/50"
                        : "bg-muted"
                    }`}
                  >
                    <ShieldCheck
                      className={`w-4 h-4 ${isSpecial ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground"}`}
                    />
                  </div>
                  <p
                    className={`text-sm font-semibold leading-none mb-1 ${isSpecial ? "text-violet-700 dark:text-violet-300" : "text-foreground"}`}
                  >
                    Special
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Requires approval workflow
                  </p>
                </button>
              </div>
            </div>

            {/* Approval Workflow (conditional) */}
            {isSpecial && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Approval Workflow
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <WorkflowStepBuilder steps={steps} onChange={setSteps} />
              </div>
            )}
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
              {isPending ? "Creating…" : "Create Resource"}
            </Button>
          </div>
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
