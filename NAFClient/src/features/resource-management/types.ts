export interface AdminResourceListItem {
  id: number;
  name: string;
  iconUrl?: string;
  color: string;
  isActive: boolean;
  isSpecial: boolean;
  resourceGroupName?: string;
  activeWorkflowTemplateVersion: number;
}

export interface WorkflowStep {
  stepOrder: number;
  stepAction: string;
  approverRole: string;
  approverEntity: string;
}

export interface WorkflowTemplateVersion {
  id: string;
  version: number;
  isActive: boolean;
  steps: WorkflowStep[];
}

export interface EmployeeResourceRequestItem {
  employeeId: string;
  employeeName: string;
  nafId: string;
  resourceRequestId: string;
  progress: string;
}

export interface EmployeesByLocation {
  locationId: number;
  locationName: string;
  employees: EmployeeResourceRequestItem[];
}

export interface AdminResourceDetail {
  id: number;
  name: string;
  iconUrl?: string;
  color: string;
  isActive: boolean;
  isSpecial: boolean;
  resourceGroupId?: number;
  resourceGroupName?: string;
  workflowVersions: WorkflowTemplateVersion[];
  employeesByLocation: EmployeesByLocation[];
}

export interface StepRow {
  stepAction: string;
  approverRole: string;
  approverEntity: string;
}

export interface CreateResourcePayload {
  name: string;
  color: string;
  isSpecial: boolean;
  resourceGroupId?: number;
  steps?: Array<{ stepOrder: number; stepAction: string; approverRole: string; approverEntity: string }>;
}

export interface AddWorkflowTemplatePayload {
  steps: Array<{ stepOrder: number; stepAction: string; approverRole: string; approverEntity: string }>;
}

export interface CreateResourceGroupPayload {
  name: string;
  canOwnMany: boolean;
}
