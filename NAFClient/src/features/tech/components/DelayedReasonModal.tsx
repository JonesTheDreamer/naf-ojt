import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/utils/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
}

export function DelayedReasonModal({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: Props) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const isInvalid = touched && reason.trim() === "";

  const handleClose = (val: boolean) => {
    if (!val) {
      setReason("");
      setTouched(false);
    }
    onOpenChange(val);
  };

  const handleConfirm = () => {
    setTouched(true);
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason("");
    setTouched(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-yellow-700">Mark as Delayed</DialogTitle>
          <DialogDescription>
            Provide a reason for the delay before confirming.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="delay-reason" className="text-sm font-semibold">
            Reason for Delay <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="delay-reason"
            placeholder="State the reason for delay..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (touched) setTouched(false);
            }}
            onBlur={() => setTouched(true)}
            className={cn(
              "resize-none",
              isInvalid && "border-red-400 focus-visible:ring-red-400"
            )}
            rows={3}
          />
          {isInvalid && (
            <p className="text-xs text-red-500">Reason for delay is required.</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
