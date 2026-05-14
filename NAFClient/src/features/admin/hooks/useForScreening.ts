import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "../api";

export function useForScreening(locationId: number | null) {
  return useQuery({
    queryKey: ["admin", "for-screening", locationId],
    queryFn: () => adminApi.getForScreening(locationId!),
    enabled: locationId !== null,
    placeholderData: keepPreviousData,
  });
}
