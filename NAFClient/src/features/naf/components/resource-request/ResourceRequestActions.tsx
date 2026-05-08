import { Pencil, Trash2, RotateCcw, BellRing, X, Check } from "lucide-react";
import { formatDateTime } from "./resourceRequestUtils";

const btn = {
  base: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
  emerald: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm",
  red:     "bg-red-400 hover:bg-red-500 text-white shadow-sm",
  amber:   "bg-amber-500 hover:bg-amber-600 text-white shadow-sm",
  yellow:  "bg-yellow-50 border border-yellow-200 text-yellow-800 hover:bg-yellow-100",
  ghost:   "border border-slate-200 text-slate-600 hover:bg-slate-50",
  destructive: "border border-red-200 text-red-500 hover:bg-red-50",
};

export function OpenActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <button className={`${btn.base} ${btn.ghost}`} onClick={onEdit}>
        <Pencil className="h-3.5 w-3.5" /> Edit
      </button>
      <button className={`${btn.base} ${btn.destructive}`} onClick={onDelete}>
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </button>
    </div>
  );
}

export function ReminderAction({ onRemind }: { onRemind: () => void }) {
  return (
    <div className="flex justify-end pt-1">
      <button className={`${btn.base} ${btn.yellow}`} onClick={onRemind}>
        <BellRing className="h-3.5 w-3.5" /> Remind Implementation
      </button>
    </div>
  );
}

export function DeactivateAction({ onDeactivate }: { onDeactivate: () => void }) {
  return (
    <div className="flex justify-end pt-1">
      <button className={`${btn.base} ${btn.destructive}`} onClick={onDeactivate}>
        <X className="h-3.5 w-3.5" /> Deactivate Access
      </button>
    </div>
  );
}

export function RejectedActions({ onResubmit, onCancel }: { onResubmit: () => void; onCancel: () => void }) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <button className={`${btn.base} ${btn.yellow}`} onClick={onResubmit}>
        <RotateCcw className="h-3.5 w-3.5" /> Resubmit
      </button>
      <button className={`${btn.base} ${btn.destructive}`} onClick={onCancel}>
        <X className="h-3.5 w-3.5" /> Cancel Request
      </button>
    </div>
  );
}

export function CancelledBadge({ cancelledAt }: { cancelledAt: string }) {
  return (
    <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cancelled</span>
      <p className="text-xs text-muted-foreground mt-0.5">
        Cancelled on {formatDateTime(cancelledAt)}
      </p>
    </div>
  );
}

export function ApproverActions({ onApprove, onReject }: { onApprove: () => void; onReject: () => void }) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <button className={`${btn.base} ${btn.emerald} min-w-[90px] justify-center`} onClick={onApprove}>
        <Check className="h-3.5 w-3.5" /> Approve
      </button>
      <button className={`${btn.base} ${btn.red} min-w-[90px] justify-center`} onClick={onReject}>
        <X className="h-3.5 w-3.5" /> Reject
      </button>
    </div>
  );
}
