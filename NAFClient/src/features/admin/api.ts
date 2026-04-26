import { api } from "@/shared/api/client";
import type { NAF } from "@/shared/types/api/naf";
import type { ForImplementationItemDTO } from "./types";

export interface UserRoleDTO {
  id: number;
  employeeId: string;
  role: string;
  dateAdded: string;
  dateRemoved: string | null;
}

export interface UserWithRolesDTO {
  employeeId: string;
  location: string;
  roles: UserRoleDTO[];
}

export interface AddUserDTO {
  employeeId: string;
  role: string;
  location: string;
}

export interface AssignLocationDTO {
  employeeId: string;
  location: string;
}

export const adminApi = {
  getUsers: () =>
    api.get<UserWithRolesDTO[]>("/admin/users").then((r) => r.data),

  addUser: (data: AddUserDTO) =>
    api.post("/admin/users", data).then((r) => r.data),

  removeRole: (employeeId: string, role: string) =>
    api.patch(`/admin/users/${employeeId}/roles/${role}/remove`).then((r) => r.data),

  getLocations: () =>
    api.get<string[]>("/admin/locations").then((r) => r.data),

  assignLocation: (data: AssignLocationDTO) =>
    api.post("/admin/locations/assign", data).then((r) => r.data),

  getMyTasks: () =>
    api.get<NAF[]>("/implementations/my-tasks").then((r) => r.data),

  getForImplementations: () =>
    api.get<NAF[]>("/implementations/for-implementations").then((r) => r.data),

  assignToMe: (resourceRequestId: string) =>
    api
      .post<ForImplementationItemDTO>(`/implementations/resource-requests/${resourceRequestId}/assign`)
      .then((r) => r.data),

  setToInProgress: (implementationId: string) =>
    api.patch(`/implementations/${implementationId}/in-progress`).then((r) => r.data),

  setToDelayed: (implementationId: string, delayReason: string) =>
    api.patch(`/implementations/${implementationId}/delayed`, JSON.stringify(delayReason)).then((r) => r.data),

  setToAccomplished: (implementationId: string) =>
    api.patch(`/implementations/${implementationId}/accomplished`).then((r) => r.data),
};
