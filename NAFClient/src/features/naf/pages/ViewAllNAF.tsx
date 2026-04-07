// features/naf/pages/SubordinateNAFsPage.tsx
import { useState, useCallback } from "react";
import { useEmployeeNAF } from "../hooks/useNAF";
import Layout from "@/components/layout/Layout";
import { CreateNAFDialog } from "../components/createNAFDialog";
import type { Employee } from "@/types/api/employee";
import NAFListPage from "../components/nafList";
import type { PagedResult } from "@/types/common/pagedResult";
import type { NAF } from "@/types/api/naf";
import { useParams } from "react-router-dom";

type ViewAllNAFsProps = {
  employeeId?: string;
};

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

// export default function ViewAllNAF({
//   employeeId = "0011134",
// }: ViewAllNAFsProps) {
export default function ViewAllNAF() {
  const { employeeId } = useParams();
  const [subordinatePage, setSubordinatePage] = useState<number>(1);
  const [approvalPage, setApprovalPage] = useState<number>(1);

  const { subordinateNAFsQuery, approverNAFsQuery, isLoading, isError } =
    useEmployeeNAF({ subordinatePage, approvalPage }, employeeId);

  const subordinateProps = toNAFProps(subordinateNAFsQuery.data, isLoading);
  const approverProps = toNAFProps(approverNAFsQuery.data, isLoading);

  const handleRequestedPageChange = useCallback((page: number) => {
    setSubordinatePage(page);
  }, []);

  const handleApprovalPageChange = useCallback((page: number) => {
    setApprovalPage(page);
  }, []);

  return (
    <Layout>
      <div className="flex flex-col gap-2 md:flex-row md:justify-between">
        <p className="text-2xl text-amber-500 font-bold">
          Network Access Requests
        </p>
        <div>
          <CreateNAFDialog />
        </div>
      </div>

      <NAFListPage
        subordinateNAFsQuery={subordinateProps}
        approverNAFsQuery={approverProps}
        subordinatePage={subordinatePage}
        approvalPage={approvalPage}
        onSubordinatePageChange={handleRequestedPageChange}
        onApprovalPageChange={handleApprovalPageChange}
        fetchEmployeeResults={async (_query: string): Promise<Employee[]> => []}
      />
    </Layout>
  );
}
