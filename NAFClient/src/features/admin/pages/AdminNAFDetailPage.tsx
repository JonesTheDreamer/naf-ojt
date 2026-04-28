import { useParams, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useNAF } from "@/features/naf/hooks/useNAF";
import { NAFDetailHeader } from "@/features/naf/components/NAFDetailHeader";
import { AdminResourceRequestList } from "../components/AdminResourceRequestList";
import { RoutesEnum } from "@/app/routesEnum";
import { ProgressStatus } from "@/shared/types/api/naf";
import { useAuth } from "@/features/auth";

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

function nafProgressColor(progress: number): string {
  switch (progress as ProgressStatus) {
    case ProgressStatus["In Progress"]:
      return "text-blue-600";
    case ProgressStatus.Accomplished:
      return "text-emerald-600";
    case ProgressStatus.Rejected:
      return "text-red-500";
    default:
      return "text-amber-500";
  }
}

export default function AdminNAFDetailPage() {
  const { nafId } = useParams<{ nafId: string }>();
  const navigate = useNavigate();
  const { nafQuery, isLoading, isError } = useNAF({ nafId });
  const naf = nafQuery.data;
  const { user } = useAuth();
  const currentUserId = user?.employeeId ?? "";

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto w-full space-y-6 pb-12 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate(RoutesEnum.ADMIN_NAF)}
        >
          <ChevronLeft className="h-4 w-4" /> Back to NAFs
        </Button>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}
        {isError && (
          <p className="text-sm text-muted-foreground">
            Failed to load NAF details.
          </p>
        )}

        {naf && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-semibold text-foreground">
                    Reference:
                  </span>
                  <span className="text-base font-bold text-amber-500">
                    {naf.reference}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last Update: {formatDateTime(naf.updatedAt)}
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-0.5 shrink-0">
                <span className="text-xs text-muted-foreground">Status</span>
                <span
                  className={`text-sm font-bold ${nafProgressColor(naf.progress as unknown as number)}`}
                >
                  {ProgressStatus[naf.progress as unknown as number]}
                </span>
              </div>
            </div>
            <Separator />
            <NAFDetailHeader naf={naf} />
            <AdminResourceRequestList
              naf={naf}
              currentUser={currentUserId}
            />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
