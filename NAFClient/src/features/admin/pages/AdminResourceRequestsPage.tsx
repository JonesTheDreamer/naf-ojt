import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, List } from "lucide-react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { DataTable } from "@/shared/components/ui/datatable";
import { TablePagination } from "@/features/naf/components/tablePagination";
import { useAdminResourceRequests } from "../hooks/useAdminResourceRequests";
import { resourceRequestColumns } from "../components/resourceRequestColumns";
import { useAuth } from "@/features/auth/AuthContext";
import { ForScreeningSection } from "../components/ForScreeningSection";
import { ForImplementationSection } from "../components/ForImplementationSection";
import type { AdminResourceRequestDTO } from "../types";

const PROGRESS_TABS = [
  { label: "All", value: "all" },
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "For Screening", value: "FOR_SCREENING" },
  { label: "Implementation", value: "IMPLEMENTATION" },
  { label: "Accomplished", value: "ACCOMPLISHED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Beyond Deadline", value: "beyond_deadline" },
] as const;

export default function AdminResourceRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const locationId = user?.locationId ?? null;
  const employeeId = user?.employeeId ?? "";

  console.log(locationId, employeeId);

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-500">
            Resource Requests
          </h1>
          {user?.location && (
            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{user.location}</span>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="rounded-lg p-2 bg-muted text-muted-foreground">
              <List className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-none">
                All Resource Requests
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {result?.totalCount != null
                  ? `${result.totalCount} total`
                  : "Browse and filter all requests"}
              </p>
            </div>
          </div>

          <div className="flex gap-1.5 flex-wrap px-5 py-3 border-b border-border">
            {PROGRESS_TABS.map((tab) => {
              const isDeadline = tab.value === "beyond_deadline";
              const isActive = progress === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleProgressChange(tab.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? isDeadline
                        ? "bg-red-500 text-white"
                        : "bg-amber-500 text-white"
                      : isDeadline
                        ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 space-y-4">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <ForScreeningSection
            locationId={locationId}
            currentEmployeeId={employeeId}
          />
          <ForImplementationSection locationId={locationId} />
        </div>
      </div>
    </AdminLayout>
  );
}
