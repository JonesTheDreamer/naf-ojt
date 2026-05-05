import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";
import { toast } from "sonner";

export function useAdminUsers() {
  const queryClient = useQueryClient();

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  const createUserMutation = useMutation({
    mutationFn: ({ employeeId, role, locationId }: { employeeId: string; role: string; locationId: number }) =>
      adminApi.createUser(employeeId, { role, locationId }),
    onSuccess: () => { invalidateUsers(); toast.success("User added"); },
    onError: () => toast.error("Failed to add user"),
  });

  const addRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      adminApi.addRole(userId, role),
    onSuccess: () => { invalidateUsers(); toast.success("Role assigned"); },
    onError: () => toast.error("Failed to assign role"),
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, roleName }: { userId: number; roleName: string }) => {
      const roles = await adminApi.getUserActiveRoles(userId);
      const target = roles.find((r) => r.role === roleName);
      if (!target) throw new Error(`Role ${roleName} not found on user`);
      return adminApi.removeRole(userId, target.roleId);
    },
    onSuccess: () => { invalidateUsers(); toast.success("Role removed"); },
    onError: () => toast.error("Failed to remove role"),
  });

  return { createUserMutation, addRoleMutation, removeRoleMutation };
}
