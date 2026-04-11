import { UserPlus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { NAF } from "@/types/api/naf";
import { ImplementationResourceRequestRow } from "./ImplementationResourceRequestRow";

interface Props {
  nafs: NAF[];
  mode: "for-implementations" | "my-tasks";
  onAssign?: (requestId: string) => void;
  onAssignAll?: (requestIds: string[]) => void;
  onMarkDelayed?: (implementationId: string, reason: string) => void;
  onMarkAccomplished?: (implementationId: string) => void;
  isSubmitting?: boolean;
}

export function ImplementationNAFAccordion({
  nafs,
  mode,
  onAssign,
  onAssignAll,
  onMarkDelayed,
  onMarkAccomplished,
  isSubmitting,
}: Props) {
  if (nafs.length === 0) return null;

  return (
    <Accordion type="multiple" className="space-y-2">
      {nafs.map((naf) => {
        const emp = naf.employee;
        const employeeName = [emp.firstName, emp.middleName, emp.lastName]
          .filter(Boolean)
          .join(" ");

        const unassignedIds = naf.resourceRequests
          .filter((rr) => !rr.implementation?.employeeId)
          .map((rr) => rr.id);

        return (
          <AccordionItem
            key={naf.id}
            value={naf.id}
            className="border rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
              <div className="flex flex-col items-start gap-0.5 text-left">
                <span className="text-sm font-semibold">{naf.reference}</span>
                <span className="text-xs text-muted-foreground">
                  {employeeName}
                </span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-4 pt-2 pb-4">
              {naf.resourceRequests.map((rr) => (
                <ImplementationResourceRequestRow
                  key={rr.id}
                  request={rr}
                  mode={mode}
                  onAssign={onAssign}
                  onMarkDelayed={onMarkDelayed}
                  onMarkAccomplished={onMarkAccomplished}
                  isSubmitting={isSubmitting}
                />
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
