import { useQuery } from "@tanstack/react-query";
import { socApi } from "../api";

export function useForSocReview() {
  return useQuery({
    queryKey: ["soc", "for-soc-review"],
    queryFn: () => socApi.getForSocReview(),
  });
}
