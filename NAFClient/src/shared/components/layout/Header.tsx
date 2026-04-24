import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/assets/images/smpc_logo.png";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center h-14 bg-white border-b border-gray-200 px-4 gap-3">
      {/* Hamburger menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
        onClick={onMenuToggle}
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Logo placeholder */}
      <img src={Logo} alt="Logo" className="w-24 md:w-32" />
    </header>
  );
}
