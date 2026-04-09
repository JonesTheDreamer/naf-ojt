import TechTeamLayout from "@/components/layout/TechTeamLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMyTasks } from "../hooks/useMyTasks";

function statusColor(status: string | null) {
  switch (status) {
    case "IN_PROGRESS": return "bg-blue-100 text-blue-700";
    case "DELAYED": return "bg-yellow-100 text-yellow-700";
    case "ACCOMPLISHED": return "bg-green-100 text-green-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

export default function MyTasksPage() {
  const { myTasksQuery, setToAccomplishedMutation } = useMyTasks();

  return (
    <TechTeamLayout>
      <h1 className="text-2xl font-bold text-amber-500">My Tasks</h1>

      {myTasksQuery.isLoading && <p className="text-muted-foreground">Loading...</p>}
      {myTasksQuery.data?.length === 0 && (
        <p className="text-muted-foreground">No tasks assigned to you.</p>
      )}

      <div className="space-y-3">
        {myTasksQuery.data?.map((item) => (
          <Card key={item.id}>
            <CardContent className="pt-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold">{item.resourceName}</p>
                <p className="text-sm text-muted-foreground">Progress: {item.progress}</p>
                {item.implementationStatus && (
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(item.implementationStatus)}`}>
                    {item.implementationStatus}
                  </span>
                )}
              </div>
              {item.implementationId && item.implementationStatus !== "ACCOMPLISHED" && (
                <Button
                  size="sm"
                  onClick={() => setToAccomplishedMutation.mutate(item.implementationId!)}
                  disabled={setToAccomplishedMutation.isPending}
                >
                  Mark Accomplished
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </TechTeamLayout>
  );
}
