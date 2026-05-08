import { X, Globe, CalendarDays, ExternalLink, Sparkles } from "lucide-react";
import { FieldLabel } from "@/components/ui/field";
import { Select as SelectPrimitive } from "radix-ui";
import { SearchableCombobox } from "@/shared/components/common/SearchableCombobox";
import type { InternetEntry } from "../../hooks/useAddResource";

const OTHER_SENTINEL = "__other__";

interface InternetEntryCardProps {
  entry: InternetEntry;
  index: number;
  allInternetResources: { id: number; name: string; purposeId: number }[];
  allInternetPurposes: { id: number; name: string }[];
  usedInternetResourceIds: number[];
  onChange: (patch: Partial<InternetEntry>) => void;
  onRemove: () => void;
}

export function InternetEntryCard({
  entry, index, allInternetResources, allInternetPurposes, usedInternetResourceIds, onChange, onRemove,
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
    <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-sky-50 border-b border-sky-100">
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-sky-500" />
          <span className="text-xs font-bold text-sky-700 uppercase tracking-wide">Internet Access #{index}</span>
        </div>
        <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors rounded p-0.5">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-4 py-3.5 space-y-3">
        {/* Purpose category */}
        <div className="space-y-1.5">
          <FieldLabel>Purpose Category</FieldLabel>
          <SelectPrimitive.Root value={purposeSelectValue} onValueChange={handlePurposeChange}>
            <SelectPrimitive.Trigger className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm text-left focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors">
              <SelectPrimitive.Value placeholder="Select purpose category…" />
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Content className="z-50 min-w-[8rem] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg">
                <SelectPrimitive.Viewport className="p-1">
                  {availablePurposeIds.map((purposeId) => {
                    const purpose = allInternetPurposes.find((p) => p.id === purposeId);
                    return (
                      <SelectPrimitive.Item key={purposeId} value={purposeId.toString()} className="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none hover:bg-amber-50 hover:text-amber-700">
                        <SelectPrimitive.ItemText>{purpose?.name ?? `Purpose ${purposeId}`}</SelectPrimitive.ItemText>
                      </SelectPrimitive.Item>
                    );
                  })}
                  <SelectPrimitive.Separator className="my-1 h-px bg-muted" />
                  <SelectPrimitive.Item value={OTHER_SENTINEL} className="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none hover:bg-amber-50 hover:text-amber-700 gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <SelectPrimitive.ItemText>Other (add new)</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                </SelectPrimitive.Viewport>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
        </div>

        {/* "Other" mode — new purpose + resource */}
        {entry.isOther ? (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-3.5 space-y-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">New Purpose & Resource</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5 col-span-2">
                <FieldLabel>Purpose Name <span className="text-red-400">*</span></FieldLabel>
                <input type="text" placeholder="e.g. Research" value={entry.newPurposeName} onChange={(e) => onChange({ newPurposeName: e.target.value })} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <FieldLabel>Purpose Description</FieldLabel>
                <input type="text" placeholder="Optional" value={entry.newPurposeDescription} onChange={(e) => onChange({ newPurposeDescription: e.target.value })} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors" />
              </div>
              <div className="space-y-1.5 col-span-2 pt-1 border-t border-amber-200">
                <FieldLabel>Resource Name <span className="text-red-400">*</span></FieldLabel>
                <input type="text" placeholder="e.g. GitHub" value={entry.newResourceName} onChange={(e) => onChange({ newResourceName: e.target.value })} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <FieldLabel>
                  <span className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> URL <span className="text-red-400">*</span>
                  </span>
                </FieldLabel>
                <input type="url" placeholder="https://…" value={entry.newResourceUrl} onChange={(e) => onChange({ newResourceUrl: e.target.value })} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
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

        {/* Purpose of access */}
        <div className="space-y-1.5">
          <FieldLabel>Purpose of Access <span className="text-red-400">*</span></FieldLabel>
          <textarea
            placeholder="Why do you need this resource?"
            value={entry.purpose}
            onChange={(e) => onChange({ purpose: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm resize-none focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors"
          />
        </div>

        {/* Date needed */}
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
