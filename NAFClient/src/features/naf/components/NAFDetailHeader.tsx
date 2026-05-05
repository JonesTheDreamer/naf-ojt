import { Briefcase, Building2, MapPin, Monitor, ShieldOff, User } from "lucide-react";
import type { NAF } from "@/shared/types/api/naf";

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 text-gray-300 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium leading-none mb-0.5">
          {label}
        </p>
        <p className="text-sm text-gray-800 font-medium truncate">
          {value || <span className="text-gray-300 italic font-normal">—</span>}
        </p>
      </div>
    </div>
  );
}

function PlaceholderRow({ icon, label, placeholder }: { icon: React.ReactNode; label: string; placeholder: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 text-gray-200 shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium leading-none mb-0.5">{label}</p>
        <p className="text-sm text-gray-300 italic font-normal">{placeholder}</p>
      </div>
    </div>
  );
}

interface NAFDetailHeaderProps {
  naf: NAF;
  onDeactivate?: () => void;
}

export function NAFDetailHeader({ naf, onDeactivate }: NAFDetailHeaderProps) {
  const employee = naf?.employee;

  if (!employee) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-6 py-5 text-sm text-gray-400 italic">
        Employee details unavailable.
      </div>
    );
  }

  const initials = `${employee.firstName?.[0] ?? ""}${employee.lastName?.[0] ?? ""}`.toUpperCase();
  const fullName = [employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(" ");

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50/50">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
          Employee Record
        </p>
        {onDeactivate && (
          <button
            onClick={onDeactivate}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
          >
            <ShieldOff className="w-3.5 h-3.5" />
            Deactivate Access
          </button>
        )}
      </div>

      {/* Card body */}
      <div className="px-6 py-5 flex items-start gap-5">
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-sm"
          style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
        >
          {initials}
        </div>

        {/* Identity + details */}
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-gray-900 leading-tight tracking-tight">{fullName}</p>
          <p className="font-mono text-[11px] text-gray-400 tracking-wider mt-0.5">{employee.id}</p>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3.5">
            <InfoRow icon={<Briefcase className="w-3.5 h-3.5" />} label="Position"   value={employee.position} />
            <InfoRow icon={<User      className="w-3.5 h-3.5" />} label="Department" value={employee.departmentDesc ?? employee.departmentId} />
            <InfoRow icon={<Building2 className="w-3.5 h-3.5" />} label="Company"    value={employee.company} />
            <InfoRow icon={<MapPin    className="w-3.5 h-3.5" />} label="Location"   value={employee.location} />
            <PlaceholderRow icon={<Monitor className="w-3.5 h-3.5" />} label="Domain"   placeholder="Not yet assigned" />
            <PlaceholderRow icon={<User    className="w-3.5 h-3.5" />} label="Username" placeholder="Not yet assigned" />
          </div>
        </div>
      </div>
    </div>
  );
}
