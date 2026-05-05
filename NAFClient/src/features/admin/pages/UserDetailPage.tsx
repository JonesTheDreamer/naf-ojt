import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminAllUsers } from "../hooks/useAdminAllUsers";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useAdminLocations } from "../hooks/useAdminLocations";
import { RoutesEnum } from "@/app/routesEnum";

const ROLES = ["ADMIN", "MANAGEMENT", "REQUESTOR_APPROVER", "HR"];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-amber-100 text-amber-800 border border-amber-200",
  MANAGEMENT: "bg-blue-100 text-blue-800 border border-blue-200",
  HR: "bg-green-100 text-green-800 border border-green-200",
  REQUESTOR_APPROVER: "bg-slate-100 text-slate-700 border border-slate-200",
};

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { users, isLoading, locationsQuery } = useAdminAllUsers();
  const { assignRoleMutation, removeRoleMutation } = useAdminUsers();
  const { assignLocationMutation, removeLocationMutation } = useAdminLocations();

  const user = users.find((u) => u.id === Number(userId));

  const [pendingRemoveRole, setPendingRemoveRole] = useState<string | null>(null);
  const [locationEditing, setLocationEditing] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState(0);
  const [addRoleValue, setAddRoleValue] = useState("");
  const [addRoleError, setAddRoleError] = useState("");

  const handleAddRole = async () => {
    if (!user || !addRoleValue) return;
    if (!user.locationId) {
      setAddRoleError("Assign a location to this user before adding a role.");
      return;
    }
    setAddRoleError("");
    await assignRoleMutation.mutateAsync({
      employeeId: user.employeeId,
      role: addRoleValue,
      locationId: user.locationId,
    });
    setAddRoleValue("");
  };

  const availableRoles = ROLES.filter((r) => !user?.roles.includes(r));

  const handleRemoveRole = async (roleName: string) => {
    if (!user) return;
    await removeRoleMutation.mutateAsync({ userId: user.id, roleName });
    setPendingRemoveRole(null);
  };

  const handleChangeLocation = async () => {
    if (!user || !selectedLocationId) return;
    if (user.locationId) {
      await removeLocationMutation.mutateAsync({ userId: user.id, locationId: user.locationId });
    }
    await assignLocationMutation.mutateAsync({ userId: user.id, locationId: selectedLocationId });
    setLocationEditing(false);
    setSelectedLocationId(0);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground text-sm">Loading…</p>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground text-sm">User not found.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <button
          className="text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1"
          onClick={() => navigate(RoutesEnum.ADMIN_USERS)}
        >
          ← Users
        </button>
        <h1 className="text-2xl font-bold">
          {user.firstName} {user.lastName}
        </h1>
      </div>

      <div className="grid gap-4 max-w-2xl">
        {/* Employee Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Employee Info</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Full Name</span>
            <span>
              {user.firstName} {user.middleName ? user.middleName + " " : ""}{user.lastName}
            </span>
            <span className="text-muted-foreground">Employee ID</span>
            <span>{user.employeeId}</span>
            <span className="text-muted-foreground">Position</span>
            <span>{user.position}</span>
            <span className="text-muted-foreground">Department</span>
            <span>{user.department}</span>
            <span className="text-muted-foreground">Company</span>
            <span>{user.company}</span>
          </CardContent>
        </Card>

        {/* Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {user.roles.map((roleName) => {
                const isPending = pendingRemoveRole === roleName;
                return (
                  <div key={roleName} className="flex items-center gap-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[roleName] ?? "bg-gray-100 text-gray-700 border border-gray-200"}`}
                    >
                      {roleName}
                    </span>
                    {isPending ? (
                      <span className="flex items-center gap-1 text-xs">
                        <span className="text-muted-foreground">Remove?</span>
                        <button
                          className="text-red-600 font-semibold hover:underline"
                          onClick={() => handleRemoveRole(roleName)}
                          disabled={removeRoleMutation.isPending}
                        >
                          Yes
                        </button>
                        <button
                          className="text-muted-foreground hover:underline"
                          onClick={() => setPendingRemoveRole(null)}
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        className="text-red-400 hover:text-red-600 text-xs ml-0.5"
                        title={`Remove ${roleName}`}
                        onClick={() => setPendingRemoveRole(roleName)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
              {user.roles.length === 0 && (
                <span className="text-muted-foreground text-sm">No roles assigned.</span>
              )}
            </div>

            {availableRoles.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  className="border rounded px-3 py-1.5 text-sm"
                  value={addRoleValue}
                  onChange={(e) => {
                    setAddRoleValue(e.target.value);
                    setAddRoleError("");
                  }}
                >
                  <option value="">Add role…</option>
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!addRoleValue || assignRoleMutation.isPending}
                  onClick={handleAddRole}
                >
                  Add
                </Button>
                {addRoleError && (
                  <p className="text-xs text-red-500">{addRoleError}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.locationId ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                  {user.location}
                </span>
                {!locationEditing && (
                  <Button size="sm" variant="outline" onClick={() => setLocationEditing(true)}>
                    Change
                  </Button>
                )}
              </div>
            ) : (
              !locationEditing && (
                <Button size="sm" variant="outline" onClick={() => setLocationEditing(true)}>
                  Assign Location
                </Button>
              )
            )}

            {locationEditing && (
              <div className="flex items-center gap-2">
                <select
                  className="border rounded px-3 py-1.5 text-sm"
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(Number(e.target.value))}
                >
                  <option value={0}>Select location…</option>
                  {locationsQuery.data?.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  disabled={
                    !selectedLocationId ||
                    assignLocationMutation.isPending ||
                    removeLocationMutation.isPending
                  }
                  onClick={handleChangeLocation}
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setLocationEditing(false);
                    setSelectedLocationId(0);
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
