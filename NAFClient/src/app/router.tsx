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
const ResourceListPage = lazy(
  () => import("@/features/resource-management/pages/ResourceListPage"),
);
const ResourceDetailPage = lazy(
  () => import("@/features/resource-management/pages/ResourceDetailPage"),
);
const AdminResourceRequestsPage = lazy(
  () => import("@/features/admin/pages/AdminResourceRequestsPage"),
);
const DepartmentListPage = lazy(
  () => import("@/features/admin/departments/pages/DepartmentListPage"),
);
const DepartmentDetailPage = lazy(
  () => import("@/features/admin/departments/pages/DepartmentDetailPage"),
);
const AuditTrailPage = lazy(
  () => import("@/features/audit-trail/pages/AuditTrailPage"),
);
const SharedFolderListPage = lazy(
  () => import("@/features/shared-folders/pages/SharedFolderListPage"),
);
const SharedFolderDetailPage = lazy(
  () => import("@/features/shared-folders/pages/SharedFolderDetailPage"),
);
const HRNAFHistoryPage = lazy(
  () => import("@/features/hr/pages/HRNAFHistoryPage"),
);
const HRCreateNAFPage = lazy(
  () => import("@/features/hr/pages/HRCreateNAFPage"),
);
const SocQueuePage = lazy(() => import("@/features/soc/pages/SocQueuePage"));
const SocNAFDetailPage = lazy(
  () => import("@/features/soc/pages/SocNAFDetailPage"),
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
        <Route
          path={RoutesEnum.ADMIN_RESOURCE_REQUESTS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminResourceRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_DEPARTMENTS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DepartmentListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_DEPARTMENT_DETAIL}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DepartmentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_AUDIT_TRAIL}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AuditTrailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_SHARED_FOLDERS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <SharedFolderListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.ADMIN_SHARED_FOLDER_DETAIL}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <SharedFolderDetailPage />
            </ProtectedRoute>
          }
        />

        {/* HR routes */}
        <Route
          path={RoutesEnum.HR}
          element={
            <ProtectedRoute requiredRole="HR">
              <HRNAFHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.HR_CREATE}
          element={
            <ProtectedRoute requiredRole="HR">
              <HRCreateNAFPage />
            </ProtectedRoute>
          }
        />

        {/* SOC routes */}
        <Route
          path={RoutesEnum.SOC}
          element={
            <ProtectedRoute requiredRole="SOC">
              <SocQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path={RoutesEnum.SOC_NAF_DETAIL}
          element={
            <ProtectedRoute requiredRole="SOC">
              <SocNAFDetailPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to={RoutesEnum.LOGIN} replace />} />
      </Routes>
    </Suspense>
  );
}
