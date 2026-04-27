import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api";

export function useAdminNAFs(
  locationId: number | null,
  status: string,
  page: number,
) {
  const nafQuery = useQuery({
    queryKey: ["admin", "nafs", locationId, status, page],
    queryFn: () => adminApi.getAdminNAFs(locationId!, status, page),
    enabled: locationId != null,
  });

  return { nafQuery };
}
