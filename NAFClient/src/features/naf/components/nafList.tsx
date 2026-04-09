import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { PagedResult } from "@/types/common/pagedResult";
import type { NAF } from "@/types/api/naf";
import type { Employee } from "@/types/api/employee";
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
}: NAFListPageProps) {
  const navigate = useNavigate();

  const [approvalFilter, setApprovalFilter] =
    useState<ApprovalFilter>("subordinates");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

  // Derive the active query result and its page setter from the current filter
  const { activeResult, currentPage, handlePageChange } = useMemo(() => {
    if (approvalFilter === "subordinates") {
      return {
        activeResult: subordinateNAFsQuery ?? EMPTY_RESULT,
        // isLoading: subordinateNAFsQuery.isLoading,
        currentPage: subordinatePage,
        handlePageChange: onSubordinatePageChange,
      };
    }
    return {
      activeResult: approverNAFsQuery ?? EMPTY_RESULT,
      // isLoading: approverNAFsQuery.isLoading,
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

  const handleEmployeeSelect = useCallback(
    (employee: Employee | null) => {
      setSelectedEmployee(employee);
      // Reset both views when scoping to a new employee
      onSubordinatePageChange(1);
      onApprovalPageChange(1);
    },
    [onSubordinatePageChange, onApprovalPageChange],
  );

  // handleClearEmployeeFilter removed (unused)

  const handleRowClick = useCallback(
    (naf: NAF) => {
      navigate(`/naf/${naf.id}`);
    },
    [navigate],
  );

  return (
    <div className="p-6 space-y-3">
      {selectedEmployee && <ActiveEmployeeFilter employee={selectedEmployee} />}

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
        onEmployeeSelect={handleEmployeeSelect}
        onRowClick={handleRowClick}
      />
    </div>
  );
}

// Active employee filter badge
function ActiveEmployeeFilter({ employee }: { employee: Employee }) {
  const displayName = [
    employee.lastName,
    employee.firstName,
    employee.middleName ? `${employee.middleName}.` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Filtering by employee:</span>
      <Badge
        variant="secondary"
        className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full"
      >
        <span className="font-medium text-foreground">{displayName}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 rounded-full hover:bg-muted"
          //   onClick={onClear}
          aria-label="Clear employee filter"
        >
          <X className="h-3 w-3" />
        </Button>
      </Badge>
    </div>
  );
}
