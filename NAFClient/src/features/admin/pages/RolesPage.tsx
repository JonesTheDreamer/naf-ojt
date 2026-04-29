import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/AuthContext";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useAdminLocations } from "../hooks/useAdminLocations";
import { searchEmployees } from "@/shared/api/employeeService";
import type { Employee } from "@/shared/types/api/employee";

const ROLES = ["ADMIN", "MANAGEMENT", "REQUESTOR_APPROVER", "HR"];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-amber-100 text-amber-800 border border-amber-200",
  MANAGEMENT: "bg-blue-100 text-blue-800 border border-blue-200",
  HR: "bg-green-100 text-green-800 border border-green-200",
  REQUESTOR_APPROVER: "bg-slate-100 text-slate-700 border border-slate-200",
};

export default function RolesPage() {
  const { user } = useAuth();
  const [viewAll, setViewAll] = useState(false);
  const locationId = viewAll ? null : (user?.locationId ?? null);

  const { users, isLoading, assignRoleMutation, removeRoleMutation } =
    useAdminUsers(locationId);
  const { locationsQuery } = useAdminLocations();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState("");
  const [formLocationId, setFormLocationId] = useState(user?.locationId ?? 0);
  const [formError, setFormError] = useState("");

  // Employee lookup preview
  const [empLookup, setEmpLookup] = useState<{
    state: "idle" | "loading" | "found" | "not_found";
    employee: Employee | null;
  }>({ state: "idle", employee: null });

  useEffect(() => {
    if (!employeeId.trim()) {
      setEmpLookup({ state: "idle", employee: null });
      return;
    }
    const timer = setTimeout(async () => {
      setEmpLookup({ state: "loading", employee: null });
      try {
        const results = await searchEmployees(employeeId.trim());
        const match = results.find((e) => e.id === employeeId.trim());
        if (match) {
          setEmpLookup({ state: "found", employee: match });
        } else {
          setEmpLookup({ state: "not_found", employee: null });
        }
      } catch {
        setEmpLookup({ state: "not_found", employee: null });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [employeeId]);

  // Inline removal confirmation
  const [pendingRemove, setPendingRemove] = useState<{
    userId: number;
    roleName: string;
  } | null>(null);

  // Search/filter
  const [search, setSearch] = useState("");
  const filtered = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.employeeId}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!formLocationId) {
      setFormError("Please select a location.");
      return;
    }
    try {
      await assignRoleMutation.mutateAsync({
        employeeId,
        role,
        locationId: formLocationId,
      });
      setEmployeeId("");
      setRole("");
      setEmpLookup({ state: "idle", employee: null });
      setSheetOpen(false);
    } catch {
      setFormError(
        "Failed to assign role. Check the employee ID and try again.",
      );
    }
  };

  const handleConfirmRemove = async () => {
    if (!pendingRemove) return;
    await removeRoleMutation.mutateAsync(pendingRemove);
    setPendingRemove(null);
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-amber-500">Roles Management</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewAll((v) => !v)}
          >
            {viewAll ? "My Location" : "View All"}
          </Button>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button size="sm">Assign Role</Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Assign Role</SheetTitle>
              </SheetHeader>

              <form onSubmit={handleAssign} className="flex flex-col gap-4 mt-4">
                <div className="flex flex-col gap-1">
                  <Label>Employee ID</Label>
                  <Input
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. EMP001"
                    required
                  />
                  {empLookup.state === "loading" && (
                    <p className="text-xs text-muted-foreground">
                      Looking up employee…
                    </p>
                  )}
                  {empLookup.state === "found" && empLookup.employee && (
                    <p className="text-xs text-green-700">
                      {empLookup.employee.firstName} {empLookup.employee.lastName}{" "}
                      · {empLookup.employee.position}
                    </p>
                  )}
                  {empLookup.state === "not_found" && (
                    <p className="text-xs text-red-500">Employee not found</p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <Label>Role</Label>
                  <select
                    className="border rounded px-3 py-2 text-sm"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="">Select role</option>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <Label>Location</Label>
                  <select
                    className="border rounded px-3 py-2 text-sm"
                    value={formLocationId}
                    onChange={(e) => setFormLocationId(Number(e.target.value))}
                    required
                  >
                    <option value={0}>Select location</option>
                    {locationsQuery.data?.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formError && <p className="text-sm text-red-500">{formError}</p>}

                <Button
                  type="submit"
                  disabled={assignRoleMutation.isPending}
                  className="w-full"
                >
                  {assignRoleMutation.isPending ? "Assigning…" : "Assign Role"}
                </Button>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Full-width user roles list */}
      <div className="space-y-3">
        <Input
          placeholder="Search by name or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        {isLoading && (
          <p className="text-muted-foreground text-sm">Loading…</p>
        )}

        {!isLoading && filtered.length === 0 && (
          <p className="text-muted-foreground text-sm">
            {search ? "No users match your search." : "No users found."}
          </p>
        )}

        {filtered.map((u) => (
          <Card key={u.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="font-semibold">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {u.employeeId} · {u.location}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {u.roles.map((roleName) => {
                    const isPending =
                      pendingRemove?.userId === u.id &&
                      pendingRemove?.roleName === roleName;
                    return (
                      <div key={roleName} className="flex items-center gap-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[roleName] ?? "bg-gray-100 text-gray-700 border border-gray-200"}`}
                        >
                          {roleName}
                        </span>
                        {isPending ? (
                          <span className="flex items-center gap-1 text-xs">
                            <span className="text-muted-foreground">
                              Remove?
                            </span>
                            <button
                              className="text-red-600 font-semibold hover:underline"
                              onClick={handleConfirmRemove}
                              disabled={removeRoleMutation.isPending}
                            >
                              Yes
                            </button>
                            <button
                              className="text-muted-foreground hover:underline"
                              onClick={() => setPendingRemove(null)}
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            className="text-red-400 hover:text-red-600 text-xs ml-0.5"
                            title={`Remove ${roleName}`}
                            onClick={() =>
                              setPendingRemove({ userId: u.id, roleName })
                            }
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
