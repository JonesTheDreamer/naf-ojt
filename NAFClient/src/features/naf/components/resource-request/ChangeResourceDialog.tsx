import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/utils";
import type { Resource } from "@/shared/types/api/naf";
import { ResourceIcon } from "./resourceRequestUtils";

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
  onConfirm: (resourceId: number) => void;
  isSubmitting?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleOpenChange = (val: boolean) => {
    if (!val) setSelectedId(null);
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-600">Change Resource</DialogTitle>
          <DialogDescription>
            Replacing: <span className="font-medium text-foreground">{currentResourceName}</span>. The original request will be cancelled.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          {availableResources.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No other resources available in this group.</p>
          ) : (
            <div className="space-y-1.5">
              {availableResources.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={cn(
                    "flex items-center gap-3 w-full rounded-md border px-3 py-2 text-sm transition-colors text-left",
                    selectedId === r.id ? "border-amber-400 bg-amber-50 text-amber-800" : "hover:bg-muted/50",
                  )}
                  onClick={() => setSelectedId(r.id)}
                >
                  <ResourceIcon iconUrl={r.iconUrl} name={r.name} />
                  <span>{r.name}</span>
                  {r.isSpecial && <span className="ml-auto text-xs text-amber-600 font-medium">Requires Approval</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
            onClick={() => { if (selectedId !== null) { onConfirm(selectedId); setSelectedId(null); } }}
            disabled={selectedId === null || isSubmitting}
          >
            <ArrowLeftRight className="h-4 w-4" /> {isSubmitting ? "Changing..." : "Confirm Change"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
