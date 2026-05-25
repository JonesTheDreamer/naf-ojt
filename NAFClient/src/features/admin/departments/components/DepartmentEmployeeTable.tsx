import type { DepartmentEmployeeDTO } from "../types";

interface Props {
  employees: DepartmentEmployeeDTO[];
}

export function DepartmentEmployeeTable({ employees }: Props) {
  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Position</th>
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                No employees assigned to this department.
              </td>
            </tr>
          ) : (
            employees.map((emp) => (
              <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">
                  {emp.firstName} {emp.lastName}
                </td>
                <td className="px-4 py-3">{emp.position || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
