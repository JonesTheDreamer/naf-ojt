import { Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { getDateUrgency } from "@/shared/utils/dateUrgency";
import type { ResourceRequest, ResourceRequestHistory } from "@/shared/types/api/naf";
import { ResourceRequestAction } from "@/shared/types/api/naf";
import { ImplementationStatus } from "@/shared/types/enum/status";
import { Progress } from "@/shared/types/enum/progress";
import { ACTION_CONFIG, formatDateTime, ResourceIcon } from "./resourceRequestUtils";

export function ActionBadge({ type }: { type: ResourceRequestAction }) {
  const cfg = ACTION_CONFIG[type];
  return (
    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", cfg?.className ?? "bg-gray-100 text-gray-600")}>
      {cfg?.label ?? String(type)}
    </span>
  );
}

export function DateUrgencyBadge({ dateNeeded }: { dateNeeded?: string | null }) {
  const urgency = getDateUrgency(dateNeeded);
  if (!urgency) return null;
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full shrink-0", urgency.overdue ? "bg-red-100 text-red-700" : "bg-amber-50 text-amber-700")}>
      {urgency.label}
    </span>
  );
}

export function HistoryTable({ histories }: { histories: ResourceRequestHistory[] }) {
  if (histories.length === 0) return null;
  const sorted = [...histories].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold text-sm">History</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs font-semibold">Date and Time</TableHead>
            <TableHead className="text-xs font-semibold">Action</TableHead>
            <TableHead className="text-xs font-semibold">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((h) => (
            <TableRow key={h.id}>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDateTime(h.createdAt)}</TableCell>
              <TableCell><ActionBadge type={h.type} /></TableCell>
              <TableCell className="text-sm text-muted-foreground">{h.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdditionalInfoBlock({ info }: { info: NonNullable<ResourceRequest["additionalInfo"]> }) {
  if (info.type === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold">Access</p>
        <Select value={info.resource} disabled>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={info.resource}>{info.resource}</SelectItem></SelectContent>
        </Select>
      </div>
    );
  }
  if (info.type === 1) {
    return (
      <div className="text-sm space-y-1">
        <p className="font-semibold">Shared Folder</p>
        <p className="text-muted-foreground">{info.name}</p>
      </div>
    );
  }
  if (info.type === 2) {
    return (
      <div className="text-sm space-y-1">
        <p className="font-semibold">Group Email</p>
        <p className="text-muted-foreground">{info.email}</p>
      </div>
    );
  }
  return null;
}

export function PurposeBlock({ request, onShowHistory }: { request: ResourceRequest; onShowHistory: () => void }) {
  const purpose = request.purposes?.[request.purposes.length - 1]?.purpose;
  const hasPurposeHistory = (request.purposes?.length ?? 0) > 1;
  return (
    <div className="space-y-3">
      {request.dateNeeded && (
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Date Needed</p>
          <p className="text-sm font-medium">
            {new Date(request.dateNeeded).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      )}
      {request.progress == Progress.ACCOMPLISHED && (
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Accomplished At</p>
          <p className="text-sm font-medium">{formatDateTime(request.accomplishedAt)}</p>
        </div>
      )}
      {purpose && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold">Purpose</p>
            {hasPurposeHistory && (
              <Button type="button" size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={onShowHistory}>
                <History className="h-3 w-3" />
                Purpose History
              </Button>
            )}
          </div>
          <Textarea readOnly value={purpose} className="resize-none text-sm bg-background" rows={3} />
        </div>
      )}
      {request.additionalInfo && <AdditionalInfoBlock info={request.additionalInfo} />}
    </div>
  );
}

export function ImplementationBlock({ impl }: { impl: ResourceRequest["implementation"] }) {
  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Implementation</p>
      {!impl || impl.status === ImplementationStatus.OPEN ? (
        <div className="rounded-md border border-dashed p-3 space-y-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">Unassigned</span>
          <p className="text-sm text-muted-foreground">Not yet accepted by a technical team member.</p>
        </div>
      ) : impl.status === ImplementationStatus.IN_PROGRESS ? (
        <div className="rounded-md bg-blue-50 border border-blue-100 p-3 space-y-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">In Progress</span>
          {impl.employeeId && <p className="text-sm">Assigned to: <span className="font-medium">{impl.employeeId}</span></p>}
          {impl.acceptedAt && <p className="text-xs text-muted-foreground">Accepted: {formatDateTime(impl.acceptedAt)}</p>}
        </div>
      ) : impl.status === ImplementationStatus.DELAYED ? (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 space-y-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Delayed</span>
          {impl.employeeId && <p className="text-sm">Assigned to: <span className="font-medium">{impl.employeeId}</span></p>}
          {impl.delayedAt && <p className="text-xs text-muted-foreground">Delayed at: {formatDateTime(impl.delayedAt)}</p>}
          {impl.delayReason && (
            <div>
              <p className="text-xs font-semibold text-yellow-700 mb-0.5">Reason for delay</p>
              <p className="text-sm text-muted-foreground">{impl.delayReason}</p>
            </div>
          )}
        </div>
      ) : impl.status === ImplementationStatus.ACCOMPLISHED ? (
        <div className="rounded-md bg-emerald-50 border border-emerald-100 p-3 space-y-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Accomplished</span>
          {impl.employeeId && <p className="text-sm">Implemented by: <span className="font-medium">{impl.employeeId}</span></p>}
          {impl.accomplishedAt && <p className="text-xs text-muted-foreground">Accomplished: {formatDateTime(impl.accomplishedAt)}</p>}
        </div>
      ) : null}
    </div>
  );
}

export { ResourceIcon };
