import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProgressStatus } from "@/shared/types/api/naf";
import RequestorLayout from "@/shared/components/layout/RequestorLayout";
import { useNAF } from "../hooks/useNAF";
import { useAuth } from "@/features/auth/AuthContext";
import { NAFDetailHeader } from "../components/NAFDetailHeader";
import { ResourceRequestList } from "../components/ResourceRequestList";
import { DeactivateConfirmDialog } from "../components/deactivateConfirmDialog";
import { Button } from "@/components/ui/button";
import { RoutesEnum } from "@/app/routesEnum";
import { ChevronLeft } from "lucide-react";

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
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

const STATUS_STYLES: Record<number, { bg: string; text: string; dot: string }> =
  {
    0: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" }, // Open
    1: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" }, // In Progress
    2: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" }, // Rejected
    3: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-400" }, // For Screening
    4: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" }, // Accomplished
    5: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" }, // Not Accomplished
  };

function StatusPill({ progress }: { progress: number }) {
  const style = STATUS_STYLES[progress] ?? STATUS_STYLES[0];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${style.bg} ${style.text} border-current/20`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      {nafProgressLabel(progress)}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 bg-gray-100 rounded-xl" />
      <div className="h-40 bg-gray-100 rounded-xl" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function NAFDetailPage() {
  const { nafId } = useParams<{ nafId: string }>();
  const { user } = useAuth();
  const currentUserId = user?.employeeId ?? "";
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    nafQuery: naf,
    isLoading,
    isError,
    deactivateNAFAsync,
    isDeactivating,
  } = useNAF({ nafId });

  const handleDeactivateNAF = async () => {
    if (!nafId) return;
    try {
      await deactivateNAFAsync(nafId);
      setConfirmOpen(false);
    } catch (error) {
      console.error("Failed to deactivate NAF:", error);
    }
  };

  const navigate = useNavigate();

  const progressNum = naf.data?.progress as unknown as number;

  return (
    <RequestorLayout>
      <div className="max-w-4xl mx-auto w-full space-y-5 pb-16 px-4 sm:px-6">
        {isLoading && <LoadingSkeleton />}

        {isError && (
          <div className="text-center py-16 text-gray-400 text-sm">
            Failed to load NAF details. Please try again.
          </div>
        )}

        {!isLoading && !isError && !naf?.data && (
          <div className="text-center py-16 text-gray-400 text-sm">
            NAF not found.
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate(RoutesEnum.NAF)}
        >
          <ChevronLeft className="h-4 w-4" /> Back to NAFs
        </Button>

        {naf?.data && (
          <>
            {/* ── Document hero ─────────────────────────────────────── */}
            <div className="rounded-xl border border-gray-100 bg-white px-6 py-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                      Network Access Form
                    </span>
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-amber-500 font-mono">
                    {naf.data.reference}
                  </p>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="text-xs text-gray-400">
                      Submitted{" "}
                      <span className="text-gray-600 font-medium">
                        {formatDate(naf.data.submittedAt)}
                      </span>
                    </span>
                    <span className="w-px h-3 bg-gray-200" />
                    <span className="text-xs text-gray-400">
                      Updated{" "}
                      <span className="text-gray-600 font-medium">
                        {formatDateTime(naf.data.updatedAt)}
                      </span>
                    </span>
                  </div>
                </div>
                <StatusPill progress={progressNum} />
              </div>
            </div>

            {/* ── Employee + NAF detail ─────────────────────────────── */}
            <NAFDetailHeader
              naf={naf.data}
              onDeactivate={() => setConfirmOpen(true)}
            />
            <DeactivateConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              resourceName={naf.data.reference}
              description={`Deactivating ${naf.data.reference} will also deactivate all active resource requests under this NAF. This cannot be undone without manually reactivating each request.`}
              onConfirm={handleDeactivateNAF}
              isSubmitting={isDeactivating}
            />

            {/* ── Resource requests ─────────────────────────────────── */}
            <ResourceRequestList naf={naf.data} currentUserId={currentUserId} />
          </>
        )}
      </div>
    </RequestorLayout>
  );
}
