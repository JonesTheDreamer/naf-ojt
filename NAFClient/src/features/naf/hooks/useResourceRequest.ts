import {
  approveResourceRequest,
  deleteResourceRequest,
  editResourceRequestPurpose,
  rejectResourceRequest,
} from "@/services/EntityAPI/resourceRequestService";
import type { NAF, PurposeProps } from "@/types/api/naf";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useResourceRequest = (
  resourceRequestId: string,
  NAFId?: string,
) => {
  const queryClient = useQueryClient();
  const updateResourceRequest = useMutation({
    mutationFn: (purpose: PurposeProps) =>
      editResourceRequestPurpose(resourceRequestId, purpose),
    onSuccess: (updatedRequest) => {
      queryClient.setQueryData<NAF | undefined>(["naf", NAFId], (oldNAF) => {
        if (!oldNAF) return oldNAF;

        return {
          ...oldNAF,
          resourceRequests: oldNAF.resourceRequests.map((req) =>
            req.id === updatedRequest.id ? updatedRequest : req,
          ),
        };
      });

      const nafListQueries = queryClient.getQueriesData<NAF[]>({
        queryKey: ["nafs"],
      });

      nafListQueries.forEach(([key, data]) => {
        if (!data) return;

        queryClient.setQueryData(
          key,
          data.map((naf) =>
            naf.id === NAFId
              ? {
                  ...naf,
                  resourceRequests: naf.resourceRequests.map((req) =>
                    req.id === updatedRequest.id ? updatedRequest : req,
                  ),
                }
              : naf,
          ),
        );
      });
    },
  });

  const removeResourceRequest = useMutation({
    mutationFn: deleteResourceRequest,
    onSuccess: (_data, _id) => {
      queryClient.invalidateQueries({ queryKey: ["nafs"] });
    },
  });

  const approveRequest = useMutation({
    mutationFn: ({ stepId, comment }: { stepId: string; comment?: string }) =>
      approveResourceRequest(stepId, comment),

    onSuccess: (updatedRequest) => {
      const nafListQueries = queryClient.getQueriesData<any>({
        queryKey: ["nafs"],
      });

      nafListQueries.forEach(([key, data]) => {
        if (!data) return;

        queryClient.setQueryData(key, {
          ...data,
          items: data.items.map((naf: NAF) =>
            naf.id === NAFId
              ? {
                  ...naf,
                  resourceRequests: naf.resourceRequests.map((req) =>
                    req.id === resourceRequestId ? updatedRequest : req,
                  ),
                }
              : naf,
          ),
        });
      });
    },
  });

  const rejectRequest = useMutation({
    mutationFn: ({
      stepId,
      reasonForRejection,
    }: {
      stepId: string;
      reasonForRejection: string;
    }) => rejectResourceRequest(stepId, reasonForRejection),

    onSuccess: (updatedRequest) => {
      const nafListQueries = queryClient.getQueriesData<any>({
        queryKey: ["nafs"],
      });

      nafListQueries.forEach(([key, data]) => {
        if (!data) return;

        queryClient.setQueryData(key, {
          ...data,
          items: data.items.map((naf: NAF) =>
            naf.id === NAFId
              ? {
                  ...naf,
                  resourceRequests: naf.resourceRequests.map((req) =>
                    req.id === resourceRequestId ? updatedRequest : req,
                  ),
                }
              : naf,
          ),
        });
      });
    },
  });

  return {
    updateResourceRequestAsync: updateResourceRequest.mutateAsync,
    updateError: updateResourceRequest.isError,
    deleteResourceRequestAsync: removeResourceRequest.mutateAsync,
    deleteError: removeResourceRequest.isError,
    approveRequestAsync: approveRequest.mutateAsync,
    approveRequestError: approveRequest.isError,
    rejectRequestAsync: rejectRequest.mutateAsync,
    rejectRequestError: rejectRequest.isError,
  };
};
