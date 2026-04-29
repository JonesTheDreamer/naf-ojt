import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";
import type { AssignRoleDTO, UserDTO } from "../types";
import { toast } from "sonner";

export function useAdminUsers(locationId: number | null) {
  const queryClient = useQueryClient();

  const singleLocationQuery = useQuery({
    queryKey: ["admin", "users", locationId],
    queryFn: () => adminApi.getUsers(locationId!),
    enabled: locationId !== null,
  });

  const allLocationsQuery = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: adminApi.getLocations,
    enabled: locationId === null,
  });

  const locationIds =
    locationId === null ? (allLocationsQuery.data?.map((l) => l.id) ?? []) : [];

  const perLocationQueries = useQueries({
    queries: locationIds.map((id) => ({
      queryKey: ["admin", "users", id],
      queryFn: () => adminApi.getUsers(id),
    })),
  });

  const users: UserDTO[] =
    locationId !== null
      ? (singleLocationQuery.data ?? [])
      : perLocationQueries.flatMap((q) => q.data ?? []);

  const isLoading =
    locationId !== null
      ? singleLocationQuery.isLoading
      : allLocationsQuery.isLoading || perLocationQueries.some((q) => q.isLoading);

  const assignRoleMutation = useMutation({
    mutationFn: ({ employeeId, ...data }: { employeeId: string } & AssignRoleDTO) =>
      adminApi.assignRole(employeeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Role assigned");
    },
    onError: () => toast.error("Failed to assign role"),
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, roleName }: { userId: number; roleName: string }) => {
      const roles = await adminApi.getUserActiveRoles(userId);
      const target = roles.find((r) => r.role === roleName);
      if (!target) throw new Error(`Role ${roleName} not found on user`);
      return adminApi.removeRole(userId, target.roleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Role removed");
    },
    onError: () => toast.error("Failed to remove role"),
  });

  return { users, isLoading, assignRoleMutation, removeRoleMutation };
}
