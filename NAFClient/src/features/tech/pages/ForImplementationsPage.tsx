import TechTeamLayout from "@/components/layout/TechTeamLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useForImplementations } from "../hooks/useForImplementations";

export default function ForImplementationsPage() {
  const { forImplementationsQuery, assignToMeMutation } = useForImplementations();

  return (
    <TechTeamLayout>
      <h1 className="text-2xl font-bold text-amber-500">For Implementations</h1>

      {forImplementationsQuery.isLoading && <p className="text-muted-foreground">Loading...</p>}
      {forImplementationsQuery.data?.length === 0 && (
        <p className="text-muted-foreground">No items for implementation.</p>
      )}

      <div className="space-y-3">
        {forImplementationsQuery.data?.map((item) => (
          <Card key={item.id}>
            <CardContent className="pt-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold">{item.resourceName}</p>
                <p className="text-sm text-muted-foreground">Progress: {item.progress}</p>
                {item.assignedTo ? (
                  <p className="text-sm text-muted-foreground">Assigned to: {item.assignedTo}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Unassigned</p>
                )}
              </div>
              {!item.assignedTo && (
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => assignToMeMutation.mutate(item.id)}
                  disabled={assignToMeMutation.isPending}
                >
                  Assign to Me
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </TechTeamLayout>
  );
}
