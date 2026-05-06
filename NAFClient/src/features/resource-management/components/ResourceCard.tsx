import { Badge } from "@/components/ui/badge";
import type { AdminResourceListItem } from "../types";

interface ResourceCardProps {
  resource: AdminResourceListItem;
  onClick: () => void;
}

export function ResourceCard({ resource, onClick }: ResourceCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border bg-card transition-colors hover:bg-accent/50 ${
        !resource.isActive ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-full shrink-0 mt-0.5"
            style={{ backgroundColor: resource.color }}
          />
          <div>
            <p className="font-medium leading-tight">{resource.name}</p>
            {resource.resourceGroupName && (
              <p className="text-xs text-muted-foreground mt-0.5">{resource.resourceGroupName}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant={resource.isSpecial ? "default" : "secondary"}>
            {resource.isSpecial ? "Special" : "Basic"}
          </Badge>
          {resource.isSpecial && resource.activeWorkflowTemplateVersion > 0 && (
            <span className="text-xs text-muted-foreground">v{resource.activeWorkflowTemplateVersion}</span>
          )}
          {!resource.isActive && (
            <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
          )}
        </div>
      </div>
    </button>
  );
}
