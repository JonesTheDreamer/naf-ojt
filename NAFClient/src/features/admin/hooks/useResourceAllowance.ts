import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resourceAllowanceService } from "../../../shared/api/resourceAllowanceService";
import type {
  CreateResourceRequestAllowanceDTO,
  UpdateResourceRequestAllowanceDTO,
} from "../../../shared/types/api/resourceRequestAllowance";
import { api } from "../../../shared/api/client";

export const useResourceAllowances = () =>
  useQuery({
    queryKey: ["resource-allowances"],
    queryFn: resourceAllowanceService.getAll,
  });

export const useResourceAllowancesByResource = (resourceId: number) =>
  useQuery({
    queryKey: ["resource-allowances", resourceId],
    queryFn: () => resourceAllowanceService.getByResourceId(resourceId),
    enabled: resourceId > 0,
  });

export const useCreateAllowance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateResourceRequestAllowanceDTO) =>
      resourceAllowanceService.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resource-allowances"] }),
  });
};

export const useUpdateAllowance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: number;
      dto: UpdateResourceRequestAllowanceDTO;
    }) => resourceAllowanceService.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resource-allowances"] }),
  });
};

export const useDeleteAllowance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => resourceAllowanceService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resource-allowances"] }),
  });
};

export const useRefreshCache = () =>
  useMutation({
    mutationFn: () => api.post("/admin/cache/refresh"),
  });

export const useToggleLocationWeekend = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, allow }: { id: number; allow: boolean }) =>
      api.put(`/admin/locations/${id}/weekend`, allow),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "locations"] });
      qc.invalidateQueries({ queryKey: ["admin", "admin-locations"] });
    },
  });
};
