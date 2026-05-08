import { Check, CalendarDays } from "lucide-react";
import type { Resource } from "@/shared/types/api/naf";
import type { BasicResourceWithDate } from "../../hooks/useAddResource";

interface BasicResourceSectionProps {
  availableBasic: Resource[];
  basicResources: BasicResourceWithDate[];
  onChange: (updated: BasicResourceWithDate[]) => void;
  label?: string;
  requiresPurpose?: boolean;
}

export function BasicResourceSection({
  availableBasic,
  basicResources,
  onChange,
  requiresPurpose = false,
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
            <div
              key={r.id}
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
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) =>
                        onChange(basicResources.map((b) => b.id === r.id ? { ...b, dateNeeded: e.target.value } : b))
                      }
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
