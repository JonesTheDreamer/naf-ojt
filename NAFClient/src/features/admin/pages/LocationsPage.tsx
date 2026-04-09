import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminLocations } from "../hooks/useAdminLocations";
import { useAdminUsers } from "../hooks/useAdminUsers";
import type { AssignLocationDTO } from "@/services/EntityAPI/adminService";

export default function LocationsPage() {
  const { locationsQuery } = useAdminLocations();
  const { usersQuery, addUserMutation: _ } = useAdminUsers();
  const { assignLocationMutation } = useAdminLocations();
  const [form, setForm] = useState<AssignLocationDTO>({ employeeId: "", location: "" });
  const [formError, setFormError] = useState("");

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      await assignLocationMutation.mutateAsync(form);
      setForm({ employeeId: "", location: "" });
    } catch {
      setFormError("Failed to assign location.");
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-amber-500">Locations Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Assign Location to Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAssign} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1">
              <Label>Employee ID</Label>
              <Input
                value={form.employeeId}
                onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                placeholder="Employee ID"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Location</Label>
              <select
                className="border rounded px-3 py-2 text-sm"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                required
              >
                <option value="">Select location</option>
                {locationsQuery.data?.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
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
            <span key={loc} className="border rounded px-3 py-1 text-sm">{loc}</span>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Users by Location</h2>
        {usersQuery.isLoading && <p className="text-muted-foreground">Loading...</p>}
        {usersQuery.data?.map((user) => (
          <div key={user.employeeId} className="flex items-center justify-between border-b py-2 text-sm">
            <span className="font-medium">{user.employeeId}</span>
            <span className="text-muted-foreground">{user.location || "—"}</span>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
