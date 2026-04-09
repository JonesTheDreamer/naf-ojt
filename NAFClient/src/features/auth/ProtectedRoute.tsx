import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole: string;
  loginPath: string;
}

export function ProtectedRoute({ children, requiredRole, loginPath }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user || user.role !== requiredRole) return <Navigate to={loginPath} replace />;

  return <>{children}</>;
}
