import { api } from "@/shared/api/client";
import type { ForSocReviewItem } from "./types";

export const socApi = {
  getForSocReview: () =>
    api
      .get<ForSocReviewItem[]>("/soc/resource-requests/for-soc-review")
      .then((r) => r.data),
};
