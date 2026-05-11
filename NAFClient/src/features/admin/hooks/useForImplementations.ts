import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api";

export function useForImplementations(locationId: number | null) {
  const forImplementationsQuery = useQuery({
    queryKey: ["tech", "for-implementations", locationId],
    queryFn: () => adminApi.getForImplementations(locationId ?? 0),
    enabled: locationId !== null,
  });

  return { forImplementationsQuery };
}
