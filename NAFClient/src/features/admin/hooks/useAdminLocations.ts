import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AssignLocationDTO } from "../api";
import { toast } from "sonner";

export function useAdminLocations() {
  const queryClient = useQueryClient();

  const locationsQuery = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: adminApi.getLocations,
  });

  const assignLocationMutation = useMutation({
    mutationFn: (data: AssignLocationDTO) => adminApi.assignLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "locations"] });
      toast.success("Location assigned");
    },
    onError: () => toast.error("Failed to assign location"),
  });

  return { locationsQuery, assignLocationMutation };
}
