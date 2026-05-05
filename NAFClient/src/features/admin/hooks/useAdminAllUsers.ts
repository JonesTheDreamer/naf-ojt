import { useQueries, useQuery } from "@tanstack/react-query";
import { adminApi } from "../api";
import type { UserDTO } from "../types";

export function useAdminAllUsers() {
  const locationsQuery = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: adminApi.getLocations,
  });

  const locationIds = locationsQuery.data?.map((l) => l.id) ?? [];

  const perLocationQueries = useQueries({
    queries: locationIds.map((id) => ({
      queryKey: ["admin", "users", id],
      queryFn: () => adminApi.getUsers(id),
    })),
  });

  const users: UserDTO[] = [
    ...new Map(
      perLocationQueries.flatMap((q) => q.data ?? []).map((u) => [u.id, u])
    ).values(),
  ];

  const isLoading =
    locationsQuery.isLoading || perLocationQueries.some((q) => q.isLoading);

  return { users, isLoading, locationsQuery };
}
