import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib/apiError";

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong.";
      toast.error(message);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60000,
      retry: 2,
    },
  },
});
