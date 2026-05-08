import { X, Mail, CalendarDays } from "lucide-react";
import { FieldLabel } from "@/components/ui/field";
import { cn } from "@/shared/utils/utils";
import { SearchOrCreateInput } from "@/shared/components/common/SearchOrCreateInput";
import type { GroupEmailEntry } from "../../hooks/useAddResource";

interface GroupEmailEntryCardProps {
  entry: GroupEmailEntry;
  index: number;
  allGroupEmails: { id: number; email: string }[];
  onChange: (patch: Partial<GroupEmailEntry>) => void;
  onRemove: () => void;
}

export function GroupEmailEntryCard({ entry, index, allGroupEmails, onChange, onRemove }: GroupEmailEntryCardProps) {
  const allEmails = allGroupEmails.map((g) => g.email);

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-violet-50 border-b border-violet-100">
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-violet-500" />
          <span className="text-xs font-bold text-violet-700 uppercase tracking-wide">Group Email #{index}</span>
          {entry.email && (
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              entry.isNew
                ? "bg-amber-100 border border-amber-200 text-amber-700"
                : "bg-blue-100 border border-blue-200 text-blue-700",
            )}>
              {entry.isNew ? "New" : "Existing"}
            </span>
          )}
        </div>
        <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors rounded p-0.5">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-4 py-3.5 space-y-3">
        <div className="space-y-1.5">
          <FieldLabel>Group Email <span className="text-red-400">*</span></FieldLabel>
          <SearchOrCreateInput
            options={allEmails}
            value={entry.email}
            onChange={(val, isNew) => onChange({ email: val, isNew })}
            placeholder="Enter email address…"
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Purpose of Access <span className="text-red-400">*</span></FieldLabel>
          <textarea
            placeholder="Why do you need access to this group email?"
            value={entry.purpose}
            onChange={(e) => onChange({ purpose: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm resize-none focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" /> Date Needed <span className="text-slate-400 font-normal">(optional)</span>
            </span>
          </FieldLabel>
          <input
            type="date"
            value={entry.dateNeeded}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => onChange({ dateNeeded: e.target.value })}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
