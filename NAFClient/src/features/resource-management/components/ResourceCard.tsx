import type { AdminResourceListItem } from "../types";

interface ResourceCardProps {
  resource: AdminResourceListItem;
  onClick: () => void;
}

export function ResourceCard({ resource, onClick }: ResourceCardProps) {
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left rounded-xl border bg-card transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5 hover:border-amber-200
        ${!resource.isActive ? "opacity-40 grayscale" : ""}`}
    >
      <div className="flex items-stretch overflow-hidden rounded-xl">
        {/* Color accent strip */}
        <div
          className="w-1.5 shrink-0 rounded-l-xl transition-all duration-200 group-hover:w-2"
          style={{ backgroundColor: resource.color }}
        />

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-snug truncate">{resource.name}</p>
              {resource.resourceGroupName ? (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{resource.resourceGroupName}</p>
              ) : (
                <p className="text-xs text-muted-foreground/50 mt-0.5">No group</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase
                  ${resource.isSpecial
                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
              >
                {resource.isSpecial ? "Special" : "Basic"}
              </span>

              {resource.isSpecial && resource.activeWorkflowTemplateVersion > 0 && (
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  v{resource.activeWorkflowTemplateVersion}
                </span>
              )}

              {!resource.isActive && (
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
