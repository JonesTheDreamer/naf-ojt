import type { NAF } from "@/shared/types/api/naf";
import { api } from "@/shared/api/client";
import type { ForImplementationItemDTO } from "@/features/tech/types";

export const implementationService = {
  getMyTasks: () =>
    api.get<NAF[]>("/implementations/my-tasks").then((r) => r.data),

  getForImplementations: () =>
    api.get<NAF[]>("/implementations/for-implementations").then((r) => r.data),

  assignToMe: (resourceRequestId: string) =>
    api
      .post<ForImplementationItemDTO>(`/implementations/resource-requests/${resourceRequestId}/assign`)
      .then((r) => r.data),

  setToInProgress: (implementationId: string) =>
    api.patch(`/implementations/${implementationId}/in-progress`).then((r) => r.data),

  setToDelayed: (implementationId: string, delayReason: string) =>
    api.patch(`/implementations/${implementationId}/delayed`, JSON.stringify(delayReason)).then((r) => r.data),

  setToAccomplished: (implementationId: string) =>
    api.patch(`/implementations/${implementationId}/accomplished`).then((r) => r.data),
};
