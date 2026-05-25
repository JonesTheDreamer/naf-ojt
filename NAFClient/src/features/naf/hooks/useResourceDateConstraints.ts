import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/api";

export function useResourceDateConstraints(resourceId: number | undefined, locationId: number | undefined) {
  const { data: locations } = useQuery({
    queryKey: ["admin-locations"],
    queryFn: adminApi.getAdminLocations,
    staleTime: 5 * 60 * 1000,
  });

  const { data: allowances } = useQuery({
    queryKey: ["resource-allowances"],
    queryFn: adminApi.getAllowances,
    staleTime: 5 * 60 * 1000,
  });

  const location = locations?.find((l) => l.id === locationId);
  const allowance = allowances?.find(
    (a) => a.resourceId === resourceId && a.locationId === locationId
  ) ?? null;

  const getMinDate = (): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = allowance?.allowanceDays ?? 0;
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + days);
    return minDate.toISOString().split("T")[0];
  };

  const isDateInvalid = (dateStr: string): string | null => {
    if (!dateStr) return null;
    if (location && !location.allowWeekendDateNeeded) {
      const d = new Date(dateStr + "T00:00:00");
      const dow = d.getDay();
      if (dow === 0 || dow === 6) return "Weekends are not allowed for this location.";
    }
    const minDate = getMinDate();
    if (dateStr < minDate) {
      const days = allowance?.allowanceDays ?? 0;
      return `Date must be at least ${days} day(s) from today.`;
    }
    return null;
  };

  return { getMinDate, isDateInvalid };
}
