import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  REQUESTOR_APPROVER: "/NAF",
  HR: "/hr",
};

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.activeRole !== requiredRole) {
    const home = ROLE_HOME[user.activeRole] ?? "/login";
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
