import { X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FieldLabel } from "@/components/ui/field";
import { SearchableCombobox } from "@/shared/components/common/SearchableCombobox";
import type { GroupEmailEntry } from "../../hooks/useAddResource";

interface GroupEmailEntryCardProps {
  entry: GroupEmailEntry;
  allGroupEmails: { id: number; email: string; departmentId: string }[];
  usedGroupEmailIds: number[];
  onChange: (patch: Partial<GroupEmailEntry>) => void;
  onRemove: () => void;
}

export function GroupEmailEntryCard({ entry, allGroupEmails, usedGroupEmailIds, onChange, onRemove }: GroupEmailEntryCardProps) {
  const options = allGroupEmails
    .filter((g) => !usedGroupEmailIds.includes(g.id))
    .map((g) => ({ value: g.id, label: `${g.email} — ${g.departmentId}` }));

  return (
    <div className="border rounded-md p-3 space-y-2 relative">
      <button type="button" className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" onClick={onRemove}>
        <X className="h-4 w-4" />
      </button>
      <div className="space-y-1">
        <FieldLabel>Group Email</FieldLabel>
        <SearchableCombobox options={options} value={entry.groupEmailId} onValueChange={(v) => onChange({ groupEmailId: v })} placeholder="Search group emails" />
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
