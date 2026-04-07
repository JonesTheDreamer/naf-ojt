import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceName: string;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  resourceName,
  onConfirm,
  isSubmitting,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-500">
            Delete Resource Request
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the{" "}
            <span className="font-semibold text-foreground">
              {resourceName}
            </span>{" "}
            request? This action cannot be undone.
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
            className="bg-red-400 hover:bg-red-500 text-white gap-1.5"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
