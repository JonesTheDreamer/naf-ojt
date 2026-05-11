import { useState } from "react";
import HRLayout from "../components/HRLayout";
import { DataTable } from "@/shared/components/ui/datatable";
import { TablePagination } from "@/features/naf/components/tablePagination";
import { useHRNafs } from "../hooks/useHRNafs";
import { hrNafColumns } from "../components/hrNafColumns";

export default function HRNAFHistoryPage() {
  const [page, setPage] = useState(1);
  const { query } = useHRNafs(page);
  const result = query.data;

  return (
    <HRLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-amber-500">NAF History</h1>

        <DataTable
          columns={hrNafColumns}
          data={result?.data ?? []}
          isLoading={query.isLoading}
          emptyMessage="No NAFs found."
        />

        <TablePagination
          currentPage={result?.currentPage ?? 1}
          totalPages={result?.totalPages ?? 1}
          totalCount={result?.totalCount ?? 0}
          pageSize={result?.pageSize ?? 50}
          onPageChange={setPage}
        />
      </div>
    </HRLayout>
  );
}
