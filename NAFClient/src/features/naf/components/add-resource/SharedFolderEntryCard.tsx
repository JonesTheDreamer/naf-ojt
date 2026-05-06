import { X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FieldLabel } from "@/components/ui/field";
import { cn } from "@/shared/utils/utils";
import { CreateOrSelectCombobox } from "@/shared/components/common/CreateOrSelectCombobox";
import type { SharedFolderEntry } from "../../hooks/useAddResource";

interface SharedFolderEntryCardProps {
  entry: SharedFolderEntry;
  allSharedFolders: { id: number; name: string }[];
  usedNames: string[];
  onChange: (patch: Partial<SharedFolderEntry>) => void;
  onRemove: () => void;
}

export function SharedFolderEntryCard({
  entry,
  allSharedFolders,
  usedNames,
  onChange,
  onRemove,
}: SharedFolderEntryCardProps) {
  const options = allSharedFolders
    .filter((f) => !usedNames.map((n) => n.toLowerCase()).includes(f.name.toLowerCase()))
    .map((f) => f.name);

  return (
    <div className="border rounded-md p-3 space-y-2 relative">
      <button
        type="button"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground cursor-pointer"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FieldLabel>Shared Folder</FieldLabel>
          {entry.name && (
            <span
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                entry.isNew
                  ? "bg-amber-50 border border-amber-200 text-amber-700"
                  : "bg-blue-50 border border-blue-200 text-blue-700",
              )}
            >
              {entry.isNew ? "New" : "Existing"}
            </span>
          )}
        </div>
        <CreateOrSelectCombobox
          options={options}
          value={entry.name}
          onChange={(val, isNew) => onChange({ name: val, isNew })}
          placeholder="Search or enter folder name..."
        />
      </div>

      <div className="space-y-1">
        <FieldLabel>Purpose of Access</FieldLabel>
        <Textarea
          placeholder="Describe the purpose of access"
          value={entry.purpose}
          onChange={(e) => onChange({ purpose: e.target.value })}
          rows={2}
        />
      </div>

      <div className="space-y-1">
        <FieldLabel>Date Needed</FieldLabel>
        <input
          type="date"
          value={entry.dateNeeded}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => onChange({ dateNeeded: e.target.value })}
          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        />
      </div>
    </div>
  );
}
