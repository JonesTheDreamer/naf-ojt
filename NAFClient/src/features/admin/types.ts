import type { Progress } from "@/shared/types/enum/progress";

export interface ForImplementationItemDTO {
  id: string;
  nafId: string;
  progress: string;
  resourceName: string;
  implementationId: string | null;
  implementationStatus: "OPEN" | "IN_PROGRESS" | "DELAYED" | "ACCOMPLISHED" | null;
  assignedTo: string | null;
}

export interface UserDTO {
  id: number;
  employeeId: string;
  lastName: string;
  firstName: string;
  middleName: string | null;
  company: string;
  position: string;
  departmentId: number;
  department: string;
  locationId: number;
  location: string;
  roles: string[];
}

export interface LocationDTO {
  id: number;
  name: string;
  isActive: boolean;
}

export interface CreateUserDTO {
  role: string;
  locationId: number;
}

export interface UserRoleDetailDTO {
  id: number;
  roleId: number;
  role: string;
  userId: number;
  isActive: boolean;
  dateAdded: string;
  dateRemoved: string | null;
}

export interface AdminResourceRequestDTO {
  id: string;
  nafId: string;
  nafReference: string;
  employeeName: string;
  resourceName: string;
  progress: Progress;
  dateNeeded?: string;
  createdAt: string;
}
