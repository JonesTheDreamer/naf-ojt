import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";
import { toast } from "sonner";

export function useForImplementations(locationId: number | null) {
  const queryClient = useQueryClient();
  const queryKey = ["admin", "for-implementations", locationId];

  const forImplementationsQuery = useQuery({
    queryKey,
    queryFn: () => adminApi.getForImplementations(locationId!),
    enabled: locationId != null,
  });

  const acceptMutation = useMutation({
    mutationFn: (resourceRequestId: string) =>
      adminApi.assignToMe(resourceRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Task accepted");
    },
    onError: () => toast.error("Failed to accept task"),
  });

  const setToInProgressMutation = useMutation({
    mutationFn: (implementationId: string) =>
      adminApi.setToInProgress(implementationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Set to In Progress");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const setToDelayedMutation = useMutation({
    mutationFn: ({
      implementationId,
      delayReason,
    }: {
      implementationId: string;
      delayReason: string;
    }) => adminApi.setToDelayed(implementationId, delayReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Marked as Delayed");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const setToAccomplishedMutation = useMutation({
    mutationFn: (implementationId: string) =>
      adminApi.setToAccomplished(implementationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Marked as Accomplished");
    },
    onError: () => toast.error("Failed to update status"),
  });

  return {
    forImplementationsQuery,
    acceptMutation,
    setToInProgressMutation,
    setToDelayedMutation,
    setToAccomplishedMutation,
  };
}
