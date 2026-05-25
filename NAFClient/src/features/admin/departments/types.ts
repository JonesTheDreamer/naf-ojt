import type { Employee } from "@/shared/types/api/employee";

export interface DepartmentViewDTO {
  id: string;
  departmentDesc: string | null;
  departmentHead: string | null;
}

export type DepartmentEmployeeDTO = Pick<
  Employee,
  "id" | "firstName" | "lastName" | "middleName" | "position" | "departmentId"
>;
