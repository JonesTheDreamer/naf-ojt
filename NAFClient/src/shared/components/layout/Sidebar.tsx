import { User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface SidebarProps {
  isOpen?: boolean;
  currentUser?: {
    name: string;
  };
  navItems: NavItem[];
}

export default function Sidebar({
  isOpen = true,
  currentUser = { name: "User" },
  navItems,
}: SidebarProps) {
  const location = useLocation();
  return (
    <aside
      className={cn(
        "fixed top-14 left-0 bottom-0 z-40 flex flex-col w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out",
        !isOpen && "-translate-x-full",
      )}
    >
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
          <div className="min-w-0">
            <p className="text-xs text-gray-400 leading-tight">Hello</p>
            <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
              {currentUser.name}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
