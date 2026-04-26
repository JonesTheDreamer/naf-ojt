import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/AuthContext";
import { useAdminLocations } from "../hooks/useAdminLocations";
import { useAdminUsers } from "../hooks/useAdminUsers";

export default function LocationsPage() {
  const { user } = useAuth();
  const [viewAll, setViewAll] = useState(false);
  const locationId = viewAll ? null : (user?.locationId ?? null);

  const { locationsQuery, assignLocationMutation } = useAdminLocations();
  const { users, isLoading } = useAdminUsers(locationId);

  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [selectedLocationId, setSelectedLocationId] = useState<number | "">("");
  const [formError, setFormError] = useState("");

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId === "" || selectedLocationId === "") return;
    setFormError("");
    try {
      await assignLocationMutation.mutateAsync({ userId: selectedUserId, locationId: selectedLocationId });
      setSelectedUserId("");
      setSelectedLocationId("");
    } catch {
      setFormError("Failed to assign location.");
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-500">Locations Management</h1>
        <Button variant="outline" size="sm" onClick={() => setViewAll((v) => !v)}>
          {viewAll ? "My Location" : "View All"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assign Location to User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAssign} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1">
              <Label>Employee</Label>
              <select
                className="border rounded px-3 py-2 text-sm"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value === "" ? "" : Number(e.target.value))}
                required
              >
                <option value="">Select employee</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.employeeId})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Location</Label>
              <select
                className="border rounded px-3 py-2 text-sm"
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value === "" ? "" : Number(e.target.value))}
                required
              >
                <option value="">Select location</option>
                {locationsQuery.data?.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={assignLocationMutation.isPending}>
              {assignLocationMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
          </form>
          {formError && <p className="text-sm text-red-500 mt-2">{formError}</p>}
        </CardContent>
      </Card>

      <div>
        <h2 className="font-semibold mb-3">Available Locations</h2>
        {locationsQuery.isLoading && <p className="text-muted-foreground">Loading...</p>}
        <div className="flex flex-wrap gap-2">
          {locationsQuery.data?.map((loc) => (
            <span key={loc.id} className="border rounded px-3 py-1 text-sm">{loc.name}</span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h2 className="font-semibold mb-3">Users</h2>
        {isLoading && <p className="text-muted-foreground">Loading...</p>}
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between border-b py-2 text-sm">
            <span className="font-medium">{u.firstName} {u.lastName}</span>
            <span className="text-muted-foreground">{u.employeeId} · {u.location || "—"}</span>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
