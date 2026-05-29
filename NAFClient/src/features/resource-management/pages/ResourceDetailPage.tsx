import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, GitBranch, Users, Zap, Box, AlertTriangle } from "lucide-react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useAdminResourceDetail, useDeactivateResource } from "../hooks/useResourceManagement";
import { WorkflowTemplateVersions } from "../components/WorkflowTemplateVersions";
import { AddWorkflowTemplateDialog } from "../components/AddWorkflowTemplateDialog";
import { EmployeesByLocation } from "../components/EmployeesByLocation";
import { ResourceAllowanceSection } from "../components/ResourceAllowanceSection";

export default function ResourceDetailPage() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const id = Number(resourceId);
  const navigate = useNavigate();
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const { data: resource, isLoading } = useAdminResourceDetail(id);
  const { mutate: deactivate, isPending: deactivating } = useDeactivateResource();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-5xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-48 rounded-lg bg-muted" />
          <div className="h-24 rounded-xl bg-muted" />
          <div className="h-64 rounded-xl bg-muted" />
        </div>
      </AdminLayout>
    );
  }

  if (!resource) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm font-medium text-muted-foreground">Resource not found.</p>
          <button
            onClick={() => navigate("/admin/resources")}
            className="mt-3 text-xs text-amber-600 hover:underline"
          >
            ← Back to registry
          </button>
        </div>
      </AdminLayout>
    );
  }

  const activeVersion = resource.workflowVersions.find((v) => v.isActive)?.version ?? 0;
  const totalEmployees = resource.employeesByLocation.reduce((s, g) => s + g.employees.length, 0);

  const handleDeactivate = () => {
    deactivate(id, { onSuccess: () => navigate("/admin/resources") });
  };

  return (
    <AdminLayout>
      <div className="min-h-full bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="max-w-5xl mx-auto px-6 py-4">
            {/* Breadcrumb / back */}
            <button
              onClick={() => navigate("/admin/resources")}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Resource Registry
            </button>

            {/* Resource identity */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Color swatch */}
                <div
                  className="h-12 w-12 rounded-xl shrink-0 shadow-sm ring-1 ring-black/5"
                  style={{ backgroundColor: resource.color }}
                />
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl font-bold tracking-tight">{resource.name}</h1>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide
                        ${resource.isSpecial
                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                    >
                      {resource.isSpecial ? <Zap className="h-3 w-3" /> : <Box className="h-3 w-3" />}
                      {resource.isSpecial ? "Special" : "Basic"}
                    </span>
                    {!resource.isActive && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-slate-100 text-slate-400 border border-slate-200">
                        Inactive
                      </span>
                    )}
                  </div>
                  {resource.resourceGroupName && (
                    <p className="text-sm text-muted-foreground mt-0.5">{resource.resourceGroupName}</p>
                  )}
                </div>
              </div>

              {resource.isActive && (
                <div>
                  {confirmDeactivate ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-destructive font-medium">Confirm deactivation?</span>
                      <button
                        onClick={handleDeactivate}
                        disabled={deactivating}
                        className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-50"
                      >
                        {deactivating ? "Deactivating..." : "Yes, deactivate"}
                      </button>
                      <button
                        onClick={() => setConfirmDeactivate(false)}
                        className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeactivate(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs font-semibold hover:bg-destructive/5 transition-colors"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Deactivate
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick stats strip */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t">
              {resource.isSpecial && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <GitBranch className="h-3.5 w-3.5" />
                  <span>
                    {resource.workflowVersions.length} workflow version{resource.workflowVersions.length !== 1 ? "s" : ""}
                    {activeVersion > 0 && <span className="ml-1 font-semibold text-foreground">· v{activeVersion} active</span>}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>
                  <span className="font-semibold text-foreground">{totalEmployees}</span> active request{totalEmployees !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Two-column body */}
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
            {/* Left column: Workflow Templates (special only) + Request Lead Time */}
            <div className="space-y-6">
              {resource.isSpecial && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Workflow Templates</h2>
                    </div>
                    <button
                      onClick={() => setTemplateDialogOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-muted transition-colors"
                    >
                      <GitBranch className="h-3.5 w-3.5" />
                      New Version
                    </button>
                  </div>
                  <WorkflowTemplateVersions versions={resource.workflowVersions} />
                </section>
              )}
              <ResourceAllowanceSection resourceId={id} />
            </div>

            {/* Right column: Active Requests */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Active Requests
              </h2>
              <EmployeesByLocation groups={resource.employeesByLocation} />
            </section>
          </div>
        </div>
      </div>

      <AddWorkflowTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        resourceId={id}
        currentActiveVersion={activeVersion}
      />
    </AdminLayout>
  );
}
