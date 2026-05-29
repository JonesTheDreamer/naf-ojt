import { api } from "./client";
import type { Employee } from "@/shared/types/api/employee";

export const searchEmployees = async (match: string): Promise<Employee[]> => {
  try {
    return (await api.get(`/employees/search/${match}`)).data;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const searchDepartmentEmployees = async (
  employeeId: string,
  match: string,
): Promise<Employee[]> => {
  try {
    return (await api.get(`/employees/${employeeId}/department/search/${match}`))
      .data;
  } catch (error) {
    console.log(error);
    return [];
  }
};
