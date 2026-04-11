import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { implementationService } from "@/services/EntityAPI/implementationService";

export function useMyTasks() {
  const queryClient = useQueryClient();

  const myTasksQuery = useQuery({
    queryKey: ["tech", "my-tasks"],
    queryFn: implementationService.getMyTasks,
  });

  const setToDelayedMutation = useMutation({
    mutationFn: ({ implementationId, reason }: { implementationId: string; reason: string }) =>
      implementationService.setToDelayed(implementationId, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tech", "my-tasks"] }),
  });

  const setToAccomplishedMutation = useMutation({
    mutationFn: (implementationId: string) =>
      implementationService.setToAccomplished(implementationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tech", "my-tasks"] }),
  });

  return { myTasksQuery, setToDelayedMutation, setToAccomplishedMutation };
}
