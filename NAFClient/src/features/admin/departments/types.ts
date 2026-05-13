export interface DepartmentDTO {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  departmentHeadId: string;
  locationId: number;
  location: string;
}

export interface DepartmentDetailDTO extends DepartmentDTO {
  departmentHeadName: string;
  departmentHeadPosition: string;
}

export interface DepartmentEmployeeDTO {
  employeeId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  position: string;
  nafId: string | null;
  nafReference: string | null;
  nafProgress: string | null;
}

export interface CreateDepartmentDTO {
  code: string;
  name: string;
  departmentHeadId: string;
  locationId: number;
}
