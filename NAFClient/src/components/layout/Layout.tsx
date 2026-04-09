import { useState } from "react";
import { cn } from "@/lib/utils";
import Header from "./Header";
import Sidebar from "./Sidebar";
import type { NavItem } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  currentUser?: {
    name: string;
  };
  navItems: NavItem[];
}

export default function Layout({
  children,
  currentUser = { name: "User" },
  navItems,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuToggle = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen">
      {/* Header — fixed, full width */}
      <Header onMenuToggle={handleMenuToggle} />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        currentUser={currentUser}
        navItems={navItems}
      />

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content area */}
      <main
        className={cn(
          "pt-14 min-h-screen transition-all duration-300 ease-in-out flex flex-col gap-5",
        )}
      >
        <div className="p-6 flex flex-col gap-5">{children}</div>
      </main>
    </div>
  );
}
