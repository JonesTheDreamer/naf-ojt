import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { implementationService } from "@/services/EntityAPI/implementationService";

export function useForImplementations() {
  const queryClient = useQueryClient();

  const forImplementationsQuery = useQuery({
    queryKey: ["tech", "for-implementations"],
    queryFn: implementationService.getForImplementations,
  });

  const assignToMeMutation = useMutation({
    mutationFn: (resourceRequestId: string) =>
      implementationService.assignToMe(resourceRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tech", "for-implementations"] });
      queryClient.invalidateQueries({ queryKey: ["tech", "my-tasks"] });
    },
  });

  return { forImplementationsQuery, assignToMeMutation };
}
