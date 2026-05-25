import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api";

export function useAdminLocations() {
  const locationsQuery = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: adminApi.getAdminLocations,
  });

  return { locationsQuery };
}
