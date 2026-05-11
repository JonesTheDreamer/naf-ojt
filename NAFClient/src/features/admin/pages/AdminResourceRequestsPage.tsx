import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { DataTable } from "@/shared/components/ui/datatable";
import { TablePagination } from "@/features/naf/components/tablePagination";
import { useAdminResourceRequests } from "../hooks/useAdminResourceRequests";
import { resourceRequestColumns } from "../components/resourceRequestColumns";
import { useAuth } from "@/features/auth/AuthContext";
import type { AdminResourceRequestDTO } from "../types";

const PROGRESS_TABS = [
  { label: "All", value: "all" },
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "For Screening", value: "FOR_SCREENING" },
  { label: "Implementation", value: "IMPLEMENTATION" },
  { label: "Accomplished", value: "ACCOMPLISHED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Not Accomplished", value: "NOT_ACCOMPLISHED" },
  { label: "Cancelled", value: "CANCELLED" },
] as const;

export default function AdminResourceRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const locationId = user?.locationId ?? null;

  const [progress, setProgress] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { query } = useAdminResourceRequests(locationId, progress, page);
  const result = query.data;

  const handleProgressChange = (value: string) => {
    setProgress(value);
    setPage(1);
  };

  const handleRowClick = (row: AdminResourceRequestDTO) => {
    navigate(`/admin/NAF/${row.nafId}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-amber-500">Resource Requests</h1>

        <div className="flex gap-2 flex-wrap">
          {PROGRESS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleProgressChange(tab.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                progress === tab.value
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <DataTable
          columns={resourceRequestColumns}
          data={result?.data ?? []}
          isLoading={query.isLoading}
          onRowClick={handleRowClick}
          emptyMessage="No resource requests found."
        />

        <TablePagination
          currentPage={result?.currentPage ?? 1}
          totalPages={result?.totalPages ?? 1}
          totalCount={result?.totalCount ?? 0}
          pageSize={result?.pageSize ?? 10}
          onPageChange={setPage}
        />
      </div>
    </AdminLayout>
  );
}
