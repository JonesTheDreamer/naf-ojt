import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sharedFoldersApi } from "../api";
import type { SharedFolderWriteDTO } from "../types";

export function useSharedFolderMutations() {
  const qc = useQueryClient();

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin", "shared-folders"] });

  const createMutation = useMutation({
    mutationFn: (dto: SharedFolderWriteDTO) => sharedFoldersApi.create(dto),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: SharedFolderWriteDTO }) =>
      sharedFoldersApi.update(id, dto),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sharedFoldersApi.remove(id),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
}
