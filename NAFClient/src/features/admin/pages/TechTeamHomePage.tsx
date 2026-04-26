import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useAuth } from "@/features/auth/AuthContext";
import { useMyTasks } from "../hooks/useMyTasks";
import { useForImplementations } from "../hooks/useForImplementations";

export default function TechTeamHomePage() {
  const { user } = useAuth();
  const { myTasksQuery } = useMyTasks();
  const { forImplementationsQuery } = useForImplementations();

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-amber-500">Technical Team Dashboard</h1>
      <p className="text-muted-foreground">Welcome, {user?.name}.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">My Tasks</p>
          <p className="text-3xl font-bold">
            {myTasksQuery.isLoading ? "..." : (myTasksQuery.data?.length ?? 0)}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">For Implementations</p>
          <p className="text-3xl font-bold">
            {forImplementationsQuery.isLoading ? "..." : (forImplementationsQuery.data?.length ?? 0)}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
