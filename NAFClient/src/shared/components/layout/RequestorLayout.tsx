import { Folder } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import { useAuth } from "@/features/auth/AuthContext";

const navItems = [
  { label: "NAF Directory", icon: <Folder className="w-5 h-5" />, href: "/NAF" },
];

export default function RequestorLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Layout navItems={navItems} currentUser={{ name: user?.name ?? "User" }} onLogout={handleLogout}>
      {children}
    </Layout>
  );
}
