import { api } from "@/shared/api/client";

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

export const adminService = {
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
};
