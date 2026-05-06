import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useAdminResourceDetail, useDeactivateResource } from "../hooks/useResourceManagement";
import { WorkflowTemplateVersions } from "../components/WorkflowTemplateVersions";
import { AddWorkflowTemplateDialog } from "../components/AddWorkflowTemplateDialog";
import { EmployeesByLocation } from "../components/EmployeesByLocation";

export default function ResourceDetailPage() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const id = Number(resourceId);
  const navigate = useNavigate();
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const { data: resource, isLoading } = useAdminResourceDetail(id);
  const { mutate: deactivate, isPending: deactivating } = useDeactivateResource();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!resource) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-muted-foreground text-sm">Resource not found.</p>
        </div>
      </AdminLayout>
    );
  }

  const activeVersion = resource.workflowVersions.find((v) => v.isActive)?.version ?? 0;

  const handleDeactivate = () => {
    if (!confirm(`Deactivate "${resource.name}"? In-flight requests will continue.`)) return;
    deactivate(id, { onSuccess: () => navigate("/admin/resources") });
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/resources")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div
              className="h-5 w-5 rounded-full shrink-0"
              style={{ backgroundColor: resource.color }}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-semibold">{resource.name}</h1>
                <Badge variant={resource.isSpecial ? "default" : "secondary"}>
                  {resource.isSpecial ? "Special" : "Basic"}
                </Badge>
                <Badge variant={resource.isActive ? "outline" : "secondary"}>
                  {resource.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {resource.resourceGroupName && (
                <p className="text-sm text-muted-foreground">{resource.resourceGroupName}</p>
              )}
            </div>
          </div>
          {resource.isActive && (
            <Button variant="destructive" onClick={handleDeactivate} disabled={deactivating}>
              {deactivating ? "Deactivating..." : "Deactivate"}
            </Button>
          )}
        </div>

        {/* Workflow Templates Section */}
        {resource.isSpecial && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Workflow Templates</h2>
              <Button size="sm" variant="outline" onClick={() => setTemplateDialogOpen(true)}>
                Add New Template
              </Button>
            </div>
            <WorkflowTemplateVersions versions={resource.workflowVersions} />
          </section>
        )}

        {/* Employees Section */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Employees with this Resource</h2>
          <EmployeesByLocation groups={resource.employeesByLocation} />
        </section>
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
