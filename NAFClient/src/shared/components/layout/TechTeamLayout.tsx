import { Home, ClipboardList, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import { useAuth } from "@/features/auth/AuthContext";

const navItems = [
  { label: "Home", icon: <Home className="w-5 h-5" />, href: "/tech" },
  { label: "My Tasks", icon: <ClipboardList className="w-5 h-5" />, href: "/tech/my-tasks" },
  { label: "For Implementations", icon: <Wrench className="w-5 h-5" />, href: "/tech/for-implementations" },
];

export default function TechTeamLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Layout navItems={navItems} currentUser={{ name: user?.name ?? "Tech Team" }} onLogout={handleLogout}>
      {children}
    </Layout>
  );
}
