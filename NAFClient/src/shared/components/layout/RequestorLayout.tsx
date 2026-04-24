import { Folder } from "lucide-react";
import type { ReactNode } from "react";
import Layout from "./Layout";
import { useAuth } from "@/features/auth/AuthContext";

const navItems = [
  { label: "NAF Directory", icon: <Folder className="w-5 h-5" />, href: "/NAF" },
];

export default function RequestorLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <Layout navItems={navItems} currentUser={{ name: user?.name ?? "User" }}>
      {children}
    </Layout>
  );
}
