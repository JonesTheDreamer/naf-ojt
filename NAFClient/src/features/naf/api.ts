import { api } from "@/shared/api/client";
import type { NAF, PurposeProps, ResourceRequest } from "@/shared/types/api/naf";
import type { PagedResult } from "@/shared/types/common/pagedResult";

// ── NAF ──────────────────────────────────────────────────────────────────────

export const getSubordinateNAFs = async (
  employee: string,
  page: number,
): Promise<PagedResult<NAF>> => {
  const res = await api.get(`/NAFs/${employee}/subordinates/`, {
    params: { page },
  });
  if (!res.data) {
    return { data: [], totalCount: 0, pageSize: 6, currentPage: page ?? 1, totalPages: 0 };
  }
  return res.data;
};

export const getApproverNAFs = async (
  employee: string,
  page: number,
): Promise<PagedResult<NAF>> => {
  const res = await api.get(`/NAFs/${employee}/approver`, { params: { page } });
  if (!res.data) {
    return { data: [], totalCount: 0, pageSize: 6, currentPage: page ?? 1, totalPages: 0 };
  }
  return res.data;
};

export const getNAF = async (id: string): Promise<NAF> => {
  const data = (await api.get(`/NAFs/${id}`)).data;
  return data;
};

export const employeeHasNAF = async (
  employeeId: string,
  departmentId: string,
): Promise<boolean> => {
  return (await api.get(`/NAFs/hasNAF/${employeeId}/department/${departmentId}`)).data;
};

export const getEmployeeNAFs = async (employeeId: string): Promise<NAF[]> => {
  return (await api.get(`/NAFs/employee/${employeeId}`)).data;
};

export const createNAF = async (payload: {
  employeeId: string;
  requestorId: string;
  hardwareId: number;
  dateNeeded?: string | null;
}) => {
  return (await api.post("/NAFs", payload)).data;
};

export const deactivateNAF = async (id: string) => {
  return (await api.delete(`/NAFs/${id}`)).data;
};

// ── Resource Requests ────────────────────────────────────────────────────────

export const createResourceRequest = async (payload: {
  nafId: string;
  resourceId: number;
  purpose: string;
  additionalInfo: Record<string, unknown>;
  dateNeeded?: string | null;
}): Promise<ResourceRequest> => {
  return (await api.post("/Requests", payload)).data;
};

export const editResourceRequestPurpose = async (
  resourceRequest: string,
  purpose: PurposeProps,
): Promise<ResourceRequest> => {
  return (await api.post(`/Requests/${resourceRequest}/purpose`, purpose)).data;
};

export const changeResource = async (
  resourceRequestId: string,
  resourceId: number,
): Promise<ResourceRequest> => {
  return (await api.post(`/Requests/change-resource/${resourceRequestId}`, resourceId)).data;
};

export const deleteResourceRequest = async (resourceRequest: string): Promise<void> => {
  await api.delete(`/Requests/${resourceRequest}`);
};

export const approveResourceRequest = async (
  stepId: string,
  comment?: string,
): Promise<ResourceRequest> => {
  return (await api.put(`/ApprovalSteps/${stepId}/approve`, comment)).data;
};

export const cancelResourceRequest = async (resourceRequestId: string): Promise<void> => {
  await api.put(`/Requests/${resourceRequestId}/cancel`);
};

export const rejectResourceRequest = async (
  stepId: string,
  reasonForRejection: string,
): Promise<ResourceRequest> => {
  return (await api.put(`/ApprovalSteps/${stepId}/reject`, reasonForRejection)).data;
};
