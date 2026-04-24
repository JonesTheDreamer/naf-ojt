export type Employee = {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  status: string;
  company: string;
  hiredDate?: string;
  regularizedDate?: string;
  separatedDate?: string;
  position: string;
  location: string;
  supervisorId?: string;
  departmentHeadId?: string;
  departmentId?: string;
  departmentDesc?: string;
};
