import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, X, Check, Plus, Building2, Briefcase, User } from "lucide-react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { useAdminAllUsers } from "../hooks/useAdminAllUsers";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { RoutesEnum } from "@/app/routesEnum";

const ROLES = ["ADMIN", "MANAGEMENT", "REQUESTOR_APPROVER", "HR"];

const ROLE_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  ADMIN:              { bg: "bg-amber-50",  text: "text-amber-800",  border: "border-amber-200", dot: "bg-amber-400" },
  MANAGEMENT:         { bg: "bg-blue-50",   text: "text-blue-800",   border: "border-blue-200",  dot: "bg-blue-400"  },
  HR:                 { bg: "bg-emerald-50",text: "text-emerald-800",border: "border-emerald-200",dot: "bg-emerald-400"},
  REQUESTOR_APPROVER: { bg: "bg-slate-50",  text: "text-slate-700",  border: "border-slate-200", dot: "bg-slate-400" },
};

function RoleChip({
  roleName,
  onRemove,
  isRemoving,
}: {
  roleName: string;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const cfg = ROLE_CONFIG[roleName] ?? { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", dot: "bg-gray-400" };

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 pl-2.5 pr-1 py-0.5">
        <span className="text-xs font-medium text-red-700">Remove {roleName}?</span>
        <button
          onClick={() => { onRemove(); setConfirming(false); }}
          disabled={isRemoving}
          className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
          title="Confirm"
        >
          <Check className="w-3 h-3 text-white" />
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 hover:bg-red-200 transition-colors"
          title="Cancel"
        >
          <X className="w-3 h-3 text-red-600" />
        </button>
      </span>
    );
  }

  return (
    <span className={`group inline-flex items-center gap-1.5 rounded-full border ${cfg.border} ${cfg.bg} pl-2.5 pr-1.5 py-0.5`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      <span className={`text-xs font-medium ${cfg.text}`}>{roleName}</span>
      <button
        onClick={() => setConfirming(true)}
        className={`ml-0.5 opacity-0 group-hover:opacity-100 flex items-center justify-center w-4 h-4 rounded-full hover:bg-red-100 transition-all ${cfg.text}`}
        title={`Remove ${roleName}`}
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 text-gray-400 shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium leading-none mb-0.5">{label}</p>
        <p className="text-sm text-gray-800 font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { users, isLoading } = useAdminAllUsers();
  const { addRoleMutation, removeRoleMutation } = useAdminUsers();

  const user = users.find((u) => u.id === Number(userId));

  const [addRoleValue, setAddRoleValue] = useState("");

  const handleAddRole = async () => {
    if (!user || !addRoleValue) return;
    await addRoleMutation.mutateAsync({ userId: user.id, role: addRoleValue });
    setAddRoleValue("");
  };

  const handleRemoveRole = async (roleName: string) => {
    if (!user) return;
    await removeRoleMutation.mutateAsync({ userId: user.id, roleName });
  };

  const availableRoles = ROLES.filter((r) => !user?.roles.includes(r));

  const initials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
    : "??";

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center gap-3 py-12 text-gray-400">
          <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-amber-400 animate-spin" />
          <span className="text-sm">Loading user…</span>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="py-12 text-center">
          <p className="text-gray-400 text-sm">User not found.</p>
          <button
            className="mt-3 text-sm text-amber-600 hover:text-amber-700 underline underline-offset-2"
            onClick={() => navigate(RoutesEnum.ADMIN_USERS)}
          >
            Back to users
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* Back nav */}
      <button
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        onClick={() => navigate(RoutesEnum.ADMIN_USERS)}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Users</span>
      </button>

      {/* Profile hero */}
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-md"
          style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
        >
          {initials}
        </div>

        {/* Identity */}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">
            {user.firstName} {user.middleName ? `${user.middleName} ` : ""}{user.lastName}
          </h1>
          <p className="font-mono text-xs text-gray-400 mt-0.5 tracking-wider">{user.employeeId}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Briefcase className="w-3.5 h-3.5 text-gray-400" />
              {user.position || "—"}
            </span>
            <span className="w-px h-3 bg-gray-200" />
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              {user.company || "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Employee info — spans 1 col on mobile, 1 col on lg */}
        <div className="lg:col-span-1 rounded-xl border border-gray-100 bg-gray-50/60 p-5 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Employee Info</p>
          <div className="space-y-3.5">
            <MetaItem
              icon={<User className="w-3.5 h-3.5" />}
              label="Department"
              value={user.department || "—"}
            />
            <MetaItem
              icon={<Briefcase className="w-3.5 h-3.5" />}
              label="Position"
              value={user.position || "—"}
            />
            <MetaItem
              icon={<Building2 className="w-3.5 h-3.5" />}
              label="Company"
              value={user.company || "—"}
            />
          </div>
        </div>

        {/* Right column: Roles + Location stacked */}
        <div className="lg:col-span-2 space-y-4">

          {/* Roles */}
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Roles</p>
              </div>
              <span className="text-xs text-gray-300">{user.roles.length} assigned</span>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[28px]">
              {user.roles.map((roleName) => (
                <RoleChip
                  key={roleName}
                  roleName={roleName}
                  onRemove={() => handleRemoveRole(roleName)}
                  isRemoving={removeRoleMutation.isPending}
                />
              ))}
              {user.roles.length === 0 && (
                <span className="text-xs text-gray-400 italic">No roles assigned</span>
              )}
            </div>

            {availableRoles.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                <select
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all"
                  value={addRoleValue}
                  onChange={(e) => setAddRoleValue(e.target.value)}
                >
                  <option value="">Select a role to add…</option>
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  disabled={!addRoleValue || addRoleMutation.isPending}
                  onClick={handleAddRole}
                  className="bg-amber-500 hover:bg-amber-600 text-white border-0 shrink-0 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>
      </div>
    </AdminLayout>
  );
}
