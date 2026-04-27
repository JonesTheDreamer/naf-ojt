import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { DataTable } from "@/shared/components/ui/datatable";
import { TablePagination } from "@/features/naf/components/tablePagination";
import { columns } from "@/features/naf/components/nafColumns";
import { useAdminNAFs } from "../hooks/useAdminNAFs";
import { useAuth } from "@/features/auth/AuthContext";
import type { NAF } from "@/shared/types/api/naf";

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Accomplished", value: "accomplished" },
] as const;

export default function AdminNAFListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const locationId = user?.locationId ?? null;

  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { nafQuery } = useAdminNAFs(locationId, status, page);
  const result = nafQuery.data;

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleRowClick = (naf: NAF) => {
    navigate(`/admin/NAF/${naf.id}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-amber-500">Network Access Requests</h1>

        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusChange(tab.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                status === tab.value
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={result?.data ?? []}
          isLoading={nafQuery.isLoading}
          onRowClick={handleRowClick}
          emptyMessage="No Network Access Forms found."
        />

        <TablePagination
          currentPage={result?.currentPage ?? 1}
          totalPages={result?.totalPages ?? 1}
          totalCount={result?.totalCount ?? 0}
          pageSize={result?.pageSize ?? 20}
          onPageChange={setPage}
        />
      </div>
    </AdminLayout>
  );
}
