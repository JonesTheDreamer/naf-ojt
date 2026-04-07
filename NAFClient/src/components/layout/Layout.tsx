import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  currentUser?: {
    name: string;
  };
  activeItem?: string;
}

export default function Layout({
  children,
  currentUser = { name: "John Dela Cruz" },
  activeItem = "NAF",
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
        activeItem={activeItem}
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
          // sidebarOpen ? "md:pl-64" : "md:pl-0",
        )}
      >
        <div className="p-6 flex flex-col gap-5">{children}</div>
      </main>
    </div>
  );
}
