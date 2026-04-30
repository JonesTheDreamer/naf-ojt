import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";
import type { UserDTO } from "../types";
import { toast } from "sonner";

export function useAdminLocations() {
  const queryClient = useQueryClient();

  const locationsQuery = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: adminApi.getLocations,
  });

  // Fetch all users across every location for the assign dialog cross-reference.
  const locationIds = locationsQuery.data?.map((l) => l.id) ?? [];
  const perLocationQueries = useQueries({
    queries: locationIds.map((id) => ({
      queryKey: ["admin", "users", id],
      queryFn: () => adminApi.getUsers(id),
    })),
  });
  const allUsers: UserDTO[] = perLocationQueries.flatMap((q) => q.data ?? []);

  const assignLocationMutation = useMutation({
    mutationFn: ({ userId, locationId }: { userId: number; locationId: number }) =>
      adminApi.assignLocation(userId, locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Location assigned");
    },
    onError: () => toast.error("Failed to assign location"),
  });

  const removeLocationMutation = useMutation({
    mutationFn: ({ userId, locationId }: { userId: number; locationId: number }) =>
      adminApi.removeLocation(userId, locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Location removed");
    },
    onError: () => toast.error("Failed to remove location"),
  });

  return { locationsQuery, allUsers, assignLocationMutation, removeLocationMutation };
}
