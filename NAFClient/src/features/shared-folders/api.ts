import { api } from "@/shared/api/client";
import type { PagedResult } from "@/shared/types/common/pagedResult";
import type { SharedFolderDTO, SharedFolderDetailDTO, SharedFolderWriteDTO } from "./types";

export const sharedFoldersApi = {
  list: (params: { search?: string; page: number }) =>
    api
      .get<PagedResult<SharedFolderDTO>>("/admin/shared-folders", { params })
      .then((r) => r.data),

  detail: (id: number, params: { progress?: string; page: number }) =>
    api
      .get<SharedFolderDetailDTO>(`/admin/shared-folders/${id}`, { params })
      .then((r) => r.data),

  create: (dto: SharedFolderWriteDTO) =>
    api.post<SharedFolderDTO>("/admin/shared-folders", dto).then((r) => r.data),

  update: (id: number, dto: SharedFolderWriteDTO) =>
    api.put<SharedFolderDTO>(`/admin/shared-folders/${id}`, dto).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/admin/shared-folders/${id}`).then((r) => r.data),
};
