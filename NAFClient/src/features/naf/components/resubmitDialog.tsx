import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PurposeProps } from "@/types/api/naf";
import { Pencil } from "lucide-react";
import { useState } from "react";

interface ResubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPurpose: string;
  onSubmit: (purpose: PurposeProps) => void;
  isSubmitting?: boolean;
}

export function ResubmitDialog({
  open,
  onOpenChange,
  initialPurpose,
  onSubmit,
  isSubmitting,
}: ResubmitDialogProps) {
  const [purpose, setPurpose] = useState(initialPurpose);

  const handleOpenChange = (val: boolean) => {
    if (!val) setPurpose(initialPurpose);
    onOpenChange(val);
  };

  // React.FormEvent<HTMLFormElement> — SubmitEvent does not exist in React's types
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({ purpose });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Purpose</DialogTitle>
          <DialogDescription>
            Resubmit this request by revising the purpose.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-purpose" className="text-sm font-semibold">
              Purpose <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="edit-purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Enter purpose..."
              className="resize-none"
              rows={4}
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-400 hover:bg-emerald-500 text-white gap-1.5"
              disabled={!purpose.trim() || isSubmitting}
            >
              <Pencil className="h-3.5 w-3.5" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
