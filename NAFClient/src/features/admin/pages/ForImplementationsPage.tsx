import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { DataTable } from "@/shared/components/ui/datatable";
import { useForImplementations } from "../hooks/useForImplementations";
import { useAuth } from "@/features/auth/AuthContext";
import {
  implementationColumns,
  getClosestDateNeeded,
} from "../components/implementationColumns";
import { RoutesEnum } from "@/app/routesEnum";
import type { NAF } from "@/shared/types/api/naf";

export default function ForImplementationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const locationId = user?.locationId ?? null;

  const { forImplementationsQuery } = useForImplementations(locationId);

  const nafs = useMemo(() => {
    const data = forImplementationsQuery.data ?? [];
    return [...data].sort((a, b) => {
      const aDate = getClosestDateNeeded(a);
      const bDate = getClosestDateNeeded(b);
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });
  }, [forImplementationsQuery.data]);

  const handleRowClick = (naf: NAF) => {
    navigate(`${RoutesEnum.ADMIN_FOR_IMPLEMENTATIONS}/${naf.id}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-amber-500">For Implementation</h1>
        <DataTable
          columns={implementationColumns}
          data={nafs}
          isLoading={forImplementationsQuery.isLoading}
          onRowClick={handleRowClick}
          emptyMessage="No items for implementation."
        />
      </div>
    </AdminLayout>
  );
}
