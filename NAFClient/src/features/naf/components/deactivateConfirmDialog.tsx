import { PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeactivateConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceName: string;
  onConfirm: () => void;
  isSubmitting?: boolean;
  description?: string;
}

export function DeactivateConfirmDialog({
  open,
  onOpenChange,
  resourceName,
  onConfirm,
  isSubmitting,
  description,
}: DeactivateConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-orange-500">
            Deactivate Resource Access
          </DialogTitle>
          <DialogDescription>
            {description ?? (
              <>
                Are you sure you want to deactivate{" "}
                <span className="font-semibold text-foreground">{resourceName}</span>{" "}
                access? This will mark it as no longer needed.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            <PowerOff className="h-3.5 w-3.5" />
            {isSubmitting ? "Deactivating..." : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
