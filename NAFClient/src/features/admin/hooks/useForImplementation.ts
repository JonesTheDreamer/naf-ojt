import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "../api";

export function useForImplementation(locationId: number | null) {
  return useQuery({
    queryKey: ["admin", "for-implementation", locationId],
    queryFn: () => adminApi.getForImplementations(locationId!),
    enabled: locationId !== null,
    placeholderData: keepPreviousData,
  });
}
