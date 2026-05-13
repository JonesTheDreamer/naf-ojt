import { Home, Users, FileText, ClipboardList, Box, Building2 } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import { useAuth } from "@/features/auth/AuthContext";

const navItems = [
  { label: "Home", icon: <Home className="w-5 h-5" />, href: "/admin" },
  { label: "NAFs", icon: <FileText className="w-5 h-5" />, href: "/admin/NAF" },
  { label: "Resource Requests", icon: <ClipboardList className="w-5 h-5" />, href: "/admin/resource-requests" },
  { label: "Users", icon: <Users className="w-5 h-5" />, href: "/admin/users" },
  { label: "Resources", icon: <Box className="w-5 h-5" />, href: "/admin/resources" },
  { label: "Departments", icon: <Building2 className="w-5 h-5" />, href: "/admin/departments" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Layout navItems={navItems} currentUser={{ name: user?.name ?? "Admin" }} onLogout={handleLogout}>
      {children}
    </Layout>
  );
}
