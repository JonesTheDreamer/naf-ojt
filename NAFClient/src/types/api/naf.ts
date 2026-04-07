import type { Progress } from "../enum/progress";
import type { Status } from "../enum/status";
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
  accomplishedAt?: string;
  nafId: string;
  resource: Resource;
  approvalWorkflowTemplateId: string;
  additionalInfo?: AdditionalInfo;
  purposes: Purpose[];
  steps: Step[];
}

export interface Resource extends Entity<number> {
  name: string;
  color?: string;
  iconUrl: string;
  isActive: boolean;
  isSpecial: boolean;
}

export interface Purpose extends Entity<string> {
  id: string;
  purpose: string;
  resourceRequestId: string;
  resourceRequestApprovalStepHistoryId?: null;
  createdAt: string;
}

export interface Step extends Entity<string> {
  id: string;
  resourceRequestId: string;
  stepOrder: number;
  approverId: string;
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

export type AdditionalInfo =
  | InternetRequestInfo
  | SharedFolderInfo
  | GroupEmailInfo;

interface BaseAdditionalInfo {
  type: number; // discriminator
}

export interface InternetRequestInfo extends BaseAdditionalInfo {
  type: 0;
  purpose: string;
  resource: string;
}

export interface SharedFolderInfo extends BaseAdditionalInfo {
  type: 1;
  name: string;
  departmentId: string;
}

export interface GroupEmailInfo extends BaseAdditionalInfo {
  type: 2;
  email: string;
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
  "Open" = 0, // NO APPROVERS YET
  "In Progress" = 1, // AN APPROVER APPROVED THE REQUEST AND NOW WAITING FOR THE NEXT APPROVER/S
  "Rejected" = 2, // AN APPROVER REJECTED THE REQUEST
  "For Screening" = 3, // ALL APPROVERS APPROVED THE REQUEST AND THE TECHNICAL TEAM WILL PROCEED WITH THE PREPARATION
  "Accomplished" = 4, // ALL APPROVERS APPROVED THE REQUEST AND THE TECHNICAL TEAM DELIVERED THE REQUEST
  "Not Accomplished" = 5, // THE REQUEST IS REJECTED AND THE REQUESTOR CLOSED THE REQUEST
}

export type PurposeProps = {
  purpose: string;
  resourceRequestApprovalStepHistoryId?: string;
};
