import { X, FolderOpen, CalendarDays } from "lucide-react";
import { FieldLabel } from "@/components/ui/field";
import { cn } from "@/shared/utils/utils";
import { SearchOrCreateInput } from "@/shared/components/common/SearchOrCreateInput";
import type { SharedFolderEntry } from "../../hooks/useAddResource";

interface SharedFolderEntryCardProps {
  entry: SharedFolderEntry;
  index: number;
  allSharedFolders: { id: number; name: string }[];
  onChange: (patch: Partial<SharedFolderEntry>) => void;
  onRemove: () => void;
}

export function SharedFolderEntryCard({ entry, index, allSharedFolders, onChange, onRemove }: SharedFolderEntryCardProps) {
  const allNames = allSharedFolders.map((f) => f.name);

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 border-b border-emerald-100">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Shared Folder #{index}</span>
          {entry.name && (
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
          <FieldLabel>Folder Name <span className="text-red-400">*</span></FieldLabel>
          <SearchOrCreateInput
            options={allNames}
            value={entry.name}
            onChange={(val, isNew) => onChange({ name: val, isNew })}
            placeholder="Enter shared folder name…"
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Purpose of Access <span className="text-red-400">*</span></FieldLabel>
          <textarea
            placeholder="Why do you need access to this folder?"
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
