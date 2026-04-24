import { Pencil, Trash2, RotateCcw, BellRing, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "./resourceRequestUtils";

export function OpenActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <Button size="sm" className="bg-emerald-400 hover:bg-emerald-500 text-white gap-1.5" onClick={onEdit}>
        <Pencil className="h-3.5 w-3.5" /> Edit
      </Button>
      <Button size="sm" className="bg-red-400 hover:bg-red-500 text-white gap-1.5" onClick={onDelete}>
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </Button>
    </div>
  );
}

export function ReminderAction({ onRemind }: { onRemind: () => void }) {
  return (
    <div className="flex justify-end mt-4">
      <Button size="sm" variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100 gap-1.5" onClick={onRemind}>
        Remind Technical Team <BellRing className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function DeactivateAction({ onDeactivate }: { onDeactivate: () => void }) {
  return (
    <div className="flex justify-end mt-4">
      <Button size="sm" className="bg-red-400 hover:bg-red-500 text-white gap-1.5" onClick={onDeactivate}>
        Deactivate Access <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function RejectedActions({ onResubmit, onCancel }: { onResubmit: () => void; onCancel: () => void }) {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100 gap-1.5" onClick={onResubmit}>
          Resubmit <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" className="bg-red-400 hover:bg-red-500 text-white gap-1.5" onClick={onCancel}>
          Cancel Request <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function CancelledBadge({ cancelledAt }: { cancelledAt: string }) {
  return (
    <div className="mt-4 rounded-md bg-gray-50 border border-gray-200 p-3 space-y-0.5">
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">Cancelled</span>
      <p className="text-xs text-muted-foreground pt-1">Cancelled on {formatDateTime(cancelledAt)}</p>
    </div>
  );
}

export function ApproverActions({ onApprove, onReject }: { onApprove: () => void; onReject: () => void }) {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <Button size="sm" className="bg-emerald-400 hover:bg-emerald-500 text-white gap-1.5 min-w-[90px]" onClick={onApprove}>
        Approve <Check className="h-3.5 w-3.5" />
      </Button>
      <Button size="sm" className="bg-red-400 hover:bg-red-500 text-white gap-1.5 min-w-[90px]" onClick={onReject}>
        Reject <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
