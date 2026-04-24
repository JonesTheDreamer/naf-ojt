import { X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FieldLabel } from "@/components/ui/field";
import { SearchableCombobox } from "@/shared/components/common/SearchableCombobox";
import type { SharedFolderEntry } from "../../hooks/useAddResource";

interface SharedFolderEntryCardProps {
  entry: SharedFolderEntry;
  allSharedFolders: { id: number; name: string; departmentId: string; remarks: string }[];
  usedSharedFolderIds: number[];
  onChange: (patch: Partial<SharedFolderEntry>) => void;
  onRemove: () => void;
}

export function SharedFolderEntryCard({ entry, allSharedFolders, usedSharedFolderIds, onChange, onRemove }: SharedFolderEntryCardProps) {
  const options = allSharedFolders
    .filter((f) => !usedSharedFolderIds.includes(f.id))
    .map((f) => ({ value: f.id, label: `${f.name} — ${f.departmentId} — ${f.remarks}` }));

  return (
    <div className="border rounded-md p-3 space-y-2 relative">
      <button type="button" className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" onClick={onRemove}>
        <X className="h-4 w-4" />
      </button>
      <div className="space-y-1">
        <FieldLabel>Shared Folder</FieldLabel>
        <SearchableCombobox options={options} value={entry.sharedFolderId} onValueChange={(v) => onChange({ sharedFolderId: v })} placeholder="Search shared folders" />
      </div>
      <div className="space-y-1">
        <FieldLabel>Purpose of Access</FieldLabel>
        <Textarea placeholder="Describe the purpose of access" value={entry.purpose} onChange={(e) => onChange({ purpose: e.target.value })} rows={2} />
      </div>
      <div className="space-y-1">
        <FieldLabel>Date Needed</FieldLabel>
        <input type="date" value={entry.dateNeeded} min={new Date().toISOString().split("T")[0]} onChange={(e) => onChange({ dateNeeded: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
      </div>
    </div>
  );
}
