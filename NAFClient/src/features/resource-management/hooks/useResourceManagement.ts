import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resourceManagementApi } from "../api";
import type { AddWorkflowTemplatePayload, CreateResourceGroupPayload, CreateResourcePayload } from "../types";

const KEYS = {
  list: ["admin", "resources"] as const,
  detail: (id: number) => ["admin", "resources", id] as const,
};

export function useAdminResources() {
  return useQuery({
    queryKey: KEYS.list,
    queryFn: resourceManagementApi.getAll,
  });
}

export function useAdminResourceDetail(id: number) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => resourceManagementApi.getDetail(id),
    enabled: id > 0,
  });
}

export function useCreateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateResourcePayload) => resourceManagementApi.createResource(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list }),
  });
}

export function useDeactivateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => resourceManagementApi.deactivateResource(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: KEYS.list });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

export function useAddWorkflowTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceId, payload }: { resourceId: number; payload: AddWorkflowTemplatePayload }) =>
      resourceManagementApi.addWorkflowTemplate(resourceId, payload),
    onSuccess: (_data, { resourceId }) =>
      qc.invalidateQueries({ queryKey: KEYS.detail(resourceId) }),
  });
}

export function useCreateResourceGroup() {
  return useMutation({
    mutationFn: (payload: CreateResourceGroupPayload) =>
      resourceManagementApi.createResourceGroup(payload),
  });
}
