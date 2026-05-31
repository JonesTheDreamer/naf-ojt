import { Shield } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/shared/components/layout/Layout";
import { useAuth } from "@/features/auth/AuthContext";

const navItems = [
  { label: "SOC Queue", icon: <Shield className="w-5 h-5" />, href: "/soc" },
];

export default function SocLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Layout
      navItems={navItems}
      currentUser={{ name: user?.name ?? "SOC" }}
      onLogout={handleLogout}
    >
      {children}
    </Layout>
  );
}
