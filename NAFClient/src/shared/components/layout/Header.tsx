import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/assets/images/smpc_logo.png";
import { useAuth } from "@/features/auth/AuthContext";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center h-14 bg-white border-b border-gray-200 px-4 gap-3">
      <Button
        variant="ghost"
        size="icon"
        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
        onClick={onMenuToggle}
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </Button>

      <img src={Logo} alt="Logo" className="w-24 md:w-32" />

      {/* Push bell to the right */}
      <div className="ml-auto">
        {user && <NotificationBell />}
      </div>
    </header>
  );
}
