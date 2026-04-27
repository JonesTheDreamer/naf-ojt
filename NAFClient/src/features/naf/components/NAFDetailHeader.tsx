import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NAF } from "@/shared/types/api/naf";

function DetailField({ label, value, placeholder = "—" }: { label: string; value?: string | null; placeholder?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      {value ? <p className="text-sm font-medium">{value}</p> : <p className="text-sm text-muted-foreground italic">{placeholder}</p>}
    </div>
  );
}

interface NAFDetailHeaderProps {
  naf: NAF;
  onDeactivate?: () => void;
}

export function NAFDetailHeader({ naf, onDeactivate }: NAFDetailHeaderProps) {
  const employee = naf?.employee;

  if (!employee) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg font-bold">Employee Details</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground italic">Employee details unavailable.</p></CardContent>
      </Card>
    );
  }

  const fullName = [employee.lastName, employee.firstName, employee.middleName].filter(Boolean).join(", ");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 gap-4 flex-wrap">
        <CardTitle className="text-lg font-bold">Employee Details</CardTitle>
        {onDeactivate && (
          <Button size="sm" className="bg-red-400 hover:bg-red-500 text-white gap-1.5 shrink-0" onClick={onDeactivate}>
            Deactivate Access <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
          <div className="space-y-4">
            <DetailField label="Employee Name" value={fullName} />
            <DetailField label="Company" value={employee.company} />
            <DetailField label="Location" value={employee.location} />
          </div>
          <div className="space-y-4">
            <DetailField label="Department" value={employee.departmentDesc ?? employee.departmentId} />
            <DetailField label="Position" value={employee.position} />
            <DetailField label="Domain" value={null} placeholder="No Domain Yet" />
            <DetailField label="Username" value={null} placeholder="No Username Yet" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
