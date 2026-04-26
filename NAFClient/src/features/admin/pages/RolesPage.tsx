import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminUsers } from "../hooks/useAdminUsers";
import type { AddUserDTO } from "../api";

const ROLES = ["ADMIN", "TECHNICAL_TEAM", "REQUESTOR_APPROVER"];

export default function RolesPage() {
  const { usersQuery, addUserMutation, removeRoleMutation } = useAdminUsers();
  const [form, setForm] = useState<AddUserDTO>({ employeeId: "", role: "", location: "" });
  const [formError, setFormError] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      await addUserMutation.mutateAsync(form);
      setForm({ employeeId: "", role: "", location: "" });
    } catch {
      setFormError("Failed to add user. Check the employee ID and role.");
    }
  };

  const handleRemoveRole = async (employeeId: string, role: string) => {
    await removeRoleMutation.mutateAsync({ employeeId, role });
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-amber-500">Roles Management</h1>

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
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Location"
                required
              />
            </div>
            <Button type="submit" disabled={addUserMutation.isPending}>
              {addUserMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </form>
          {formError && <p className="text-sm text-red-500 mt-2">{formError}</p>}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {usersQuery.isLoading && <p className="text-muted-foreground">Loading...</p>}
        {usersQuery.data?.map((user) => (
          <Card key={user.employeeId}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-semibold">{user.employeeId}</p>
                  <p className="text-sm text-muted-foreground">{user.location}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.roles
                    .filter((r) => !r.dateRemoved)
                    .map((r) => (
                      <div key={r.id} className="flex items-center gap-1">
                        <Badge variant="secondary">{r.role}</Badge>
                        <button
                          className="text-red-400 hover:text-red-600 text-xs ml-1"
                          onClick={() => handleRemoveRole(user.employeeId, r.role)}
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
