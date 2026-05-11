import { useQuery } from "@tanstack/react-query";
import { hrApi } from "../api";

export function useHRNafs(page: number) {
  const query = useQuery({
    queryKey: ["hr", "nafs", page],
    queryFn: () => hrApi.getNafs(page),
  });
  return { query };
}
