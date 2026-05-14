import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { DataTable } from "@/shared/components/ui/datatable";
import { TablePagination } from "@/features/naf/components/tablePagination";
import { columns } from "@/features/naf/components/nafColumns";
import { useAdminNAFs } from "../hooks/useAdminNAFs";
import { useAdminLocations } from "../hooks/useAdminLocations";
import { useAuth } from "@/features/auth/AuthContext";
import type { NAF } from "@/shared/types/api/naf";
import { CreateNAFDialog } from "@/features/naf/components/createNAFDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Accomplished", value: "accomplished" },
] as const;

const ALL_SITES_VALUE = "__all__";

export default function AdminNAFListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [locationId, setLocationId] = useState<number | null>(user?.locationId ?? null);
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { locationsQuery } = useAdminLocations();
  const { nafQuery } = useAdminNAFs(locationId, status, page);
  const result = nafQuery.data;

  const handleLocationChange = (value: string) => {
    setLocationId(value === ALL_SITES_VALUE ? null : Number(value));
    setPage(1);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleRowClick = (naf: NAF) => {
    navigate(`/admin/NAF/${naf.id}`);
  };

  const selectValue = locationId === null ? ALL_SITES_VALUE : String(locationId);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-500">
            Network Access Forms
          </h1>
          <CreateNAFDialog />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
            <MapPin className="w-4 h-4" />
            <span>Site:</span>
          </div>
          <Select value={selectValue} onValueChange={handleLocationChange}>
            <SelectTrigger className="w-48 h-8 text-sm">
              <SelectValue placeholder="Select site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SITES_VALUE}>All Sites</SelectItem>
              {locationsQuery.data?.map((loc) => (
                <SelectItem key={loc.id} value={String(loc.id)}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
          isLoading={nafQuery.isLoading || nafQuery.isFetching}
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
