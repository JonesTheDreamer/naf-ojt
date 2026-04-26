import { api } from "@/shared/api/client";
import type { NAF } from "@/shared/types/api/naf";
import type {
  AddUserDTO,
  ForImplementationItemDTO,
  LocationDTO,
  UserDTO,
  UserRoleDetailDTO,
} from "./types";

export const adminApi = {
  // Admin user management
  getUsers: (locationId: number) =>
    api.get<UserDTO[]>(`/admin/users?locationId=${locationId}`).then((r) => r.data),

  addUser: (data: AddUserDTO) =>
    api.post("/admin/users", data).then((r) => r.data),

  // Location management (moved to /user-locations)
  getLocations: () =>
    api.get<LocationDTO[]>("/user-locations").then((r) => r.data),

  assignLocation: (userId: number, locationId: number) =>
    api.post(`/user-locations/${userId}/assign`, locationId).then((r) => r.data),

  // Role management (moved to /user-roles)
  getUserActiveRoles: (userId: number) =>
    api.get<UserRoleDetailDTO[]>(`/user-roles/${userId}/active`).then((r) => r.data),

  removeRole: (userId: number, roleId: number) =>
    api.delete(`/user-roles/${userId}/remove/${roleId}`).then((r) => r.data),

  // Implementation endpoints (unchanged)
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
    api
      .patch(`/implementations/${implementationId}/delayed`, JSON.stringify(delayReason))
      .then((r) => r.data),

  setToAccomplished: (implementationId: string) =>
    api.patch(`/implementations/${implementationId}/accomplished`).then((r) => r.data),
};
