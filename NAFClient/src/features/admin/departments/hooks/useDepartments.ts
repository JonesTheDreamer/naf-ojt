import { useQuery } from "@tanstack/react-query";
import { departmentsApi } from "../api";

export function useDepartments() {
  return useQuery({
    queryKey: ["admin", "departments"],
    queryFn: departmentsApi.getAll,
  });
}

export function useDepartmentDetail(id: string) {
  return useQuery({
    queryKey: ["admin", "departments", id],
    queryFn: () => departmentsApi.getById(id),
    enabled: !!id,
  });
}
