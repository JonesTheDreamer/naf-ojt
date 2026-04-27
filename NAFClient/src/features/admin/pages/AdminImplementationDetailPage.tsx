import { useParams, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useNAF } from "@/features/naf/hooks/useNAF";
import { useForImplementations } from "../hooks/useForImplementations";
import { useAuth } from "@/features/auth/AuthContext";
import { NAFDetailHeader } from "@/features/naf/components/NAFDetailHeader";
import { ImplementationResourceRequestList } from "../components/ImplementationResourceRequestList";
import { RoutesEnum } from "@/app/routesEnum";

export default function AdminImplementationDetailPage() {
  const { nafId } = useParams<{ nafId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const locationId = user?.locationId ?? null;

  const { nafQuery, isLoading, isError } = useNAF({ nafId });
  const naf = nafQuery.data;

  const {
    acceptMutation,
    setToInProgressMutation,
    setToDelayedMutation,
    setToAccomplishedMutation,
  } = useForImplementations(locationId);

  const isSubmitting =
    acceptMutation.isPending ||
    setToInProgressMutation.isPending ||
    setToDelayedMutation.isPending ||
    setToAccomplishedMutation.isPending;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto w-full space-y-6 pb-12 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate(RoutesEnum.ADMIN_FOR_IMPLEMENTATIONS)}
        >
          <ChevronLeft className="h-4 w-4" /> Back to Implementations
        </Button>

        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {isError && (
          <p className="text-sm text-muted-foreground">
            Failed to load NAF details.
          </p>
        )}

        {naf && (
          <>
            <Separator />
            <NAFDetailHeader naf={naf} />
            <ImplementationResourceRequestList
              requests={naf.resourceRequests}
              onAccept={(rrId) => acceptMutation.mutate(rrId)}
              onSetToInProgress={(implId) =>
                setToInProgressMutation.mutate(implId)
              }
              onSetToDelayed={(implId, reason) =>
                setToDelayedMutation.mutate({
                  implementationId: implId,
                  delayReason: reason,
                })
              }
              onSetToAccomplished={(implId) =>
                setToAccomplishedMutation.mutate(implId)
              }
              isSubmitting={isSubmitting}
            />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
