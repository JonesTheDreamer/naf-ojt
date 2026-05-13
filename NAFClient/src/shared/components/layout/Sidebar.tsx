import { LogOut, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/shared/utils/utils";
import { useAuth } from "@/features/auth/AuthContext";

export interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  className?: string;
}

interface SidebarProps {
  isOpen?: boolean;
  currentUser?: {
    name: string;
  };
  navItems: NavItem[];
  onLogout?: () => void;
}

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  REQUESTOR_APPROVER: "/NAF",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  REQUESTOR_APPROVER: "Requestor",
};

export default function Sidebar({
  isOpen = true,
  currentUser = { name: "User" },
  navItems,
  onLogout,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, selectRole } = useAuth();

  const handleRoleSwitch = async (role: string) => {
    if (role === user?.activeRole) return;
    try {
      await selectRole(role);
      navigate(ROLE_HOME[role] ?? "/NAF");
    } catch {
      toast.error("Failed to switch role. Please try again.");
    }
  };

  return (
    <aside
      className={cn(
        "fixed top-14 left-0 bottom-0 z-40 flex flex-col w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out",
        !isOpen && "-translate-x-full",
      )}
    >
      {/* Role switcher — shown only when user has multiple roles */}
      {user && user.roles.length > 1 && (
        <div className="px-4 py-3 border-b border-gray-200">
          <p className="text-xs text-gray-400 mb-2">Role</p>
          <div className="flex flex-wrap gap-1.5">
            {user.roles.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleSwitch(role)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  role === user.activeRole
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
              >
                {ROLE_LABELS[role] ?? role}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    item.className,
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0",
                      isActive ? "text-gray-700" : "text-gray-400",
                    )}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section at the bottom */}
      <div className="border-t border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-400 leading-tight">Hello</p>
            <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
              {currentUser.name}
            </p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="shrink-0 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
