import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/AuthContext";
import { useAdminLocations } from "../hooks/useAdminLocations";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { searchEmployees } from "@/shared/api/employeeService";
import type { Employee } from "@/shared/types/api/employee";

export default function LocationsPage() {
  const { user } = useAuth();
  const [viewAll, setViewAll] = useState(false);
  const locationId = viewAll ? null : (user?.locationId ?? null);

  const { locationsQuery, allUsers, assignLocationMutation, removeLocationMutation } =
    useAdminLocations();
  const { users, isLoading } = useAdminUsers(locationId);

  // Dialog state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState(0);
  const [formError, setFormError] = useState("");

  // Employee lookup preview
  const [empLookup, setEmpLookup] = useState<{
    state: "idle" | "loading" | "found" | "not_found" | "no_account";
    employee: Employee | null;
    userId: number | null;
  }>({ state: "idle", employee: null, userId: null });

  useEffect(() => {
    if (!employeeId.trim()) {
      setEmpLookup({ state: "idle", employee: null, userId: null });
      return;
    }
    const timer = setTimeout(async () => {
      setEmpLookup({ state: "loading", employee: null, userId: null });
      try {
        const results = await searchEmployees(employeeId.trim());
        const match = results.find((e) => e.id === employeeId.trim());
        if (!match) {
          setEmpLookup({ state: "not_found", employee: null, userId: null });
          return;
        }
        const userRecord = allUsers.find((u) => u.employeeId === match.id);
        if (!userRecord) {
          setEmpLookup({ state: "no_account", employee: match, userId: null });
          return;
        }
        setEmpLookup({ state: "found", employee: match, userId: userRecord.id });
      } catch {
        setEmpLookup({ state: "not_found", employee: null, userId: null });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [employeeId, allUsers]);

  // Inline removal confirmation
  const [pendingRemove, setPendingRemove] = useState<{
    userId: number;
    locationId: number;
  } | null>(null);

  // Search / filter
  const [search, setSearch] = useState("");
  const filtered = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.employeeId}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (empLookup.state === "no_account") {
      setFormError("No system account found. Assign a role first.");
      return;
    }
    if (empLookup.state !== "found" || empLookup.userId === null) {
      setFormError("Employee not found. Please enter a valid employee ID.");
      return;
    }
    if (!selectedLocationId) {
      setFormError("Please select a location.");
      return;
    }
    try {
      await assignLocationMutation.mutateAsync({
        userId: empLookup.userId,
        locationId: selectedLocationId,
      });
      setEmployeeId("");
      setSelectedLocationId(0);
      setEmpLookup({ state: "idle", employee: null, userId: null });
      setSheetOpen(false);
    } catch {
      setFormError("Failed to assign location. Please try again.");
    }
  };

  const handleConfirmRemove = async () => {
    if (!pendingRemove) return;
    await removeLocationMutation.mutateAsync(pendingRemove);
    setPendingRemove(null);
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-amber-500">Locations Management</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewAll((v) => !v)}
          >
            {viewAll ? "My Location" : "View All"}
          </Button>

          <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Assign Location</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Assign Location</DialogTitle>
              </DialogHeader>

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
                  {empLookup.state === "no_account" && empLookup.employee && (
                    <p className="text-xs text-red-500">
                      {empLookup.employee.firstName} {empLookup.employee.lastName}{" "}
                      — No system account. Assign a role first.
                    </p>
                  )}
                  {empLookup.state === "not_found" && (
                    <p className="text-xs text-red-500">Employee not found</p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <Label>Location</Label>
                  <select
                    className="border rounded px-3 py-2 text-sm"
                    value={selectedLocationId}
                    onChange={(e) =>
                      setSelectedLocationId(Number(e.target.value))
                    }
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

                {formError && (
                  <p className="text-sm text-red-500">{formError}</p>
                )}

                <Button
                  type="submit"
                  disabled={assignLocationMutation.isPending}
                  className="w-full"
                >
                  {assignLocationMutation.isPending
                    ? "Assigning…"
                    : "Assign Location"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search + user list */}
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

        {filtered.map((u) => {
          const hasLocation = u.locationId && u.location;
          const isPending = pendingRemove?.userId === u.id;
          return (
            <Card key={u.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-semibold">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {u.employeeId} · {u.department}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasLocation ? (
                      <>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          {u.location}
                        </span>
                        {isPending ? (
                          <span className="flex items-center gap-1 text-xs">
                            <span className="text-muted-foreground">
                              Remove?
                            </span>
                            <button
                              className="text-red-600 font-semibold hover:underline"
                              onClick={handleConfirmRemove}
                              disabled={removeLocationMutation.isPending}
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
                            title="Remove location"
                            onClick={() =>
                              setPendingRemove({
                                userId: u.id,
                                locationId: u.locationId,
                              })
                            }
                          >
                            ✕
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminLayout>
  );
}
