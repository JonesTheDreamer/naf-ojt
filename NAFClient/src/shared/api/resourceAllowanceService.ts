import { api } from "./client";
import type {
  ResourceRequestAllowance,
  CreateResourceRequestAllowanceDTO,
  UpdateResourceRequestAllowanceDTO,
} from "@/shared/types/api/resourceRequestAllowance";

export const resourceAllowanceService = {
  getAll: () =>
    api.get<ResourceRequestAllowance[]>("/admin/resource-allowances").then((r) => r.data),

  getById: (id: number) =>
    api.get<ResourceRequestAllowance>(`/admin/resource-allowances/${id}`).then((r) => r.data),

  create: (dto: CreateResourceRequestAllowanceDTO) =>
    api.post<ResourceRequestAllowance>("/admin/resource-allowances", dto).then((r) => r.data),

  update: (id: number, dto: UpdateResourceRequestAllowanceDTO) =>
    api.put<ResourceRequestAllowance>(`/admin/resource-allowances/${id}`, dto).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/admin/resource-allowances/${id}`),

  getByResourceId: (resourceId: number) =>
    api
      .get<ResourceRequestAllowance[]>("/admin/resource-allowances")
      .then((r) => r.data.filter((a) => a.resourceId === resourceId)),

  getForResourceAndLocation: (resourceId: number, locationId: number) =>
    api
      .get<ResourceRequestAllowance[]>("/admin/resource-allowances")
      .then((r) => r.data.find((a) => a.resourceId === resourceId && a.locationId === locationId) ?? null),
};
