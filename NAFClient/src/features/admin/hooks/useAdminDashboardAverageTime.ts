import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api";

export function useAdminDashboardAverageTime(locationId: number | null) {
  const query = useQuery({
    queryKey: ["admin", "dashboard", "average-time", locationId],
    queryFn: () => adminApi.getDashboardAverageTime(locationId),
  });
  return { query };
}
