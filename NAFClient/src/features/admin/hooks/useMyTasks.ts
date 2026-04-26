import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";
import { toast } from "sonner";

export function useMyTasks() {
  const queryClient = useQueryClient();

  const myTasksQuery = useQuery({
    queryKey: ["tech", "my-tasks"],
    queryFn: adminApi.getMyTasks,
  });

  const setToDelayedMutation = useMutation({
    mutationFn: ({ implementationId, reason }: { implementationId: string; reason: string }) =>
      adminApi.setToDelayed(implementationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tech", "my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tech", "for-implementations"] });
      toast.success("Marked as delayed");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const setToAccomplishedMutation = useMutation({
    mutationFn: (implementationId: string) =>
      adminApi.setToAccomplished(implementationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tech", "my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tech", "for-implementations"] });
      toast.success("Marked as accomplished");
    },
    onError: () => toast.error("Failed to update status"),
  });

  return { myTasksQuery, setToDelayedMutation, setToAccomplishedMutation };
}
