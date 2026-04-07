import { api } from "../api";
import type { Employee } from "@/types/api/employee";

export const searchEmployees = async (match: string): Promise<Employee[]> => {
  try {
    return (await api.get(`/employees/search/${match}`)).data;
  } catch (error) {
    console.log(error);
    return [];
  }
};
