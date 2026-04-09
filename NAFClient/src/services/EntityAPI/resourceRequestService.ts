import type { PurposeProps, ResourceRequest } from "@/types/api/naf";
import { api } from "../api";

export const createResourceRequest = async (payload: {
  nafId: string;
  resourceId: number;
  purpose: string;
  additionalInfo: Record<string, unknown>;
}): Promise<ResourceRequest> => {
  return (await api.post("/Requests", payload)).data;
};

export const editResourceRequestPurpose = async (
  resourceRequest: string,
  purpose: PurposeProps,
): Promise<ResourceRequest> => {
  const res = await api.post(`/Requests/${resourceRequest}/purpose`, purpose);
  console.log(res.data);
  return res.data;
};

export const deleteResourceRequest = async (
  resourceRequest: string,
): Promise<void> => {
  await api.delete(`/Requests/${resourceRequest}`);
};

export const approveResourceRequest = async (
  stepId: string,
  comment?: string,
): Promise<ResourceRequest> => {
  return (await api.put(`/ApprovalSteps/${stepId}/approve`, comment)).data;
};

export const rejectResourceRequest = async (
  stepId: string,
  reasonForRejection: string,
): Promise<ResourceRequest> => {
  return (await api.put(`/ApprovalSteps/${stepId}/reject`, reasonForRejection))
    .data;
};
