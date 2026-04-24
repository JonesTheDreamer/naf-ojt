import { api } from "../api";
import type { AuthUser, LoginRequest } from "@/shared/types/api/auth";

export const authService = {
  loginAdmin: (data: LoginRequest) =>
    api.post<AuthUser>("/auth/login/admin", data).then((r) => r.data),

  loginTechnicalTeam: (data: LoginRequest) =>
    api.post<AuthUser>("/auth/login/technical-team", data).then((r) => r.data),

  loginRequestorApprover: (data: LoginRequest) =>
    api.post<AuthUser>("/auth/login/requestor-approver", data).then((r) => r.data),

  me: () => api.get<AuthUser>("/auth/me").then((r) => r.data),

  logout: () => api.post("/auth/logout").then((r) => r.data),
};
