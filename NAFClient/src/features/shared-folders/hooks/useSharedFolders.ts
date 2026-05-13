import { useQuery } from "@tanstack/react-query";
import { sharedFoldersApi } from "../api";

export function useSharedFolders(search: string, page: number) {
  return useQuery({
    queryKey: ["admin", "shared-folders", search, page],
    queryFn: () => sharedFoldersApi.list({ search: search || undefined, page }),
  });
}
