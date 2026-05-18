import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api";

export function useAdminDashboardStats(locationId: number | null) {
  const query = useQuery({
    queryKey: ["admin", "dashboard", "stats", locationId],
    queryFn: () => adminApi.getDashboardStats(locationId),
  });
  return { query };
}
