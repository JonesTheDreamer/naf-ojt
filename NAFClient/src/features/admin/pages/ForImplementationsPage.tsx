import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useAuth } from "@/features/auth/AuthContext";
import { useForImplementations } from "../hooks/useForImplementations";

export default function ForImplementationsPage() {
  const { user } = useAuth();
  const locationId = user?.locationId ?? null;
  const { forImplementationsQuery } = useForImplementations(locationId);
  const nafs = forImplementationsQuery.data ?? [];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-amber-500">For Implementations</h1>
      {forImplementationsQuery.isLoading && <p className="text-muted-foreground">Loading...</p>}
      {!forImplementationsQuery.isLoading && nafs.length === 0 && (
        <p className="text-muted-foreground">No items for implementation.</p>
      )}
    </AdminLayout>
  );
}
