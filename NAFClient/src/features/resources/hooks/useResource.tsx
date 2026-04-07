import { getAllResources } from "@/services/EntityAPI/resourceService";
import type { Resource } from "@/types/api/naf";
import { useQuery } from "@tanstack/react-query";

export const useResource = () => {
  const getAllResource = useQuery<Resource[], Error>({
    queryKey: ["allResources"],
    queryFn: () => getAllResources(),
    staleTime: 24 * 60 * 60 * 1000,
  });

  return {
    getAllResource,
    isLoading: getAllResource.isLoading,
    isError: getAllResource.isError,
  };
};
