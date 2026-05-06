import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { useNAF } from "@/features/naf/hooks/useNAF";
import { NAFDetailHeader } from "@/features/naf/components/NAFDetailHeader";
import { AdminResourceRequestList } from "../components/AdminResourceRequestList";
import { RoutesEnum } from "@/app/routesEnum";
import { ProgressStatus } from "@/shared/types/api/naf";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";

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

const STATUS_STYLES: Record<number, { bg: string; text: string; dot: string }> =
  {
    0: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
    1: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
    2: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
    3: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-400" },
    4: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
    5: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
  };

function StatusPill({ progress }: { progress: number }) {
  const style = STATUS_STYLES[progress] ?? STATUS_STYLES[0];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${style.bg} ${style.text} border-current/20`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      {ProgressStatus[progress] ?? String(progress)}
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

export default function AdminNAFDetailPage() {
  const { nafId } = useParams<{ nafId: string }>();
  const navigate = useNavigate();
  const { nafQuery, isLoading, isError } = useNAF({ nafId });
  const naf = nafQuery.data;
  const { user } = useAuth();
  const currentUserId = user?.employeeId ?? "";
  const progressNum = naf?.progress as unknown as number;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto w-full space-y-5 pb-16 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate(RoutesEnum.ADMIN_NAF)}
        >
          <ChevronLeft className="h-4 w-4" /> Back to NAFs
        </Button>

        {isLoading && <LoadingSkeleton />}
        {isError && (
          <p className="text-center py-16 text-sm text-gray-400">
            Failed to load NAF details.
          </p>
        )}

        {naf && (
          <>
            {/* Document hero */}
            <div className="rounded-xl border border-gray-100 bg-white px-6 py-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                    Network Access Form
                  </span>
                  <p className="text-2xl font-bold tracking-tight text-amber-500 font-mono mt-1">
                    {naf.reference}
                  </p>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="text-xs text-gray-400">
                      Submitted{" "}
                      <span className="text-gray-600 font-medium">
                        {formatDate(naf.submittedAt)}
                      </span>
                    </span>
                    <span className="w-px h-3 bg-gray-200" />
                    <span className="text-xs text-gray-400">
                      Updated{" "}
                      <span className="text-gray-600 font-medium">
                        {formatDateTime(naf.updatedAt)}
                      </span>
                    </span>
                  </div>
                </div>
                <StatusPill progress={progressNum} />
              </div>
            </div>

            <NAFDetailHeader naf={naf} />
            <AdminResourceRequestList naf={naf} currentUser={currentUserId} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
