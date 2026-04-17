import {
  approveResourceRequest,
  cancelResourceRequest,
  createResourceRequest,
  deleteResourceRequest,
  editResourceRequestPurpose,
  rejectResourceRequest,
} from "@/services/EntityAPI/resourceRequestService";
import type { NAF, PurposeProps } from "@/types/api/naf";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
      toast.success("Purpose updated");
    },
    onError: () => toast.error("Failed to update purpose"),
  });

  const removeResourceRequest = useMutation({
    mutationFn: deleteResourceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      queryClient.invalidateQueries({ queryKey: ["approverNAFs"] });
      toast.success("Resource removed");
    },
    onError: () => toast.error("Failed to remove resource"),
  });

  const approveRequest = useMutation({
    mutationFn: ({ stepId, comment }: { stepId: string; comment?: string }) =>
      approveResourceRequest(stepId, comment),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      queryClient.invalidateQueries({ queryKey: ["approverNAFs"] });
      toast.success("Request approved");
    },
    onError: () => toast.error("Failed to approve request"),
  });

  const rejectRequest = useMutation({
    mutationFn: ({
      stepId,
      reasonForRejection,
    }: {
      stepId: string;
      reasonForRejection: string;
    }) => rejectResourceRequest(stepId, reasonForRejection),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      queryClient.invalidateQueries({ queryKey: ["approverNAFs"] });
      toast.success("Request rejected");
    },
    onError: () => toast.error("Failed to reject request"),
  });

  const cancelRequest = useMutation({
    mutationFn: () => cancelResourceRequest(resourceRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      toast.success("Request cancelled");
    },
    onError: () => toast.error("Failed to cancel request"),
  });

  const createRequest = useMutation({
    mutationFn: (payload: { nafId: string; resourceId: number; purpose: string; dateNeeded?: string | null }) =>
      createResourceRequest({ ...payload, additionalInfo: {} }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      toast.success("New resource request created");
    },
    onError: () => toast.error("Failed to create resource request"),
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
    cancelRequestAsync: cancelRequest.mutateAsync,
    cancelRequestError: cancelRequest.isError,
    createRequestAsync: createRequest.mutateAsync,
    createRequestError: createRequest.isError,
  };
};
