import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useMyTasks } from "../hooks/useMyTasks";

export default function MyTasksPage() {
  const { myTasksQuery } = useMyTasks();
  const nafs = myTasksQuery.data ?? [];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-amber-500">My Tasks</h1>
      {myTasksQuery.isLoading && <p className="text-muted-foreground">Loading...</p>}
      {!myTasksQuery.isLoading && nafs.length === 0 && (
        <p className="text-muted-foreground">No tasks assigned to you.</p>
      )}
    </AdminLayout>
  );
}
