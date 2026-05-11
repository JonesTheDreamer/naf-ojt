import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Accordion } from "@/components/ui/accordion";
import type { NAF } from "@/shared/types/api/naf";
import { Progress } from "@/shared/types/enum/progress";
import { ResourceRequestFilterBar, type ProgressFilter } from "@/features/naf/components/resource-request/ResourceRequestFilterBar";
import { ResourceRequestAccordionItem } from "@/features/naf/components/resource-request";
import { adminApi } from "../api";
import {
  approveResourceRequest,
  rejectResourceRequest,
  claimScreeningStep,
} from "@/features/naf/api";
import { useAuth } from "@/features/auth";

function extractErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object" && "error" in data)
    return String((data as { error: unknown }).error);
  return fallback;
}

interface AdminResourceRequestListProps {
  naf: NAF;
}

export function AdminResourceRequestList({
  naf,
}: AdminResourceRequestListProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUser = user?.employeeId ?? "";
  const nafQueryKey = ["naf", naf.id];
  const [filter, setFilter] = useState<ProgressFilter>("all");
  const [showInactive, setShowInactive] = useState(false);

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

  const filteredRequests = naf.resourceRequests.filter((r) => {
    const isInactive = !r.isActive || !!r.cancelledAt;
    if (filter === "all") return showInactive ? true : !isInactive;
    return (r.progress as unknown as Progress) === filter;
  });

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Requests</h2>
      <ResourceRequestFilterBar
        selected={filter}
        showInactive={showInactive}
        onChange={setFilter}
        onToggleInactive={setShowInactive}
      />
      <Accordion type="multiple" className="space-y-2">
        {filteredRequests.map((req) => {
          const currentStep = req.steps.find(
            (s) => s.stepOrder === req.currentStep,
          );
          const stepApproverId = currentStep?.approverId;
          const isCurrentApprover =
            !!stepApproverId &&
            !!currentUser &&
            stepApproverId.trim().toLowerCase() === currentUser.trim().toLowerCase();

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
