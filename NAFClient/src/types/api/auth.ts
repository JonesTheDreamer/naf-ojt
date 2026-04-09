export interface AuthUser {
  employeeId: string;
  role: string;
  name: string;
}

export interface LoginRequest {
  employeeId: string;
}
