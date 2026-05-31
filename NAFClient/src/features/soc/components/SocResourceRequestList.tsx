import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Accordion } from "@/components/ui/accordion";
import type { NAF } from "@/shared/types/api/naf";
import { ResourceRequestAccordionItem } from "@/features/naf/components/resource-request";
import {
  approveResourceRequest,
  rejectResourceRequest,
  claimSocStep,
} from "@/features/naf/api";
import { useAuth } from "@/features/auth";
import { StepAction } from "@/shared/types/enum/stepAction";

interface SocResourceRequestListProps {
  naf: NAF;
}

export function SocResourceRequestList({ naf }: SocResourceRequestListProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUser = user?.employeeId ?? "";
  const nafQueryKey = ["naf", naf.id];

  const claimSoc = useMutation({
    mutationFn: (stepId: string) => claimSocStep(stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nafQueryKey });
      queryClient.invalidateQueries({ queryKey: ["soc", "for-soc-review"] });
      toast.success("SOC review step claimed");
    },
  });

  const approveRequest = useMutation({
    mutationFn: ({ stepId, comment }: { stepId: string; comment?: string }) =>
      approveResourceRequest(stepId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nafQueryKey });
      queryClient.invalidateQueries({ queryKey: ["soc", "for-soc-review"] });
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
      queryClient.invalidateQueries({ queryKey: nafQueryKey });
      queryClient.invalidateQueries({ queryKey: ["soc", "for-soc-review"] });
      toast.success("Request rejected");
    },
  });

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Requests</h2>
      <Accordion type="multiple" className="space-y-2">
        {naf.resourceRequests.map((req) => {
          const currentStep = req.steps.find(
            (s) => s.stepOrder === req.currentStep,
          );
          const isSocStep =
            currentStep?.stepAction === StepAction.FOR_SOC_REVIEW;
          const stepApproverId = currentStep?.approverId;
          const isCurrentApprover =
            isSocStep &&
            !!stepApproverId &&
            !!currentUser &&
            stepApproverId.trim().toLowerCase() ===
              currentUser.trim().toLowerCase();

          return (
            <ResourceRequestAccordionItem
              key={req.id}
              request={req}
              isCurrentApprover={isCurrentApprover}
              isApprover={isCurrentApprover}
              isRequestor={false}
              onClaimSoc={(stepId) => claimSoc.mutate(stepId)}
              isClaiming={claimSoc.isPending}
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
            />
          );
        })}
      </Accordion>
    </div>
  );
}
