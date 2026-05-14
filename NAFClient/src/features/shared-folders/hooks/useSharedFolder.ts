import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { sharedFoldersApi } from "../api";

export function useSharedFolder(id: number, progress: string, page: number) {
  return useQuery({
    queryKey: ["admin", "shared-folders", id, progress, page],
    queryFn: () =>
      sharedFoldersApi.detail(id, {
        progress: progress === "all" ? undefined : progress,
        page,
      }),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
}
