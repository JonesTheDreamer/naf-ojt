import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentsApi } from "../api";
import type { CreateDepartmentDTO } from "../types";

export function useDepartments(locationId?: number) {
  return useQuery({
    queryKey: ["admin", "departments", locationId ?? "all"],
    queryFn: () => departmentsApi.getAll(locationId),
  });
}

export function useDepartmentDetail(id: number) {
  return useQuery({
    queryKey: ["admin", "departments", id],
    queryFn: () => departmentsApi.getById(id),
    enabled: !!id,
  });
}

export function useDepartmentMutations() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "departments"] });

  const createMutation = useMutation({
    mutationFn: (data: CreateDepartmentDTO) => departmentsApi.create(data),
    onSuccess: invalidate,
  });

  const changeHeadMutation = useMutation({
    mutationFn: ({ id, employeeId }: { id: number; employeeId: string }) =>
      departmentsApi.changeHead(id, employeeId),
    onSuccess: invalidate,
  });

  const setInactiveMutation = useMutation({
    mutationFn: (id: number) => departmentsApi.setInactive(id),
    onSuccess: invalidate,
  });

  return { createMutation, changeHeadMutation, setInactiveMutation };
}
