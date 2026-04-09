import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService, type AddUserDTO } from "@/services/EntityAPI/adminService";

export function useAdminUsers() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminService.getUsers,
  });

  const addUserMutation = useMutation({
    mutationFn: (data: AddUserDTO) => adminService.addUser(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const removeRoleMutation = useMutation({
    mutationFn: ({ employeeId, role }: { employeeId: string; role: string }) =>
      adminService.removeRole(employeeId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return { usersQuery, addUserMutation, removeRoleMutation };
}
