import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useAuth } from "@/features/auth/AuthContext";
import { useAdminAllUsers } from "../hooks/useAdminAllUsers";

export default function AdminHomePage() {
  const { user } = useAuth();
  const { users, isLoading } = useAdminAllUsers();

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-amber-500">Admin Dashboard</h1>
      <p className="text-muted-foreground">Welcome, {user?.name}.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-3xl font-bold">
            {isLoading ? "..." : users.length}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
