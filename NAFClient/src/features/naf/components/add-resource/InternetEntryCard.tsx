import { X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FieldLabel } from "@/components/ui/field";
import { Select as SelectPrimitive } from "radix-ui";
import { SearchableCombobox } from "@/shared/components/common/SearchableCombobox";
import type { InternetEntry } from "../../hooks/useAddResource";

const OTHER_SENTINEL = "__other__";

interface InternetEntryCardProps {
  entry: InternetEntry;
  allInternetResources: { id: number; name: string; purposeId: number }[];
  allInternetPurposes: { id: number; name: string }[];
  usedInternetResourceIds: number[];
  onChange: (patch: Partial<InternetEntry>) => void;
  onRemove: () => void;
}

export function InternetEntryCard({
  entry,
  allInternetResources,
  allInternetPurposes,
  usedInternetResourceIds,
  onChange,
  onRemove,
}: InternetEntryCardProps) {
  const availablePurposeIds = Array.from(
    new Set(allInternetResources.filter((r) => !usedInternetResourceIds.includes(r.id)).map((r) => r.purposeId)),
  );

  const resourcesForPurpose = allInternetResources.filter(
    (r) => r.purposeId === entry.internetPurposeId && !usedInternetResourceIds.includes(r.id),
  );

  const purposeSelectValue = entry.isOther ? OTHER_SENTINEL : (entry.internetPurposeId?.toString() ?? "");

  const handlePurposeChange = (v: string) => {
    if (v === OTHER_SENTINEL) {
      onChange({ isOther: true, internetPurposeId: null, internetResourceId: null });
    } else {
      onChange({ isOther: false, internetPurposeId: Number(v), internetResourceId: null, newPurposeName: "", newPurposeDescription: "", newResourceName: "", newResourceUrl: "", newResourceDescription: "" });
    }
  };

  return (
    <div className="border rounded-md p-3 space-y-2 relative">
      <button type="button" className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" onClick={onRemove}>
        <X className="h-4 w-4" />
      </button>
      <div className="space-y-1">
        <FieldLabel>Purpose Category</FieldLabel>
        <SelectPrimitive.Root value={purposeSelectValue} onValueChange={handlePurposeChange}>
          <SelectPrimitive.Trigger className="flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
            <SelectPrimitive.Value placeholder="Select purpose category" />
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
              <SelectPrimitive.Viewport className="p-1">
                {availablePurposeIds.map((purposeId) => {
                  const purpose = allInternetPurposes.find((p) => p.id === purposeId);
                  return (
                    <SelectPrimitive.Item key={purposeId} value={purposeId.toString()} className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent">
                      <SelectPrimitive.ItemText>{purpose?.name ?? `Purpose ${purposeId}`}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  );
                })}
                <SelectPrimitive.Separator className="my-1 h-px bg-muted" />
                <SelectPrimitive.Item value={OTHER_SENTINEL} className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent italic text-muted-foreground">
                  <SelectPrimitive.ItemText>Other (add new)</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>

      {entry.isOther ? (
        <div className="rounded-md border border-dashed border-amber-300 bg-amber-50/40 p-3 space-y-2">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">New Purpose</p>
          <div className="space-y-1">
            <FieldLabel>Purpose Name <span className="text-red-500">*</span></FieldLabel>
            <input type="text" placeholder="e.g. Research" value={entry.newPurposeName} onChange={(e) => onChange({ newPurposeName: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1">
            <FieldLabel>Purpose Description</FieldLabel>
            <input type="text" placeholder="Optional description" value={entry.newPurposeDescription} onChange={(e) => onChange({ newPurposeDescription: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide pt-1">New Internet Resource</p>
          <div className="space-y-1">
            <FieldLabel>Resource Name <span className="text-red-500">*</span></FieldLabel>
            <input type="text" placeholder="e.g. GitHub" value={entry.newResourceName} onChange={(e) => onChange({ newResourceName: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1">
            <FieldLabel>URL <span className="text-red-500">*</span></FieldLabel>
            <input type="url" placeholder="https://..." value={entry.newResourceUrl} onChange={(e) => onChange({ newResourceUrl: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
          <div className="space-y-1">
            <FieldLabel>Resource Description</FieldLabel>
            <input type="text" placeholder="Optional description" value={entry.newResourceDescription} onChange={(e) => onChange({ newResourceDescription: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <FieldLabel>Internet Resource</FieldLabel>
          <SearchableCombobox
            options={resourcesForPurpose.map((r) => ({ value: r.id, label: r.name }))}
            value={entry.internetResourceId}
            onValueChange={(v) => onChange({ internetResourceId: v })}
            placeholder="Select internet resource"
            disabled={entry.internetPurposeId === null}
          />
        </div>
      )}

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
