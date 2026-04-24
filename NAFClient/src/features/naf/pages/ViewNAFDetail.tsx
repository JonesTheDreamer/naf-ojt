/**
 * NAFDetailPage
 * Route: /NAF/:nafId
 */

import { useParams } from "react-router-dom";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import type {
  NAF,
  ResourceGroup,
  ResourceRequest,
  PurposeProps,
} from "@/shared/types/api/naf";
import { ProgressStatus } from "@/shared/types/api/naf";
import RequestorLayout from "@/components/layout/RequestorLayout";
import { ResourceRequestAccordionItem } from "@/features/naf/components/resourceRequestAccordion";
import { useNAF } from "../hooks/useNAF";
import { useResourceRequest } from "../hooks/useResourceRequest";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AddResourceDialog } from "@/features/naf/components/addResourceDialog";
import { useAuth } from "@/features/auth/AuthContext";
import { getResourceGroups } from "@/services/EntityAPI/resourceService";

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function nafProgressLabel(progress: number): string {
  return ProgressStatus[progress as ProgressStatus] ?? String(progress);
}

function nafProgressColor(progress: number): string {
  switch (progress as ProgressStatus) {
    case ProgressStatus["In Progress"]:
      return "text-blue-600";
    case ProgressStatus.Accomplished:
      return "text-emerald-600";
    case ProgressStatus.Rejected:
      return "text-red-500";
    case ProgressStatus["For Screening"]:
      return "text-teal-600";
    default:
      return "text-amber-500";
  }
}

// ─── Detail field ─────────────────────────────────────────────────────────────

function DetailField({
  label,
  value,
  placeholder = "—",
}: {
  label: string;
  value?: string | null;
  placeholder?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      {value ? (
        <p className="text-sm font-medium">{value}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">{placeholder}</p>
      )}
    </div>
  );
}

// ─── Employee Details Card ────────────────────────────────────────────────────

function EmployeeDetailsCard({
  naf,
  onDeactivate,
}: {
  naf: NAF;
  onDeactivate: () => void;
}) {
  const employee = naf?.employee;

  if (!employee) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Employee Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            Employee details unavailable.
          </p>
        </CardContent>
      </Card>
    );
  }

  const fullName = [employee.lastName, employee.firstName, employee.middleName]
    .filter(Boolean)
    .join(", ");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 gap-4 flex-wrap">
        <CardTitle className="text-lg font-bold">Employee Details</CardTitle>
        <Button
          size="sm"
          className="bg-red-400 hover:bg-red-500 text-white gap-1.5 shrink-0"
          onClick={onDeactivate}
        >
          Deactivate Access
          <X className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
          <div className="space-y-4">
            <DetailField label="Employee Name" value={fullName} />
            <DetailField label="Company" value={employee.company} />
            <DetailField label="Location" value={employee.location} />
          </div>
          <div className="space-y-4">
            <DetailField
              label="Department"
              value={employee.departmentDesc ?? employee.departmentId}
            />
            <DetailField label="Position" value={employee.position} />
            <DetailField
              label="Domain"
              value={null}
              placeholder="No Domain Yet"
            />
            <DetailField
              label="Username"
              value={null}
              placeholder="No Username Yet"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Per-request wrapper ──────────────────────────────────────────────────────

interface RequestItemWrapperProps {
  naf: NAF;
  request: ResourceRequest;
  currentUserId: string;
  resourceGroups: ResourceGroup[];
  onRemind: (id: string) => void;
  onDeactivate: (id: string) => void;
}

