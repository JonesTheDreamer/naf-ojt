import { api } from "@/shared/api/client";
import type {
  AdminResourceListItem,
  AdminResourceDetail,
  CreateResourcePayload,
  AddWorkflowTemplatePayload,
  CreateResourceGroupPayload,
} from "./types";
import type { ResourceGroup } from "@/shared/types/api/naf";

export const resourceManagementApi = {
  async getAll(): Promise<AdminResourceListItem[]> {
    const res = await api.get<AdminResourceListItem[]>("/admin/resources");
    console.log(res.data);

    return res.data;
  },

  async getDetail(id: number): Promise<AdminResourceDetail> {
    const res = await api.get<AdminResourceDetail>(`/admin/resources/${id}`);
    console.log(res.data);
    return res.data;
  },

  async createResource(
    payload: CreateResourcePayload,
  ): Promise<{ id: number }> {
    const res = await api.post<{ id: number }>("/admin/resources", payload);
    return res.data;
  },

  async deactivateResource(id: number): Promise<void> {
    await api.put(`/admin/resources/${id}/deactivate`);
  },

  async addWorkflowTemplate(
    resourceId: number,
    payload: AddWorkflowTemplatePayload,
  ): Promise<void> {
    await api.post(
      `/admin/resources/${resourceId}/workflow-templates`,
      payload,
    );
  },

  async createResourceGroup(
    payload: CreateResourceGroupPayload,
  ): Promise<ResourceGroup> {
    const res = await api.post<ResourceGroup>("/ResourceGroups", payload);
    return res.data;
  },
};
