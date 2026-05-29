import {
  approveResourceRequest,
  cancelResourceRequest,
  changeResource,
  createResourceRequest,
  deactivateResourceRequest,
  deleteResourceRequest,
  editResourceRequestPurpose,
  rejectResourceRequest,
} from "../api";
import type { NAF, PurposeProps } from "@/shared/types/api/naf";
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
  });

  const removeResourceRequest = useMutation({
    mutationFn: deleteResourceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      queryClient.invalidateQueries({ queryKey: ["approverNAFs"] });
      toast.success("Resource removed");
    },
  });

  const changeResourceRequest = useMutation({
    mutationFn: (payload: { resourceId: number; purpose?: string; dateNeeded?: string | null }) =>
      changeResource(resourceRequestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
      toast.success("Resource request changed!");
    },
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
  });

  const cancelRequest = useMutation({
    mutationFn: () => cancelResourceRequest(resourceRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      toast.success("Request cancelled");
    },
  });

  const deactivateRequest = useMutation({
    mutationFn: () => deactivateResourceRequest(resourceRequestId),
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
      toast.success("Resource deactivated");
    },
  });

  const createRequest = useMutation({
    mutationFn: (payload: {
      nafId: string;
      resourceId: number;
      purpose: string;
      dateNeeded?: string | null;
    }) => createResourceRequest({ ...payload, additionalInfo: {} }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      toast.success("New resource request created");
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
    cancelRequestAsync: cancelRequest.mutateAsync,
    cancelRequestError: cancelRequest.isError,
    createRequestAsync: createRequest.mutateAsync,
    createRequestError: createRequest.isError,
    changeResourceAsync: changeResourceRequest.mutateAsync,
    changeResourceError: changeResourceRequest.isError,
    deactivateRequestAsync: deactivateRequest.mutateAsync,
    deactivateRequestError: deactivateRequest.isError,
  };
};
