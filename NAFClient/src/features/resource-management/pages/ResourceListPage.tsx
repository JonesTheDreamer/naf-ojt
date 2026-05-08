import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Layers, Zap, Archive, Box } from "lucide-react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useAdminResources } from "../hooks/useResourceManagement";
import { ResourceCard } from "../components/ResourceCard";
import { AddResourceDialog } from "../components/AddResourceDialog";

export default function ResourceListPage() {
  const [showInactive, setShowInactive] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { data: resources = [], isLoading } = useAdminResources();

  const active = resources.filter((r) => r.isActive);
  const inactive = resources.filter((r) => !r.isActive);
  const special = resources.filter((r) => r.isSpecial && r.isActive);
  const displayed = showInactive ? [...active, ...inactive] : active;

  return (
    <AdminLayout>
      <div className="min-h-full bg-background">
        {/* Page header */}
        <div className="border-b bg-card px-6 py-5">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Resource Registry</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage network access resources and their approval workflows
              </p>
            </div>
            <button
              onClick={() => setAddDialogOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Resource
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total", value: resources.length, icon: Box, color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
              { label: "Active", value: active.length, icon: Layers, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
              { label: "Special", value: special.length, icon: Zap, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
              { label: "Inactive", value: inactive.length, icon: Archive, color: "text-slate-400", bg: "bg-slate-50 border-slate-200" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${bg}`}>
                <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                <div>
                  <p className={`text-xl font-bold leading-none ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors
                ${showInactive
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-card text-muted-foreground border-border hover:border-slate-400"
                }`}
            >
              <Archive className="h-3.5 w-3.5" />
              {showInactive ? "Hiding inactive" : "Show inactive"}
            </button>
            <span className="text-xs text-muted-foreground">
              Showing {displayed.length} resource{displayed.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Resource grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl border bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Box className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No resources found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Add your first resource to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayed.map((r) => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  onClick={() => navigate(`/admin/resources/${r.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddResourceDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </AdminLayout>
  );
}
