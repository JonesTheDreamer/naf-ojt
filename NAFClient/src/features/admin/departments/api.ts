import { api } from "@/shared/api/client";
import type { DepartmentViewDTO, DepartmentEmployeeDTO } from "./types";

export const departmentsApi = {
  getAll: () =>
    api.get<DepartmentViewDTO[]>("/admin/departments").then((r) => r.data),

  getById: (id: string) =>
    api.get<DepartmentViewDTO>(`/admin/departments/${id}`).then((r) => r.data),

  getEmployees: (id: string) =>
    api
      .get<DepartmentEmployeeDTO[]>(`/admin/departments/${id}/employees`)
      .then((r) => r.data),
};
