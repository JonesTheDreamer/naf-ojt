import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WorkflowTemplateVersion } from "../types";

interface WorkflowTemplateVersionsProps {
  versions: WorkflowTemplateVersion[];
}

export function WorkflowTemplateVersions({ versions }: WorkflowTemplateVersionsProps) {
  if (versions.length === 0) {
    return <p className="text-sm text-muted-foreground">No workflow templates defined.</p>;
  }

  return (
    <Accordion type="multiple" className="space-y-1">
      {versions.map((v) => (
        <AccordionItem
          key={v.id}
          value={v.id}
          className={`border rounded-md px-3 ${v.isActive ? "border-primary/50 bg-primary/5" : ""}`}
        >
          <AccordionTrigger className="text-sm hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Version {v.version}</span>
              {v.isActive && <Badge className="text-xs">Active</Badge>}
              <span className="text-muted-foreground text-xs">{v.steps.length} step{v.steps.length !== 1 ? "s" : ""}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {v.steps.map((s) => (
                  <TableRow key={s.stepOrder}>
                    <TableCell>{s.stepOrder}</TableCell>
                    <TableCell>{s.stepAction}</TableCell>
                    <TableCell>{s.approverRole.replace(/_/g, " ")}</TableCell>
                    <TableCell>{s.approverEntity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
