import { api } from "@/shared/api/client";
import type {
  CreateDepartmentDTO,
  DepartmentDTO,
  DepartmentDetailDTO,
  DepartmentEmployeeDTO,
} from "./types";

export const departmentsApi = {
  getAll: (locationId?: number) =>
    api
      .get<DepartmentDTO[]>("/admin/departments", {
        params: locationId ? { locationId } : undefined,
      })
      .then((r) => r.data),

  getById: (id: number) =>
    api.get<DepartmentDetailDTO>(`/admin/departments/${id}`).then((r) => r.data),

  create: (data: CreateDepartmentDTO) =>
    api.post<DepartmentDTO>("/admin/departments", data).then((r) => r.data),

  changeHead: (id: number, employeeId: string) =>
    api
      .put<DepartmentDTO>(`/admin/departments/${id}/head`, JSON.stringify(employeeId))
      .then((r) => r.data),

  setInactive: (id: number) =>
    api.put(`/admin/departments/${id}/inactive`).then((r) => r.data),

  getEmployees: (id: number) =>
    api
      .get<DepartmentEmployeeDTO[]>(`/admin/departments/${id}/employees`)
      .then((r) => r.data),

  addEmployee: (id: number, employeeId: string) =>
    api
      .post(`/admin/departments/${id}/employees`, { employeeId })
      .then((r) => r.data),

  removeEmployee: (id: number, employeeId: string) =>
    api
      .delete(`/admin/departments/${id}/employees/${employeeId}`)
      .then((r) => r.data),
};
