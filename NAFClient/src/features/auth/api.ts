import { api } from "@/shared/api/client";
import type { AuthUser, LoginRequest } from "@/shared/types/api/auth";

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthUser>("/auth/login", data).then((r) => r.data),

  selectRole: (role: string) =>
    api.post<AuthUser>("/auth/select-role", { role }).then((r) => r.data),

  me: () => api.get<AuthUser>("/auth/me").then((r) => r.data),

  logout: () => api.post("/auth/logout").then((r) => r.data),
};
