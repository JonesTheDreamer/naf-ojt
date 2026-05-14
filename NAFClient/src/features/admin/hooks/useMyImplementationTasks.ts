import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "../api";

export function useMyImplementationTasks() {
  return useQuery({
    queryKey: ["admin", "my-implementation-tasks"],
    queryFn: adminApi.getMyTasks,
    placeholderData: keepPreviousData,
  });
}
