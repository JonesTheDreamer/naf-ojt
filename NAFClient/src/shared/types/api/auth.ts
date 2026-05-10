export interface AuthUser {
  employeeId: string;
  activeRole: string;
  roles: string[];
  name: string;
  locationId: number;
  location: string;
}

export interface LoginRequest {
  employeeId: string;
}
