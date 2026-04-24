import { useState } from "react";
import { Check } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ApproveDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (remarks: string) => void;
  isSubmitting?: boolean;
}) {
  const [remarks, setRemarks] = useState("");

  const handleOpenChange = (val: boolean) => {
    if (!val) setRemarks("");
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-emerald-600">Approve Request</DialogTitle>
          <DialogDescription>You are about to approve this resource request. You may optionally add remarks before submitting.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="approve-remarks" className="text-sm font-semibold">
            Remarks <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea id="approve-remarks" placeholder="Add any remarks here..." value={remarks} onChange={(e) => setRemarks(e.target.value)} className="resize-none" rows={3} />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5" onClick={() => { onConfirm(remarks); setRemarks(""); }} disabled={isSubmitting}>
            <Check className="h-4 w-4" /> {isSubmitting ? "Approving..." : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
