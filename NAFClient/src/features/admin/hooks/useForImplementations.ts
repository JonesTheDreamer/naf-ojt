import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";
import { toast } from "sonner";

export function useForImplementations() {
  const queryClient = useQueryClient();

  const forImplementationsQuery = useQuery({
    queryKey: ["tech", "for-implementations"],
    queryFn: adminApi.getForImplementations,
  });

  const assignToMeMutation = useMutation({
    mutationFn: (resourceRequestId: string) =>
      adminApi.assignToMe(resourceRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tech", "for-implementations"] });
      queryClient.invalidateQueries({ queryKey: ["tech", "my-tasks"] });
      toast.success("Assigned to you");
    },
    onError: () => toast.error("Failed to assign task"),
  });

  return { forImplementationsQuery, assignToMeMutation };
}
