import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentsApi } from "../api";

export function useDepartmentEmployees(departmentId: number) {
  return useQuery({
    queryKey: ["admin", "departments", departmentId, "employees"],
    queryFn: () => departmentsApi.getEmployees(departmentId),
    enabled: !!departmentId,
  });
}

export function useDepartmentEmployeeMutations(departmentId: number) {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["admin", "departments", departmentId, "employees"],
    });

  const addMutation = useMutation({
    mutationFn: (employeeId: string) =>
      departmentsApi.addEmployee(departmentId, employeeId),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (employeeId: string) =>
      departmentsApi.removeEmployee(departmentId, employeeId),
    onSuccess: invalidate,
  });

  return { addMutation, removeMutation };
}
