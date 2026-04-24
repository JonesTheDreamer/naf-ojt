"use client";

import type { NAF } from "@/shared/types/api/naf";
import type { Employee } from "@/shared/types/api/employee";

import { DataTable } from "@/components/ui/datatable";
import { columns } from "./nafColumns";
import { TablePagination } from "./tablePagination";
import { ApprovalFilterDropdown, type ApprovalFilter } from "./approvalFilter";
import SearchBar from "@/components/common/searchbar";

interface NAFTableContainerProps {
  data: NAF[];
  isLoading?: boolean;

  // Pagination — all four values come directly from the API response
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;

  // Filter
  approvalFilter: ApprovalFilter;
  onApprovalFilterChange: (filter: ApprovalFilter) => void;

  // Search
  fetchEmployeeResults: (query: string) => Promise<Employee[]>;
  onEmployeeSelect: (employee: Employee | null) => void;

  // Row interaction
  onRowClick?: (naf: NAF) => void;
}

export function NAFTableContainer({
  data,
  isLoading,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  approvalFilter,
  onApprovalFilterChange,
  fetchEmployeeResults,
  onEmployeeSelect,
  onRowClick,
}: NAFTableContainerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs text-muted-foreground italic">
          ( Select a row to view Network Access Request Form details )
        </p>

        <div className="flex flex-col items-center gap-3 md:flex-row w-full justify-end">
          <SearchBar<Employee>
            placeholder="Enter NAF Reference Number / Employee Name"
            fetchResults={fetchEmployeeResults}
            onSelect={(emp: Employee) => {
              onEmployeeSelect(emp);
              onPageChange(1);
            }}
            getKey={(emp: Employee) => emp.id}
            getValue={(emp: Employee) =>
              `${emp.lastName}, ${emp.firstName} ${emp.middleName ?? ""}`
            }
            renderItem={(e) => (
              <div className="flex flex-col">
                <span className="text-sm font-medium">{`${e.lastName}, ${e.firstName} ${e.middleName} (${e.id})`}</span>
                <span className="text-xs text-gray-400">{e.position}</span>
              </div>
            )}
          />

          <ApprovalFilterDropdown
            value={approvalFilter}
            onChange={(f: ApprovalFilter) => {
              onApprovalFilterChange(f);
              onPageChange(1);
            }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        onRowClick={onRowClick}
        emptyMessage="No Network Access Forms found."
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  );
}
