import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import type { PagedResult } from "@/shared/types/common/pagedResult";
import type { NAF } from "@/shared/types/api/naf";
import type { Employee } from "@/shared/types/api/employee";
import type { ApprovalFilter } from "@/features/naf/components/approvalFilter";
import { NAFTableContainer } from "@/features/naf/components/nafTableContainer";

interface NAFListPageProps {
  subordinateNAFsQuery: PagedResult<NAF> & { isLoading: boolean };
  approverNAFsQuery: PagedResult<NAF> & { isLoading: boolean };
  subordinatePage: number;
  approvalPage: number;
  onSubordinatePageChange: (page: number) => void;
  onApprovalPageChange: (page: number) => void;
  fetchEmployeeResults: (query: string) => Promise<Employee[]>;
  onEmployeeSelect: (employee: Employee) => void;
}

// Empty fallback so the table never receives undefined
const EMPTY_RESULT: PagedResult<NAF> = {
  data: [],
  totalCount: 0,
  pageSize: 6,
  currentPage: 1,
  totalPages: 1,
};

export default function NAFListPage({
  subordinateNAFsQuery,
  approverNAFsQuery,
  fetchEmployeeResults,
  subordinatePage,
  approvalPage,
  onSubordinatePageChange,
  onApprovalPageChange,
  onEmployeeSelect,
}: NAFListPageProps) {
  const navigate = useNavigate();

  const [approvalFilter, setApprovalFilter] =
    useState<ApprovalFilter>("subordinates");

  // Derive the active query result and its page setter from the current filter
  const { activeResult, currentPage, handlePageChange } = useMemo(() => {
    if (approvalFilter === "subordinates") {
      return {
        activeResult: subordinateNAFsQuery ?? EMPTY_RESULT,
        currentPage: subordinatePage,
        handlePageChange: onSubordinatePageChange,
      };
    }
    return {
      activeResult: approverNAFsQuery ?? EMPTY_RESULT,
      currentPage: approvalPage,
      handlePageChange: onApprovalPageChange,
    };
  }, [
    approvalFilter,
    subordinateNAFsQuery,
    approverNAFsQuery,
    subordinatePage,
    approvalPage,
  ]);

  const handleApprovalFilterChange = useCallback((filter: ApprovalFilter) => {
    setApprovalFilter(filter);
    // Intentionally does NOT reset pages — each view remembers its position
  }, []);

  const handleRowClick = useCallback(
    (naf: NAF) => {
      navigate(`/naf/${naf.id}`);
    },
    [navigate],
  );

  return (
    <div className="p-6 space-y-3">
      <NAFTableContainer
        data={activeResult.data}
        isLoading={activeResult.isLoading}
        currentPage={currentPage}
        totalPages={activeResult.totalPages}
        totalCount={activeResult.totalCount}
        pageSize={activeResult.pageSize}
        onPageChange={handlePageChange}
        approvalFilter={approvalFilter}
        onApprovalFilterChange={handleApprovalFilterChange}
        fetchEmployeeResults={fetchEmployeeResults}
        onEmployeeSelect={onEmployeeSelect}
        onRowClick={handleRowClick}
      />
    </div>
  );
}
