import { useQuery } from "@tanstack/react-query";
import { auditTrailApi } from "../api";

export function useAuditTrails(search: string, entity: string, page: number) {
  const query = useQuery({
    queryKey: ["audit-trails", search, entity, page],
    queryFn: () =>
      auditTrailApi.getAuditTrails({
        search: search.trim() || undefined,
        entity: entity === "all" ? undefined : entity,
        page,
      }),
  });
  return { query };
}
