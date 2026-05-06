import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  const displayed = showInactive ? [...active, ...inactive] : active;

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Resources</h1>
          <Button onClick={() => setAddDialogOpen(true)}>Add Resource</Button>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={(checked) => setShowInactive(checked === true)}
          />
          <Label htmlFor="show-inactive" className="text-sm">
            Show inactive resources
          </Label>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading resources...</p>
        ) : displayed.length === 0 ? (
          <p className="text-muted-foreground text-sm">No resources found.</p>
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

      <AddResourceDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </AdminLayout>
  );
}
