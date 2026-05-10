import { Routes, Route, Navigate } from "react-router-dom";
import { RoutesEnum } from "./routesEnum";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";

const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const ViewAllNAF = lazy(() => import("@/features/naf/pages/ViewAllNAF"));
const NAFDetailPage = lazy(() => import("@/features/naf/pages/ViewNAFDetail"));

const AdminHomePage = lazy(
  () => import("@/features/admin/pages/AdminHomePage"),
);
const UsersPage = lazy(() => import("@/features/admin/pages/UsersPage"));
const UserDetailPage = lazy(
  () => import("@/features/admin/pages/UserDetailPage"),
);
const AdminNAFListPage = lazy(
  () => import("@/features/admin/pages/AdminNAFListPage"),
);
const AdminNAFDetailPage = lazy(
  () => import("@/features/admin/pages/AdminNAFDetailPage"),
);
const ForImplementationsPage = lazy(
  () => import("@/features/admin/pages/ForImplementationsPage"),
);
const AdminImplementationDetailPage = lazy(
  () => import("@/features/admin/pages/AdminImplementationDetailPage"),
);
const ResourceListPage = lazy(
  () => import("@/features/resource-management/pages/ResourceListPage"),
);
const ResourceDetailPage = lazy(
  () => import("@/features/resource-management/pages/ResourceDetailPage"),
);

export function AppRouter() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* Login */}
        <Route path={RoutesEnum.LOGIN} element={<LoginPage />} />

        {/* Requestor/Approver routes */}
        <Route
          path={RoutesEnum.NAF}
          element={
            <ProtectedRoute requiredRole="REQUESTOR_APPROVER">
              <ViewAllNAF />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${RoutesEnum.NAF}/:nafId`}
          element={
            <ProtectedRoute requiredRole="REQUESTOR_APPROVER">
              <NAFDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path={RoutesEnum.ADMIN}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_NAF}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminNAFListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_NAF_DETAIL}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminNAFDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_FOR_IMPLEMENTATIONS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ForImplementationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_IMPLEMENTATION_DETAIL}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminImplementationDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_USERS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_USER_DETAIL}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <UserDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_RESOURCES}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ResourceListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_RESOURCE_DETAIL}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ResourceDetailPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to={RoutesEnum.LOGIN} replace />} />
      </Routes>
    </Suspense>
  );
}
