import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService, type AddUserDTO } from "@/services/EntityAPI/adminService";
import { toast } from "sonner";

export function useAdminUsers() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminService.getUsers,
  });

  const addUserMutation = useMutation({
    mutationFn: (data: AddUserDTO) => adminService.addUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User added");
    },
    onError: () => toast.error("Failed to add user"),
  });

  const removeRoleMutation = useMutation({
    mutationFn: ({ employeeId, role }: { employeeId: string; role: string }) =>
      adminService.removeRole(employeeId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Role removed");
    },
    onError: () => toast.error("Failed to remove role"),
  });

  return { usersQuery, addUserMutation, removeRoleMutation };
}
