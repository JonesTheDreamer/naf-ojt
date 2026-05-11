import { api } from "@/shared/api/client";
import type { PagedResult } from "@/shared/types/common/pagedResult";
import type { HRNafDTO } from "./types";

export const hrApi = {
  getNafs: (page: number) =>
    api
      .get<PagedResult<HRNafDTO>>("/hr/nafs", { params: { page } })
      .then((r) => r.data),
};
