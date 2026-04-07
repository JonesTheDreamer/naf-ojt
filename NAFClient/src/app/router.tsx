import { Routes, Route } from "react-router-dom";
import { RoutesEnum } from "./routesEnum";
import { lazy, Suspense } from "react";
// import { CreateNAF } from "@/features/naf/pages/CreateNAF";

export function AppRouter() {
  const ViewAllNAF = lazy(() => import("@/features/naf/pages/ViewAllNAF"));
  const NAFDetailPage = lazy(
    () => import("@/features/naf/pages/ViewNAFDetail"),
  );
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route
          path={`${RoutesEnum.NAF}/:employeeId`}
          element={<ViewAllNAF />}
        />
        <Route
          path={`${RoutesEnum.NAF}/:employeeId/:nafId`}
          element={<NAFDetailPage />}
        />
        {/* <Route path={RoutesEnum.CREATENAF} element={<CreateNAF />} /> */}
      </Routes>
    </Suspense>
  );
}
