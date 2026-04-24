import { Checkbox } from "@/components/ui/checkbox";
import { FieldLabel } from "@/components/ui/field";
import type { Resource } from "@/shared/types/api/naf";
import type { BasicResourceWithDate } from "../../hooks/useAddResource";

interface BasicResourceSectionProps {
  availableBasic: Resource[];
  basicResources: BasicResourceWithDate[];
  onChange: (updated: BasicResourceWithDate[]) => void;
}

export function BasicResourceSection({ availableBasic, basicResources, onChange }: BasicResourceSectionProps) {
  if (availableBasic.length === 0) return null;

  return (
    <section className="space-y-2">
      <p className="text-sm font-semibold text-amber-500">BASIC RESOURCES</p>
      <div className="flex flex-col gap-2">
        {availableBasic.map((r) => {
          const entry = basicResources.find((b) => b.id === r.id);
          const isChecked = !!entry;
          return (
            <div key={r.id} className="border rounded-md p-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`basic-${r.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...basicResources, { id: r.id, dateNeeded: "" }]);
                    } else {
                      onChange(basicResources.filter((b) => b.id !== r.id));
                    }
                  }}
                />
                <FieldLabel htmlFor={`basic-${r.id}`}>{r.name}</FieldLabel>
              </div>
              {isChecked && (
                <input
                  type="date"
                  value={entry!.dateNeeded}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    onChange(basicResources.map((b) => b.id === r.id ? { ...b, dateNeeded: e.target.value } : b))
                  }
                  className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
