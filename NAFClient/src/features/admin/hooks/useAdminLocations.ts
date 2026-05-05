import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";
import { toast } from "sonner";

export function useAdminLocations() {
  const queryClient = useQueryClient();

  const locationsQuery = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: adminApi.getLocations,
  });

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

  return { locationsQuery, assignLocationMutation, removeLocationMutation };
}
