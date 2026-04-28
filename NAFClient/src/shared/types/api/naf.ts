import type { Progress } from "../enum/progress";
import type { ImplementationStatus, Status } from "../enum/status";
import type { Employee } from "./employee";
import type { Entity } from "./entity";

export interface NAF extends Entity<string> {
  reference: string;
  requestorId: string;
  employee: Employee;
  accomplishedAt?: string;
  submittedAt: string;
  progress: Progress;
  createdAt: string;
  updatedAt: string;
  departmentId: string;
  resourceRequests: ResourceRequest[];
}

export interface ResourceRequest extends Entity<string> {
  currentStep: number;
  progress: Progress;
  isActive: boolean;
  accomplishedAt?: string;
  cancelledAt?: string;
  dateNeeded?: string;
  nafId: string;
  resource: Resource;
  approvalWorkflowTemplateId: string;
  additionalInfo?: AdditionalInfo;
  histories: ResourceRequestHistory[];
  purposes: Purpose[];
  steps: Step[];
  createdAt: string;
  implementation?: Implementation;
}

export enum ResourceRequestAction {
  APPROVE = 0,
  REJECT = 1,
  DELAY = 2,
  ACCEPT = 3,
  ACCOMPLISH = 4,
  EDITED = 5,
  CANCELLED = 6,
}

export interface ResourceRequestHistory {
  id: string;
  resourceRequestId: string;
  type: ResourceRequestAction;
  description: string;
  createdAt: string;
}

export interface Resource extends Entity<number> {
  name: string;
  color?: string;
  iconUrl: string;
  isActive: boolean;
  isSpecial: boolean;
}

export interface ResourceGroup extends Entity<number> {
  name: string;
  canOwnMany: boolean;
  canChangeWithoutApproval: boolean;
  resources: Resource[];
}

export interface Purpose extends Entity<string> {
  id: string;
  purpose: string;
  resourceRequestId: string;
  resourceRequestApprovalStepHistoryId?: string | null;
  createdAt: string;
}

export interface Step extends Entity<string> {
  id: string;
  resourceRequestId: string;
  stepOrder: number;
  stepAction: number;
  approverId: string;
  approverName?: string | null;
  progress: number;
  approvedAt?: string;
  histories: History[];
}

export interface History extends Entity<string> {
  id: string;
  status: Status;
  comment?: string;
  reasonForRejection?: string;
  actionAt: string;
  resourceRequestApprovalStepId: string;
}

export interface Implementation {
  id: string;
  resourceRequestId: string;
  acceptedAt?: string;
  accomplishedAt?: string;
  employeeId?: string;
  status: ImplementationStatus;
  delayReason?: string;
  delayedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type AdditionalInfo =
  | InternetRequestInfo
  | SharedFolderInfo
  | GroupEmailInfo;

interface BaseAdditionalInfo {
  type: number;
}

export interface InternetRequestInfo extends BaseAdditionalInfo {
  type: 0;
  internetResourceId: number;
  purpose: string;
  resource: string;
}

export interface SharedFolderInfo extends BaseAdditionalInfo {
  type: 1;
  sharedFolderId: number;
  name: string;
  departmentId: string;
  remarks: string;
}

export interface GroupEmailInfo extends BaseAdditionalInfo {
  type: 2;
  groupEmailId: number;
  email: string;
  departmentId: string;
}

export function handleAdditionalInfoStructured(info: AdditionalInfo) {
  switch (info.type) {
    case 0:
      return {
        label: "Internet Request",
        data: {
          purpose: info.purpose,
          resource: info.resource,
        },
      };

    case 1:
      return {
        label: "Shared Folder",
        data: {
          name: info.name,
          departmentId: info.departmentId,
        },
      };

    case 2:
      return {
        label: "Group Email",
        data: {
          email: info.email,
        },
      };

    default: {
      const _exhaustive: never = info;
      return _exhaustive;
    }
  }
}

export enum ProgressStatus {
  "Open" = 0,
  "In Progress" = 1,
  "Rejected" = 2,
  "For Screening" = 3,
  "Accomplished" = 4,
  "Not Accomplished" = 5,
}

export type PurposeProps = {
  purpose: string;
};

// ── Lookup types (used by Add Resource modal) ─────────────────────────────────

export interface InternetPurposeItem {
  id: number;
  name: string;
  description: string;
}

export interface InternetResourceItem {
  id: number;
  name: string;
  url: string;
  description?: string;
  purposeId: number;
}

export interface GroupEmailItem {
  id: number;
  email: string;
  departmentId: string;
}

export interface SharedFolderItem {
  id: number;
  name: string;
  remarks: string;
  departmentId: string;
}

export interface AddBasicResourceResult {
  resourceId: number;
  success: boolean;
  error?: string;
  data?: ResourceRequest;
}
