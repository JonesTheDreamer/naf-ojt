import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useEmployeeNAF } from "../hooks/useNAF";
import RequestorLayout from "@/components/layout/RequestorLayout";
import type { Employee } from "@/shared/types/api/employee";
import NAFListPage from "../components/nafList";
import type { PagedResult } from "@/shared/types/common/pagedResult";
import type { NAF } from "@/shared/types/api/naf";
import { useAuth } from "@/features/auth/AuthContext";
import { searchDepartmentEmployees } from "@/shared/api/employeeService";
import { getEmployeeNAFs } from "../api";
import { toast } from "sonner";

type NAFProps = PagedResult<NAF> & { isLoading: boolean };

const EMPTY_NAF_PROPS: NAFProps = {
  data: [],
  totalCount: 0,
  pageSize: 6,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
};

function toNAFProps(
  result: PagedResult<NAF> | undefined,
  isLoading: boolean,
): NAFProps {
  if (isLoading || !result) {
    return { ...EMPTY_NAF_PROPS, isLoading };
  }
  return {
    data: result.data ?? [],
    totalCount: result.totalCount ?? 0,
    pageSize: result.pageSize ?? 6,
    currentPage: result.currentPage ?? 1,
    totalPages: result.totalPages ?? 1,
    isLoading,
  };
}

export default function ViewAllNAF() {
  const { user } = useAuth();
  const employeeId = user?.employeeId;
  const [subordinatePage, setSubordinatePage] = useState<number>(1);
  const [approvalPage, setApprovalPage] = useState<number>(1);
  const navigate = useNavigate();

  const { subordinateNAFsQuery, approverNAFsQuery, isLoading } = useEmployeeNAF(
    { subordinatePage, approvalPage },
    employeeId,
  );

  const subordinateProps = toNAFProps(subordinateNAFsQuery.data, isLoading);
  const approverProps = toNAFProps(approverNAFsQuery.data, isLoading);

  const handleRequestedPageChange = useCallback((page: number) => {
    setSubordinatePage(page);
  }, []);

  const handleApprovalPageChange = useCallback((page: number) => {
    setApprovalPage(page);
  }, []);

  const handleEmployeeSelect = useCallback(
    async (employee: Employee) => {
      try {
        const nafs = await getEmployeeNAFs(employee.id);
        if (!nafs.length) {
          toast.error(`No NAF found for ${employee.firstName} ${employee.lastName}.`);
          return;
        }
        const latest = nafs.reduce((a, b) =>
          new Date(a.submittedAt) > new Date(b.submittedAt) ? a : b,
        );
        navigate(`/NAF/${latest.id}`);
      } catch {
        toast.error("Failed to load employee NAF.");
      }
    },
    [navigate],
  );

  return (
    <RequestorLayout>
      <div className="flex flex-col gap-2 md:flex-row md:justify-between">
        <p className="text-2xl text-amber-500 font-bold">
          Network Access Forms
        </p>
      </div>

      <NAFListPage
        subordinateNAFsQuery={subordinateProps}
        approverNAFsQuery={approverProps}
        subordinatePage={subordinatePage}
        approvalPage={approvalPage}
        onSubordinatePageChange={handleRequestedPageChange}
        onApprovalPageChange={handleApprovalPageChange}
        fetchEmployeeResults={(query) =>
          employeeId ? searchDepartmentEmployees(employeeId, query) : Promise.resolve([])
        }
        onEmployeeSelect={handleEmployeeSelect}
      />
    </RequestorLayout>
  );
}
