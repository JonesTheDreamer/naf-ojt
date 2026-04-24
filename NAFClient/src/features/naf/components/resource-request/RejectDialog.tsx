import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/utils/utils";

export function RejectDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const isInvalid = touched && reason.trim() === "";

  const handleOpenChange = (val: boolean) => {
    if (!val) { setReason(""); setTouched(false); }
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-500">Reject Request</DialogTitle>
          <DialogDescription>A reason for rejection is required before submitting.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="reject-reason" className="text-sm font-semibold">
            Reason for Rejection <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="reject-reason"
            placeholder="State the reason for rejection..."
            value={reason}
            onChange={(e) => { setReason(e.target.value); if (touched) setTouched(false); }}
            onBlur={() => setTouched(true)}
            className={cn("resize-none", isInvalid && "border-red-400 focus-visible:ring-red-400")}
            rows={3}
          />
          {isInvalid && <p className="text-xs text-red-500">Reason for rejection is required.</p>}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button className="bg-red-400 hover:bg-red-500 text-white gap-1.5" onClick={handleConfirm} disabled={isSubmitting}>
            <X className="h-4 w-4" /> {isSubmitting ? "Rejecting..." : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
