import { Routes, Route, Navigate } from "react-router-dom";
import { RoutesEnum } from "./routesEnum";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";

const ViewAllNAF = lazy(() => import("@/features/naf/pages/ViewAllNAF"));
const NAFDetailPage = lazy(() => import("@/features/naf/pages/ViewNAFDetail"));

const AdminLoginPage = lazy(
  () => import("@/features/auth/pages/AdminLoginPage"),
);
const RequestorLoginPage = lazy(
  () => import("@/features/auth/pages/RequestorLoginPage"),
);

const AdminHomePage = lazy(
  () => import("@/features/admin/pages/AdminHomePage"),
);
const RolesPage = lazy(() => import("@/features/admin/pages/RolesPage"));
const LocationsPage = lazy(
  () => import("@/features/admin/pages/LocationsPage"),
);

const ForImplementationsPage = lazy(
  () => import("@/features/admin/pages/ForImplementationsPage"),
);

export function AppRouter() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* Login routes */}
        <Route path={RoutesEnum.LOGIN_ADMIN} element={<AdminLoginPage />} />
        {/* <Route path={RoutesEnum.LOGIN_TECH} element={<TechTeamLoginPage />} /> */}
        <Route
          path={RoutesEnum.LOGIN_REQUESTOR}
          element={<RequestorLoginPage />}
        />

        {/* Requestor/Approver routes */}
        <Route
          path={RoutesEnum.NAF}
          element={
            <ProtectedRoute
              requiredRole="REQUESTOR_APPROVER"
              loginPath={RoutesEnum.LOGIN_REQUESTOR}
            >
              <ViewAllNAF />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${RoutesEnum.NAF}/:nafId`}
          element={
            <ProtectedRoute
              requiredRole="REQUESTOR_APPROVER"
              loginPath={RoutesEnum.LOGIN_REQUESTOR}
            >
              <NAFDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path={RoutesEnum.ADMIN}
          element={
            <ProtectedRoute
              requiredRole="ADMIN"
              loginPath={RoutesEnum.LOGIN_ADMIN}
            >
              <AdminHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path={RoutesEnum.ADMIN_FOR_IMPLEMENTATIONS}
          element={
            <ProtectedRoute
              requiredRole="ADMIN"
              loginPath={RoutesEnum.LOGIN_TECH}
            >
              <ForImplementationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={RoutesEnum.ADMIN_NAF}
          element={
            <ProtectedRoute
              requiredRole="ADMIN"
              loginPath={RoutesEnum.LOGIN_TECH}
            >
              <ForImplementationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_ROLES}
          element={
            <ProtectedRoute
              requiredRole="ADMIN"
              loginPath={RoutesEnum.LOGIN_ADMIN}
            >
              <RolesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_LOCATIONS}
          element={
            <ProtectedRoute
              requiredRole="ADMIN"
              loginPath={RoutesEnum.LOGIN_ADMIN}
            >
              <LocationsPage />
            </ProtectedRoute>
          }
        />

        {/* Technical Team routes
        <Route
          path={RoutesEnum.TECH}
          element={
            <ProtectedRoute
              requiredRole="TECHNICAL_TEAM"
              loginPath={RoutesEnum.LOGIN_TECH}
            >
              <TechTeamHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.TECH_MY_TASKS}
          element={
            <ProtectedRoute
              requiredRole="TECHNICAL_TEAM"
              loginPath={RoutesEnum.LOGIN_TECH}
            >
              <MyTasksPage />
            </ProtectedRoute>
          }
        /> */}

        <Route
          path="*"
          element={<Navigate to={RoutesEnum.LOGIN_REQUESTOR} replace />}
        />
      </Routes>
    </Suspense>
  );
}
