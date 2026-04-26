export interface AuthUser {
  employeeId: string;
  role: string;
  name: string;
  locationId: number;
  location: string;
}

export interface LoginRequest {
  employeeId: string;
}
