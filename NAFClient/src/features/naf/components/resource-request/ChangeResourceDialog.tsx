import { useState } from "react";
import { ArrowLeftRight, CalendarDays, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/utils/utils";
import type { Resource } from "@/shared/types/api/naf";
import { ResourceIcon } from "./resourceRequestUtils";

export interface ChangeResourceConfirmPayload {
  resourceId: number;
  purpose?: string;
  dateNeeded?: string | null;
}

export function ChangeResourceDialog({
  open,
  onOpenChange,
  currentResourceName,
  availableResources,
  onConfirm,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentResourceName: string;
  availableResources: Resource[];
  onConfirm: (payload: ChangeResourceConfirmPayload) => void;
  isSubmitting?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [purpose, setPurpose] = useState("");
  const [dateNeeded, setDateNeeded] = useState("");

  const selectedResource =
    availableResources.find((r) => r.id === selectedId) ?? null;
  const isSpecial = selectedResource?.isSpecial ?? false;

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setSelectedId(null);
      setPurpose("");
      setDateNeeded("");
    }
    onOpenChange(val);
  };

  const handleConfirm = () => {
    if (selectedId === null) return;
    onConfirm({
      resourceId: selectedId,
      purpose: isSpecial ? purpose : undefined,
      dateNeeded: dateNeeded || null,
    });
    setSelectedId(null);
    setPurpose("");
    setDateNeeded("");
  };

  const canSubmit =
    selectedId !== null &&
    dateNeeded.length > 0 &&
    (!isSpecial || purpose.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-600">Change Resource</DialogTitle>
          <DialogDescription>
            Replacing:{" "}
            <span className="font-medium text-foreground">
              {currentResourceName}
            </span>
            . The original request will be cancelled.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          {availableResources.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No other resources available in this group.
            </p>
          ) : (
            <div className="space-y-1.5">
              {availableResources.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={cn(
                    "flex items-center gap-3 w-full rounded-md border px-3 py-2 text-sm transition-colors text-left",
                    selectedId === r.id
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : "hover:bg-muted/50",
                  )}
                  onClick={() => {
                    setSelectedId(r.id);
                    setPurpose("");
                    setDateNeeded("");
                  }}
                >
                  <ResourceIcon iconUrl={r.iconUrl} name={r.name} />
                  <span>{r.name}</span>
                  {r.isSpecial && (
                    <span className="ml-auto text-xs text-amber-600 font-medium">
                      Requires Approval
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {isSpecial && (
            <div className="space-y-3 pt-1 border-t border-dashed border-amber-200">
              <p className="text-xs text-amber-700 font-medium pt-1">
                This resource requires approval — please fill in the details
                below.
              </p>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Purpose <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Explain why this resource is needed…"
                  rows={3}
                  className="resize-none text-sm"
                  required
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            Date Needed{" "}
            {/* <span className="text-muted-foreground">(optional)</span> */}
          </Label>
          <Input
            type="date"
            value={dateNeeded}
            onChange={(e) => setDateNeeded(e.target.value)}
            className="text-sm"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
            onClick={handleConfirm}
            disabled={!canSubmit || isSubmitting}
          >
            <ArrowLeftRight className="h-4 w-4" />{" "}
            {isSubmitting ? "Changing..." : "Confirm Change"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
