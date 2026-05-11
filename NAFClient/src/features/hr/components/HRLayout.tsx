import { ClipboardList, FilePlus } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/shared/components/layout/Layout";
import { useAuth } from "@/features/auth/AuthContext";

const navItems = [
  { label: "Create NAF", icon: <FilePlus className="w-5 h-5" />, href: "/hr/create" },
  { label: "NAF History", icon: <ClipboardList className="w-5 h-5" />, href: "/hr" },
];

export default function HRLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Layout navItems={navItems} currentUser={{ name: user?.name ?? "HR" }} onLogout={handleLogout}>
      {children}
    </Layout>
  );
}
