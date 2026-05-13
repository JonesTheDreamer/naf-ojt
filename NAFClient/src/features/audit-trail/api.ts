import { api } from "@/shared/api/client";
import type { PagedResult } from "@/shared/types/common/pagedResult";
import type { AuditTrailDTO } from "./types";

export const auditTrailApi = {
  getAuditTrails: (params: { search?: string; entity?: string; page: number }) =>
    api
      .get<PagedResult<AuditTrailDTO>>("/admin/audit-trails", { params })
      .then((r) => r.data),
};
