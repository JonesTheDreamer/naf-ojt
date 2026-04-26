import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/AuthContext";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useAdminLocations } from "../hooks/useAdminLocations";
import type { AddUserDTO } from "../types";

const ROLES = ["ADMIN", "TECHNICAL_TEAM", "REQUESTOR_APPROVER"];

export default function RolesPage() {
  const { user } = useAuth();
  const [viewAll, setViewAll] = useState(false);
  const locationId = viewAll ? null : (user?.locationId ?? null);

  const { users, isLoading, addUserMutation, removeRoleMutation } = useAdminUsers(locationId);
  const { locationsQuery } = useAdminLocations();

  const [form, setForm] = useState<AddUserDTO>({ employeeId: "", role: "", locationId: user?.locationId ?? 0 });
  const [formError, setFormError] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      await addUserMutation.mutateAsync(form);
      setForm({ employeeId: "", role: "", locationId: user?.locationId ?? 0 });
    } catch {
      setFormError("Failed to add user. Check the employee ID and role.");
    }
  };

  const handleRemoveRole = async (userId: number, roleName: string) => {
    await removeRoleMutation.mutateAsync({ userId, roleName });
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-500">Roles Management</h1>
        <Button variant="outline" size="sm" onClick={() => setViewAll((v) => !v)}>
          {viewAll ? "My Location" : "View All"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add User Role</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
              <Label>Role</Label>
              <select
                className="border rounded px-3 py-2 text-sm"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                required
              >
                <option value="">Select role</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Location</Label>
              <select
                className="border rounded px-3 py-2 text-sm"
                value={form.locationId}
                onChange={(e) => setForm((f) => ({ ...f, locationId: Number(e.target.value) }))}
                required
              >
                <option value={0}>Select location</option>
                {locationsQuery.data?.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={addUserMutation.isPending}>
              {addUserMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </form>
          {formError && <p className="text-sm text-red-500 mt-2">{formError}</p>}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading && <p className="text-muted-foreground">Loading...</p>}
        {users.map((u) => (
          <Card key={u.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-semibold">{u.firstName} {u.lastName}</p>
                  <p className="text-sm text-muted-foreground">{u.employeeId} · {u.location}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {u.roles.map((roleName) => (
                    <div key={roleName} className="flex items-center gap-1">
                      <Badge variant="secondary">{roleName}</Badge>
                      <button
                        className="text-red-400 hover:text-red-600 text-xs ml-1"
                        onClick={() => handleRemoveRole(u.id, roleName)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
