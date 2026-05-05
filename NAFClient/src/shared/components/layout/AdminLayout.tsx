import { Home, Users, FileText, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import Layout from "./Layout";
import { useAuth } from "@/features/auth/AuthContext";

const navItems = [
  { label: "Home", icon: <Home className="w-5 h-5" />, href: "/admin" },
  { label: "NAFs", icon: <FileText className="w-5 h-5" />, href: "/admin/NAF" },
  { label: "Implementations", icon: <Wrench className="w-5 h-5" />, href: "/admin/for-implementations" },
  { label: "Users", icon: <Users className="w-5 h-5" />, href: "/admin/users" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <Layout navItems={navItems} currentUser={{ name: user?.name ?? "Admin" }}>
      {children}
    </Layout>
  );
}
