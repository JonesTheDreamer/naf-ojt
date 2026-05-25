export type Employee = {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  status: string;
  company?: string;
  position?: string;
  location?: string;
  supervisorId?: string;
  departmentId: string;
  departmentDesc: string;
  departmentHead: string;
};
