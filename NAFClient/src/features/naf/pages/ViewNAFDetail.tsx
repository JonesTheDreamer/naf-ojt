import { useParams } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { ProgressStatus } from "@/shared/types/api/naf";
import RequestorLayout from "@/shared/components/layout/RequestorLayout";
import { useNAF } from "../hooks/useNAF";
import { useAuth } from "@/features/auth/AuthContext";
import { NAFDetailHeader } from "../components/NAFDetailHeader";
import { ResourceRequestList } from "../components/ResourceRequestList";

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function nafProgressLabel(progress: number): string {
  return ProgressStatus[progress as ProgressStatus] ?? String(progress);
}

function nafProgressColor(progress: number): string {
  switch (progress as ProgressStatus) {
    case ProgressStatus["In Progress"]:
      return "text-blue-600";
    case ProgressStatus.Accomplished:
      return "text-emerald-600";
    case ProgressStatus.Rejected:
      return "text-red-500";
    case ProgressStatus["For Screening"]:
      return "text-teal-600";
    default:
      return "text-amber-500";
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-5 w-64 bg-muted rounded" />
          <div className="h-3 w-40 bg-muted rounded" />
        </div>
        <div className="h-5 w-24 bg-muted rounded" />
      </div>
      <div className="h-px bg-muted" />
      <div className="h-48 bg-muted rounded-lg" />
      <div className="h-6 w-32 bg-muted rounded" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 bg-muted rounded-lg" />
      ))}
    </div>
  );
}

export default function NAFDetailPage() {
  const { nafId } = useParams<{ nafId: string }>();
  const { user } = useAuth();
  const currentUserId = user?.employeeId ?? "";

  const {
    nafQuery: naf,
    isLoading,
    isError,
    deactivateNAFAsync,
  } = useNAF({ nafId });
  console.log(naf.data);

  const handleDeactivateNAF = async () => {
    if (!nafId) return;
    try {
      await deactivateNAFAsync(nafId);
    } catch (error) {
      console.error("Failed to deactivate NAF:", error);
    }
  };

  return (
    <RequestorLayout>
      <div className="max-w-4xl mx-auto w-full space-y-6 pb-12 px-4 sm:px-6">
        {isLoading && <LoadingSkeleton />}
        {isError && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Failed to load NAF details. Please try again.
          </div>
        )}
        {!isLoading && !isError && !naf?.data && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            NAF not found.
          </div>
        )}

        {naf?.data && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-semibold text-foreground">
                    Reference:
                  </span>
                  <span className="text-base font-bold text-amber-500">
                    {naf.data.reference}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last Update: {formatDateTime(naf.data.updatedAt)}
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-0.5 shrink-0">
                <span className="text-xs text-muted-foreground">Status</span>
                <span
                  className={`text-sm font-bold ${nafProgressColor(naf.data.progress as unknown as number)}`}
                >
                  {nafProgressLabel(naf.data.progress as unknown as number)}
                </span>
              </div>
            </div>
            <Separator />
            <NAFDetailHeader
              naf={naf.data}
              onDeactivate={handleDeactivateNAF}
            />
            <ResourceRequestList naf={naf.data} currentUserId={currentUserId} />
          </>
        )}
      </div>
    </RequestorLayout>
  );
}