function RequestItemWrapper({
  naf,
  request,
  currentUserId,
  resourceGroups,
  onRemind,
  onDeactivate,
}: RequestItemWrapperProps) {
  const {
    updateResourceRequestAsync,
    deleteResourceRequestAsync,
    approveRequestAsync,
    rejectRequestAsync,
    cancelRequestAsync,
    changeResourceAsync,
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

  // Resubmit carries the rejection history ID that triggered the resubmission
  // so the backend can link the new purpose to the step history that caused it.
  const handleResubmit = async (
    _requestId: string,
    _nafId: string,
    purpose: PurposeProps,
  ) => {
    try {
      await updateResourceRequestAsync({
        purpose: purpose.purpose,
      });
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
    if (!isApproverForThisRequest) {
      alert("Can't approve yet");
      return;
    }
    if (!activeStep) {
      alert("No active step found");
      return;
    }
    try {
      await approveRequestAsync({ stepId: activeStep.id, comment: comment });
    } catch (error) {
      console.error("Failed to approve resource request:", error);
    }
  };

  const handleReject = async (_id: string, reason: string) => {
    if (!isApproverForThisRequest) {
      alert("Can't approve yet");
      return;
    }
    if (!activeStep) {
      alert("No active step found");
      return;
    }
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

  const existingResourceIds = new Set(
    naf.resourceRequests.map((rr) => rr.resource.id),
  );
  const groupResources =
    resourceGroup?.resources.filter(
      (r) =>
        r.isActive &&
        r.id !== request.resource.id &&
        !existingResourceIds.has(r.id),
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
      onDeactivate={onDeactivate}
      onResubmit={handleResubmit}
      onCancel={handleCancel}
      onChangeResource={handleChangeResource}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}

// ─── Requests Section ─────────────────────────────────────────────────────────

function RequestsSection({
  naf,
  currentUserId,
}: {
  naf: NAF;
  currentUserId: string;
}) {
  const [addResourceOpen, setAddResourceOpen] = useState(false);

  const resourceGroupsQuery = useQuery({
    queryKey: ["resourceGroups"],
    queryFn: getResourceGroups,
    staleTime: 1000 * 60 * 10,
  });
  const resourceGroups = resourceGroupsQuery.data ?? [];

  const pendingCount = (naf?.resourceRequests ?? []).filter((r) => {
    const p = r.progress as unknown as ProgressStatus;
    return (
      p !== ProgressStatus.Accomplished &&
      p !== ProgressStatus["Not Accomplished"]
    );
  }).length;

  const handleRemind = (id: string) => console.log("TODO remind", id);
  const handleDeactivate = (id: string) =>
    console.log("TODO deactivate resource request", id);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold">Requests</h2>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="text-sm font-semibold text-amber-500">
              {pendingCount} pending
            </span>
          )}
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            onClick={() => setAddResourceOpen(true)}
          >
            + Add Resources
          </Button>
        </div>
      </div>

      <AddResourceDialog
        naf={naf}
        open={addResourceOpen}
        onOpenChange={setAddResourceOpen}
      />

      <Accordion type="multiple" className="space-y-2">
        {(naf?.resourceRequests ?? []).map((req) => (
          <RequestItemWrapper
            naf={naf}
            key={req.id}
            request={req}
            currentUserId={currentUserId}
            resourceGroups={resourceGroups}
            onRemind={handleRemind}
            onDeactivate={handleDeactivate}
          />
        ))}
      </Accordion>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-5 w-64 bg-muted rounded" />
          <div className="h-3 w-40 bg-muted rounded" />
        </div>
        <div className="h-5 w-24 bg-muted rounded" />
      </div>
      <div className="h-px bg-muted" />
      <div className="h-48 bg-muted rounded-lg" />
      <div className="h-6 w-32 bg-muted rounded" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 bg-muted rounded-lg" />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NAFDetailPage() {
  const { nafId } = useParams<{ nafId: string }>();
  const { user } = useAuth();
  const currentUserId = user?.employeeId ?? "";

  const {
    nafQuery: naf,
    isLoading,
    isError,
    deactivateNAFAsync,
  } = useNAF({ nafId });

  const handleDeactivateNAF = async () => {
    if (!nafId) return;
    try {
      await deactivateNAFAsync(nafId);
    } catch (error) {
      console.error("Failed to deactivate NAF:", error);
    }
  };

  return (
    <RequestorLayout>
      <div className="max-w-4xl mx-auto w-full space-y-6 pb-12 px-4 sm:px-6">
        {isLoading && <LoadingSkeleton />}

        {isError && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Failed to load NAF details. Please try again.
          </div>
        )}

        {!isLoading && !isError && !naf?.data && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            NAF not found.
          </div>
        )}

        {naf?.data && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-semibold text-foreground">
                    Reference:
                  </span>
                  <span className="text-base font-bold text-amber-500">
                    {naf.data.reference}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last Update: {formatDateTime(naf.data.updatedAt)}
                </p>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-0.5 shrink-0">
                <span className="text-xs text-muted-foreground">Status</span>
                <span
                  className={`text-sm font-bold ${nafProgressColor(naf.data.progress as unknown as number)}`}
                >
                  {nafProgressLabel(naf.data.progress as unknown as number)}
                </span>
              </div>
            </div>

            <Separator />

            {/* Employee Details */}
            <EmployeeDetailsCard
              naf={naf.data}
              onDeactivate={handleDeactivateNAF}
            />

            {/* Resource Requests */}
            <RequestsSection naf={naf.data} currentUserId={currentUserId} />
          </>
        )}
      </div>
    </RequestorLayout>
  );
}
