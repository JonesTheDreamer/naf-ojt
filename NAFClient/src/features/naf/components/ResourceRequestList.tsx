import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { STALE_TIME } from "@/shared/constants/queryConstants";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type {
  NAF,
  ResourceGroup,
  ResourceRequest,
  PurposeProps,
} from "@/shared/types/api/naf";
import { Progress } from "@/shared/types/enum/progress";
import { getResourceGroups } from "@/shared/api/resourceService";
import { useResourceRequest } from "../hooks/useResourceRequest";
import { ResourceRequestAccordionItem } from "./resource-request";
import {
  ResourceRequestFilterBar,
  type ProgressFilter,
} from "./resource-request/ResourceRequestFilterBar";
import { AddResourceDialog } from "./add-resource";

interface RequestItemWrapperProps {
  naf: NAF;
  request: ResourceRequest;
  currentUserId: string;
  resourceGroups: ResourceGroup[];
  onRemind: (id: string) => void;
}

function RequestItemWrapper({
  naf,
  request,
  currentUserId,
  resourceGroups,
  onRemind,
}: RequestItemWrapperProps) {
  const {
    updateResourceRequestAsync,
    deleteResourceRequestAsync,
    approveRequestAsync,
    rejectRequestAsync,
    cancelRequestAsync,
    changeResourceAsync,
    deactivateRequestAsync,
  } = useResourceRequest(request.id, request.nafId);

  const handleEdit = async (
    _requestId: string,
    _nafId: string,
    purpose: PurposeProps,
  ) => {
    try {
      await updateResourceRequestAsync(purpose);
    } catch (error) {
      console.error("Failed to update resource request:", error);
    }
  };

  const handleResubmit = async (
    _requestId: string,
    _nafId: string,
    purpose: PurposeProps,
  ) => {
    try {
      await updateResourceRequestAsync({ purpose: purpose.purpose });
    } catch (error) {
      console.error("Failed to resubmit resource request:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResourceRequestAsync(id);
    } catch (error) {
      console.error("Failed to delete resource request:", error);
    }
  };

  const activeStep = request.steps.find(
    (s) => s.stepOrder === request.currentStep,
  );
  const isCurrentApprover = activeStep?.approverId === currentUserId;
  const isApproverForThisRequest = request.steps.some(
    (s) => s.approverId === currentUserId,
  );
  const isRequestor = naf.requestorId === currentUserId;

  const handleApprove = async (_id: string, comment: string) => {
    if (!isApproverForThisRequest || !activeStep) return;
    try {
      await approveRequestAsync({ stepId: activeStep.id, comment });
    } catch (error) {
      console.error("Failed to approve resource request:", error);
    }
  };

  const handleReject = async (_id: string, reason: string) => {
    if (!isApproverForThisRequest || !activeStep) return;
    try {
      await rejectRequestAsync({
        stepId: activeStep.id,
        reasonForRejection: reason,
      });
    } catch (error) {
      console.error("Failed to reject resource request:", error);
    }
  };

  const handleCancel = async (_id: string) => {
    try {
      await cancelRequestAsync();
    } catch (error) {
      console.error("Failed to cancel resource request:", error);
    }
  };

  const resourceGroup = resourceGroups.find((g) =>
    g.resources.some((r) => r.id === request.resource.id),
  );
  const existingActiveResourceIds = new Set(
    naf.resourceRequests
      .filter((rr) => rr.isActive)
      .map((rr) => rr.resource.id),
  );
  const groupResources =
    resourceGroup?.resources.filter(
      (r) =>
        r.isActive &&
        r.id !== request.resource.id &&
        !existingActiveResourceIds.has(r.id),
    ) ?? [];

  const handleChangeResource = async (
    _requestId: string,
    newResourceId: number,
  ) => {
    try {
      await changeResourceAsync(newResourceId);
    } catch (error) {
      console.error("Failed to change resource:", error);
    }
  };

  const handleDeactivate = async (_id: string) => {
    try {
      await deactivateRequestAsync();
    } catch (error) {
      console.error("Failed to deactivate resource:", error);
    }
  };

  return (
    <ResourceRequestAccordionItem
      isRequestor={isRequestor}
      request={request}
      isApprover={isApproverForThisRequest}
      isCurrentApprover={isCurrentApprover}
      resourceGroup={resourceGroup}
      groupResources={groupResources}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onRemind={onRemind}
      onDeactivate={handleDeactivate}
      onResubmit={handleResubmit}
      onCancel={handleCancel}
      onChangeResource={handleChangeResource}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}

interface ResourceRequestListProps {
  naf: NAF;
  currentUserId: string;
}

export function ResourceRequestList({
  naf,
  currentUserId,
}: ResourceRequestListProps) {
  const [addResourceOpen, setAddResourceOpen] = useState(false);
  const [filter, setFilter] = useState<ProgressFilter>("all");
  const [showInactive, setShowInactive] = useState(false);

  const resourceGroupsQuery = useQuery({
    queryKey: ["resourceGroups"],
    queryFn: getResourceGroups,
    staleTime: STALE_TIME.LONG,
  });
  const resourceGroups = resourceGroupsQuery.data ?? [];

  const pendingCount = (naf?.resourceRequests ?? []).filter(
    (r) =>
      r.progress !== Progress.ACCOMPLISHED &&
      r.progress !== Progress.NOT_ACCOMPLISHED,
  ).length;

  const filteredRequests = (naf?.resourceRequests ?? []).filter((r) => {
    const isInactive = !r.isActive || !!r.cancelledAt;
    if (filter === "all") return showInactive ? true : !isInactive;
    return (r.progress as unknown as Progress) === filter;
  });

  const handleRemind = (_id: string) => {};

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
            Resource Requests
          </p>
          {pendingCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              {pendingCount} pending
            </span>
          )}
        </div>
        <Button
          size="sm"
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold gap-1"
          onClick={() => setAddResourceOpen(true)}
        >
          + Add Resources
        </Button>
      </div>
      <AddResourceDialog
        naf={naf}
        open={addResourceOpen}
        onOpenChange={setAddResourceOpen}
      />
      <ResourceRequestFilterBar
        selected={filter}
        showInactive={showInactive}
        onChange={setFilter}
        onToggleInactive={setShowInactive}
      />
      <Accordion type="multiple" className="space-y-2">
        {filteredRequests.map((req) => (
          <RequestItemWrapper
            naf={naf}
            key={req.id}
            request={req}
            currentUserId={currentUserId}
            resourceGroups={resourceGroups}
            onRemind={handleRemind}
          />
        ))}
      </Accordion>
    </div>
  );
}
