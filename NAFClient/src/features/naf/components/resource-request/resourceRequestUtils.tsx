export function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function ResourceIcon({ iconUrl, name }: { iconUrl: string; name: string }) {
  return (
    <img
      src={iconUrl}
      alt={name}
      className="h-5 w-5 object-contain shrink-0"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

import { ResourceRequestAction } from "@/shared/types/api/naf";

export const ACTION_CONFIG: Record<
  ResourceRequestAction,
  { label: string; className: string }
> = {
  [ResourceRequestAction.APPROVE]: { label: "Approved", className: "bg-emerald-100 text-emerald-700" },
  [ResourceRequestAction.REJECT]: { label: "Rejected", className: "bg-red-100 text-red-600" },
  [ResourceRequestAction.DELAY]: { label: "Delayed", className: "bg-yellow-100 text-yellow-700" },
  [ResourceRequestAction.ACCEPT]: { label: "Accepted", className: "bg-blue-100 text-blue-700" },
  [ResourceRequestAction.ACCOMPLISH]: { label: "Accomplished", className: "bg-emerald-100 text-emerald-700" },
  [ResourceRequestAction.EDITED]: { label: "Edited", className: "bg-gray-100 text-gray-600" },
  [ResourceRequestAction.CANCELLED]: { label: "Cancelled", className: "bg-gray-50 border-gray-200" },
};
