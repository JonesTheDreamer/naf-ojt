import { useQuery } from "@tanstack/react-query";
import { departmentsApi } from "../api";

export function useDepartmentEmployees(departmentId: string) {
  return useQuery({
    queryKey: ["admin", "departments", departmentId, "employees"],
    queryFn: () => departmentsApi.getEmployees(departmentId),
    enabled: !!departmentId,
  });
}
