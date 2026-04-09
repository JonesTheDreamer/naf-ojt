import { api } from "../api";

export interface ForImplementationItemDTO {
  id: string;
  nafId: string;
  progress: string;
  resourceName: string;
  implementationId: string | null;
  implementationStatus: string | null;
  assignedTo: string | null;
}

export const implementationService = {
  getMyTasks: () =>
    api.get<ForImplementationItemDTO[]>("/implementations/my-tasks").then((r) => r.data),

  getForImplementations: () =>
    api.get<ForImplementationItemDTO[]>("/implementations/for-implementations").then((r) => r.data),

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
