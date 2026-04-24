import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { queryClient } from "@/app/queryClient";
import {
  getSubordinateNAFs,
  getApproverNAFs,
  getNAF,
  getEmployeeNAFs,
  createNAF,
  deactivateNAF,
} from "@/services/EntityAPI/nafService";
import { toast } from "sonner";

import type { NAF } from "@/shared/types/api/naf";
import type { PagedResult } from "@/shared/types/common/pagedResult";

type PaginationObject = {
  subordinatePage: number;
  approvalPage: number;
};

export const useEmployeeNAF = (
  { subordinatePage, approvalPage }: PaginationObject,
  employeeId?: string,
) => {
  const subordinateNAFsQuery = useQuery<PagedResult<NAF>, Error>({
    queryKey: ["subordinateNAFs", employeeId, subordinatePage],
    queryFn: () => getSubordinateNAFs(employeeId!, subordinatePage ?? 1),
    enabled: !!employeeId,
    staleTime: 1000 * 60 * 5,
  });

  const approverNAFsQuery = useQuery<PagedResult<NAF>, Error>({
    queryKey: ["approverNAFs", employeeId, approvalPage],
    queryFn: () => getApproverNAFs(employeeId!, approvalPage),
    enabled: !!employeeId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    subordinateNAFsQuery,
    approverNAFsQuery,
    isLoading: subordinateNAFsQuery.isLoading || approverNAFsQuery.isLoading,
    isError: subordinateNAFsQuery.isError || approverNAFsQuery.isError,
  };
};

type UseNAFParams = {
  employeeId?: string;
  nafId?: string;
};

export const useNAF = ({ employeeId, nafId }: UseNAFParams) => {
  const queryClient = useQueryClient();

  const nafQuery = useQuery<NAF, Error>({
    queryKey: ["naf", nafId],
    queryFn: () => getNAF(nafId!),
    enabled: !!nafId,
    initialData: () => {
      const queries = queryClient.getQueriesData<PagedResult<NAF>>({
        queryKey: ["nafs"],
      });

      for (const [, data] of queries) {
        const found = data?.data.find((n) => n.id === nafId);
        if (found) return found;
      }

      return undefined;
    },
  });

  const employeeNAFs = useQuery<NAF[], Error>({
    queryKey: ["employeeNAF", employeeId],
    queryFn: () => getEmployeeNAFs(employeeId!),
    enabled: !!employeeId,
    staleTime: 1000 * 60 * 5,
  });

  const createNAFMutation = useMutation({
    mutationFn: (payload: {
      employeeId: string;
      requestorId: string;
      hardwareId: number;
      dateNeeded?: string | null;
    }) => createNAF(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      queryClient.invalidateQueries({ queryKey: ["employeeNAF"] });
      toast.success("NAF created successfully");
    },
    onError: (error) => {
      console.error(error.message);
      toast.error("Failed to create NAF");
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => deactivateNAF(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      queryClient.invalidateQueries({ queryKey: ["employeeNAF"] });
      toast.success("NAF deactivated");
    },
    onError: (error) => {
      console.error(error.message);
      toast.error("Failed to deactivate NAF");
    },
  });

  return {
    nafQuery,
    employeeNAFs,
    createNAF: createNAFMutation.mutate,
    createNAFAsync: createNAFMutation.mutateAsync,
    createError: createNAFMutation.isError,
    deactivateNAFAsync: deactivate.mutateAsync,
    deactivateNAFError: deactivate.isError,
    isLoading: nafQuery.isLoading || employeeNAFs.isLoading,
    isError: nafQuery.isError || employeeNAFs.isLoading,
  };
};
