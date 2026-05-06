import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Accordion } from "@/components/ui/accordion";
import type { NAF } from "@/shared/types/api/naf";
import { ResourceRequestAccordionItem } from "@/features/naf/components/resource-request";
import { adminApi } from "../api";
import {
  approveResourceRequest,
  rejectResourceRequest,
  claimScreeningStep,
} from "@/features/naf/api";

function extractErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object" && "error" in data)
    return String((data as { error: unknown }).error);
  return fallback;
}

interface AdminResourceRequestListProps {
  naf: NAF;
  currentUser: string;
}

export function AdminResourceRequestList({
  naf,
  currentUser,
}: AdminResourceRequestListProps) {
  const queryClient = useQueryClient();
  const nafQueryKey = ["naf", naf.id];

  const claimStep = useMutation({
    mutationFn: (stepId: string) => claimScreeningStep(stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nafQueryKey });
      toast.success("Screening step claimed");
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, "Failed to claim step"));
    },
  });

  const approveRequest = useMutation({
    mutationFn: ({ stepId, comment }: { stepId: string; comment?: string }) =>
      approveResourceRequest(stepId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nafQueryKey });
      toast.success("Request approved");
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, "Failed to approve request"));
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
      queryClient.invalidateQueries({ queryKey: nafQueryKey });
      toast.success("Request rejected");
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, "Failed to reject request"));
    },
  });

  const acceptImplementation = useMutation({
    mutationFn: (resourceRequestId: string) =>
      adminApi.assignToMe(resourceRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nafQueryKey });
      toast.success("Task accepted");
    },
    onError: () => toast.error("Failed to accept task"),
  });

  const setToInProgress = useMutation({
    mutationFn: (implementationId: string) =>
      adminApi.setToInProgress(implementationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nafQueryKey });
      toast.success("Set to In Progress");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const setToDelayed = useMutation({
    mutationFn: ({
      implementationId,
      delayReason,
    }: {
      implementationId: string;
      delayReason: string;
    }) => adminApi.setToDelayed(implementationId, delayReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nafQueryKey });
      toast.success("Marked as Delayed");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const setToAccomplished = useMutation({
    mutationFn: (implementationId: string) =>
      adminApi.setToAccomplished(implementationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nafQueryKey });
      toast.success("Marked as Accomplished");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const isImplSubmitting =
    acceptImplementation.isPending ||
    setToInProgress.isPending ||
    setToDelayed.isPending ||
    setToAccomplished.isPending;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Requests</h2>
      <Accordion type="multiple" className="space-y-2">
        {naf.resourceRequests.map((req) => {
          const currentStep = req.steps.find(
            (s) => s.stepOrder === req.currentStep,
          );
          const isCurrentApprover =
            currentStep?.approverId === currentUser &&
            currentStep?.approverId !== null;

          return (
            <ResourceRequestAccordionItem
              key={req.id}
              request={req}
              isCurrentApprover={isCurrentApprover}
              isApprover={isCurrentApprover}
              isRequestor={false}
              onClaim={(stepId) => claimStep.mutate(stepId)}
              isClaiming={claimStep.isPending}
              onApprove={(_requestId, remarks) => {
                const step = req.steps.find(
                  (s) => s.stepOrder === req.currentStep,
                );
                if (step)
                  approveRequest.mutate({
                    stepId: step.id,
                    comment: remarks || undefined,
                  });
              }}
              onReject={(_requestId, reason) => {
                const step = req.steps.find(
                  (s) => s.stepOrder === req.currentStep,
                );
                if (step)
                  rejectRequest.mutate({
                    stepId: step.id,
                    reasonForRejection: reason,
                  });
              }}
              onAccept={(resourceRequestId) =>
                acceptImplementation.mutate(resourceRequestId)
              }
              onSetToInProgress={(implId) => setToInProgress.mutate(implId)}
              onSetToDelayed={(implId, reason) =>
                setToDelayed.mutate({ implementationId: implId, delayReason: reason })
              }
              onSetToAccomplished={(implId) => setToAccomplished.mutate(implId)}
              isSubmittingImpl={isImplSubmitting}
            />
          );
        })}
      </Accordion>
    </div>
  );
}
