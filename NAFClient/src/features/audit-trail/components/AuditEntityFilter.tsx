import { ENTITY_TABS, getEntityMeta, type EntityTabValue } from "./entityConfig";

interface AuditEntityFilterProps {
  active: string;
  onChange: (value: EntityTabValue) => void;
}

export function AuditEntityFilter({ active, onChange }: AuditEntityFilterProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {ENTITY_TABS.map((tab) => {
        const isActive = active === tab.value;
        const meta = tab.value !== "all" ? getEntityMeta(tab.value) : null;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? "bg-amber-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {meta && (
              <span className={isActive ? "text-white" : ""}>{meta.icon}</span>
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
