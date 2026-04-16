import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService, type AssignLocationDTO } from "@/services/EntityAPI/adminService";
import { toast } from "sonner";

export function useAdminLocations() {
  const queryClient = useQueryClient();

  const locationsQuery = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: adminService.getLocations,
  });

  const assignLocationMutation = useMutation({
    mutationFn: (data: AssignLocationDTO) => adminService.assignLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "locations"] });
      toast.success("Location assigned");
    },
    onError: () => toast.error("Failed to assign location"),
  });

  return { locationsQuery, assignLocationMutation };
}
