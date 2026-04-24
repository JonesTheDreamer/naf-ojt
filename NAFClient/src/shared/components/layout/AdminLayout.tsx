import { Home, Users, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import Layout from "./Layout";
import { useAuth } from "@/features/auth/AuthContext";

const navItems = [
  { label: "Home", icon: <Home className="w-5 h-5" />, href: "/admin" },
  { label: "Roles", icon: <Users className="w-5 h-5" />, href: "/admin/roles" },
  { label: "Locations", icon: <MapPin className="w-5 h-5" />, href: "/admin/locations" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <Layout navItems={navItems} currentUser={{ name: user?.name ?? "Admin" }}>
      {children}
    </Layout>
  );
}
