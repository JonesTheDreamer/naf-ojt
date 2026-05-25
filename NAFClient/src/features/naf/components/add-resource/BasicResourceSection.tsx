import { useState } from "react";
import { Check, CalendarDays } from "lucide-react";
import type { Resource } from "@/shared/types/api/naf";
import type { BasicResourceWithDate } from "../../hooks/useAddResource";
import { useResourceDateConstraints } from "../../hooks/useResourceDateConstraints";

interface BasicResourceSectionProps {
  availableBasic: Resource[];
  basicResources: BasicResourceWithDate[];
  onChange: (updated: BasicResourceWithDate[]) => void;
  label?: string;
  requiresPurpose?: boolean;
  locationId?: number;
}

interface BasicResourceItemProps {
  r: Resource;
  entry: BasicResourceWithDate | undefined;
  isChecked: boolean;
  basicResources: BasicResourceWithDate[];
  onChange: (updated: BasicResourceWithDate[]) => void;
  requiresPurpose: boolean;
  locationId: number | undefined;
}

function BasicResourceItem({
  r,
  entry,
  isChecked,
  basicResources,
  onChange,
  requiresPurpose,
  locationId,
}: BasicResourceItemProps) {
  const [dateError, setDateError] = useState<string | null>(null);
  const { getMinDate, isDateInvalid } = useResourceDateConstraints(
    isChecked ? r.id : undefined,
    locationId,
  );

  return (
    <div
      className={`rounded-xl border-2 overflow-hidden transition-all duration-150
        ${isChecked
          ? "border-amber-400 bg-amber-50/60 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300"
        }`}
    >
      {/* Resource toggle row */}
      <button
        type="button"
        onClick={() => {
          if (isChecked) {
            setDateError(null);
            onChange(basicResources.filter((b) => b.id !== r.id));
          } else {
            onChange([...basicResources, { id: r.id, dateNeeded: "", purpose: "" }]);
          }
        }}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {/* Color dot */}
        <div
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: r.color ?? "#94a3b8" }}
        />

        {/* Name */}
        <span className={`flex-1 text-sm font-medium ${isChecked ? "text-slate-900" : "text-slate-700"}`}>
          {r.name}
        </span>

        {/* Check indicator */}
        <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 transition-all shrink-0
          ${isChecked
            ? "bg-amber-500 border-amber-500"
            : "border-slate-300 bg-white"
          }`}
        >
          {isChecked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </div>
      </button>

      {/* Expanded fields when checked */}
      {isChecked && (
        <div className="border-t border-amber-200 px-4 pb-3 pt-3 space-y-2.5 bg-white/60">
          {requiresPurpose && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Purpose <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Why is this resource needed?"
                value={entry!.purpose ?? ""}
                onChange={(e) =>
                  onChange(basicResources.map((b) => b.id === r.id ? { ...b, purpose: e.target.value } : b))
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors"
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" />
              Date Needed <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              type="date"
              value={entry!.dateNeeded}
              min={getMinDate()}
              onChange={(e) => {
                const val = e.target.value;
                const error = isDateInvalid(val);
                if (error) {
                  setDateError(error);
                  return;
                }
                setDateError(null);
                onChange(basicResources.map((b) => b.id === r.id ? { ...b, dateNeeded: val } : b));
              }}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors"
            />
            {dateError && (
              <p className="text-xs text-red-500 mt-0.5">{dateError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function BasicResourceSection({
  availableBasic,
  basicResources,
  onChange,
  requiresPurpose = false,
  locationId,
}: BasicResourceSectionProps) {
  if (availableBasic.length === 0) return null;

  const selectedCount = basicResources.length;

  return (
    <div className="space-y-2">
      {selectedCount > 0 && (
        <p className="text-xs text-slate-500 font-medium">
          <span className="text-amber-600 font-bold">{selectedCount}</span> selected
        </p>
      )}

      <div className="grid gap-2">
        {availableBasic.map((r) => {
          const entry = basicResources.find((b) => b.id === r.id);
          const isChecked = !!entry;

          return (
            <BasicResourceItem
              key={r.id}
              r={r}
              entry={entry}
              isChecked={isChecked}
              basicResources={basicResources}
              onChange={onChange}
              requiresPurpose={requiresPurpose}
              locationId={locationId}
            />
          );
        })}
      </div>
    </div>
  );
}
