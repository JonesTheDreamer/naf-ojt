import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api";

export function useAdminResourceRequests(
  locationId: number | null,
  progress: string,
  page: number,
) {
  const query = useQuery({
    queryKey: ["admin", "resource-requests", locationId, progress, page],
    queryFn: () => adminApi.getAdminResourceRequests(locationId!, progress, page),
    enabled: locationId != null,
  });
  return { query };
}
