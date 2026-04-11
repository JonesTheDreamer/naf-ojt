import { UserPlus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { NAF, ResourceRequest } from "@/types/api/naf";
import { ImplementationResourceRequestRow } from "./ImplementationResourceRequestRow";

type EnrichedRequest = ResourceRequest & {
  nafReference: string;
  employeeName: string;
};

interface ResourceGroup {
  resourceId: number;
  resourceName: string;
  requests: EnrichedRequest[];
}

interface Props {
  nafs: NAF[];
  mode: "for-implementations" | "my-tasks";
  onAssign?: (requestId: string) => void;
  onAssignAll?: (requestIds: string[]) => void;
  onMarkDelayed?: (implementationId: string, reason: string) => void;
  onMarkAccomplished?: (implementationId: string) => void;
  isSubmitting?: boolean;
}

function buildResourceGroups(nafs: NAF[]): ResourceGroup[] {
  const groupMap = new Map<number, ResourceGroup>();

  for (const naf of nafs) {
    const emp = naf.employee;
    const employeeName = [emp.firstName, emp.middleName, emp.lastName]
      .filter(Boolean)
      .join(" ");

    for (const rr of naf.resourceRequests) {
      const resourceId = rr.resource.id;
      if (!groupMap.has(resourceId)) {
        groupMap.set(resourceId, {
          resourceId,
          resourceName: rr.resource.name,
          requests: [],
        });
      }
      groupMap.get(resourceId)!.requests.push({
        ...rr,
        nafReference: naf.reference,
        employeeName,
      });
    }
  }

  const groups = Array.from(groupMap.values());
  for (const group of groups) {
    group.requests.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  return groups;
}

export function ImplementationResourceAccordion({
  nafs,
  mode,
  onAssign,
  onAssignAll,
  onMarkDelayed,
  onMarkAccomplished,
  isSubmitting,
}: Props) {
  const groups = buildResourceGroups(nafs);

  if (groups.length === 0) return null;

  return (
    <Accordion type="multiple" className="space-y-2">
      {groups.map((group) => {
        const unassignedIds = group.requests
          .filter((rr) => !rr.implementation?.employeeId)
          .map((rr) => rr.id);

        return (
          <AccordionItem
            key={group.resourceId}
            value={String(group.resourceId)}
            className="border rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
              <span className="text-sm font-semibold">{group.resourceName}</span>
            </AccordionTrigger>

            <AccordionContent className="px-4 pt-2 pb-4">
              {group.requests.map((rr) => (
                <div key={rr.id}>
                  <p className="text-xs text-muted-foreground pt-2 pb-0.5">
                    NAF {rr.nafReference} — {rr.employeeName}
                  </p>
                  <ImplementationResourceRequestRow
                    request={rr}
                    mode={mode}
                    onAssign={onAssign}
                    onMarkDelayed={onMarkDelayed}
                    onMarkAccomplished={onMarkAccomplished}
                    isSubmitting={isSubmitting}
                  />
                </div>
              ))}

              {mode === "for-implementations" && unassignedIds.length > 0 && (
                <div className="flex justify-end mt-3">
                  <Button
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
                    onClick={() => onAssignAll?.(unassignedIds)}
                    disabled={isSubmitting}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Assign All to Me
                  </Button>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
