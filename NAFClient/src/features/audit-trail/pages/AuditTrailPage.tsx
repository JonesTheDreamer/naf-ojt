import { useState, useCallback } from "react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { TablePagination } from "@/features/naf/components/tablePagination";
import { useAuditTrails } from "../hooks/useAuditTrails";
import { AuditSearchBar } from "../components/AuditSearchBar";
import { AuditEntityFilter } from "../components/AuditEntityFilter";
import { AuditLogList } from "../components/AuditLogList";
import type { EntityTabValue } from "../components/entityConfig";

export default function AuditTrailPage() {
  const [entity, setEntity] = useState<EntityTabValue>("all");
  const [page, setPage] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [search, setSearch] = useState("");

  const { query } = useAuditTrails(search, entity, page);
  const result = query.data;

  const handleEntityChange = (value: EntityTabValue) => {
    setEntity(value);
    setPage(1);
  };

  const handleSearch = useCallback(() => {
    setSearch(inputValue);
    setPage(1);
  }, [inputValue]);

  const handleClearSearch = () => {
    setInputValue("");
    setSearch("");
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-amber-500">Audit Trail</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            A chronological log of all system activity.
          </p>
        </div>

        <AuditSearchBar
          value={inputValue}
          onChange={setInputValue}
          onSearch={handleSearch}
          onClear={handleClearSearch}
        />

        <AuditEntityFilter active={entity} onChange={handleEntityChange} />

        {!query.isLoading && result && (
          <p className="text-xs text-muted-foreground">
            {result.totalCount === 0
              ? "No entries found."
              : `${result.totalCount.toLocaleString()} entr${result.totalCount === 1 ? "y" : "ies"} found`}
            {search && (
              <span>
                {" "}for "
                <span className="font-medium text-foreground">{search}</span>"
              </span>
            )}
          </p>
        )}

        <AuditLogList
          entries={result?.data ?? []}
          isLoading={query.isLoading}
          hasActiveFilter={!!search || entity !== "all"}
        />

        {result && result.totalPages > 1 && (
          <TablePagination
            currentPage={result.currentPage}
            totalPages={result.totalPages}
            totalCount={result.totalCount}
            pageSize={result.pageSize}
            onPageChange={setPage}
          />
        )}
      </div>
    </AdminLayout>
  );
}
