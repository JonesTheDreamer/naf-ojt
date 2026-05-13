import {
  LogIn,
  FileText,
  ClipboardList,
  CheckCircle2,
  Users,
  Box,
  Activity,
} from "lucide-react";

export type EntityMeta = { label: string; icon: React.ReactNode; pill: string };

export const ENTITY_META: Record<string, EntityMeta> = {
  Auth: {
    label: "Auth",
    icon: <LogIn className="w-3.5 h-3.5" />,
    pill: "bg-slate-100 text-slate-600",
  },
  NAF: {
    label: "NAF",
    icon: <FileText className="w-3.5 h-3.5" />,
    pill: "bg-amber-100 text-amber-700",
  },
  ResourceRequest: {
    label: "Resource Request",
    icon: <ClipboardList className="w-3.5 h-3.5" />,
    pill: "bg-sky-100 text-sky-700",
  },
  ApprovalStep: {
    label: "Approval Step",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    pill: "bg-emerald-100 text-emerald-700",
  },
  User: {
    label: "User",
    icon: <Users className="w-3.5 h-3.5" />,
    pill: "bg-violet-100 text-violet-700",
  },
  Resource: {
    label: "Resource",
    icon: <Box className="w-3.5 h-3.5" />,
    pill: "bg-rose-100 text-rose-700",
  },
};

const FALLBACK_META: EntityMeta = {
  label: "System",
  icon: <Activity className="w-3.5 h-3.5" />,
  pill: "bg-gray-100 text-gray-600",
};

export function getEntityMeta(entity: string): EntityMeta {
  return ENTITY_META[entity] ?? { ...FALLBACK_META, label: entity };
}

export const ENTITY_TABS = [
  { label: "All", value: "all" },
  { label: "Auth", value: "Auth" },
  { label: "NAF", value: "NAF" },
  { label: "Resource Request", value: "ResourceRequest" },
  { label: "Approval Step", value: "ApprovalStep" },
  { label: "User", value: "User" },
  { label: "Resource", value: "Resource" },
] as const;

export type EntityTabValue = (typeof ENTITY_TABS)[number]["value"];
