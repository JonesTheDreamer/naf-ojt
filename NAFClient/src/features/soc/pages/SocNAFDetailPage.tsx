import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import SocLayout from "../components/SocLayout";
import { useNAF } from "@/features/naf/hooks/useNAF";
import { NAFDetailHeader } from "@/features/naf/components/NAFDetailHeader";
import { SocResourceRequestList } from "../components/SocResourceRequestList";
import { Button } from "@/components/ui/button";

export default function SocNAFDetailPage() {
  const { nafId } = useParams<{ nafId: string }>();
  const navigate = useNavigate();
  const { nafQuery, isLoading, isError } = useNAF({ nafId });
  const naf = nafQuery.data;

  return (
    <SocLayout>
      <div className="max-w-4xl mx-auto w-full space-y-5 pb-16 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate("/soc")}
        >
          <ChevronLeft className="h-4 w-4" /> Back to SOC Queue
        </Button>

        {isLoading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-28 bg-gray-100 rounded-xl" />
            <div className="h-40 bg-gray-100 rounded-xl" />
          </div>
        )}
        {isError && (
          <p className="text-center py-16 text-sm text-gray-400">
            Failed to load NAF details.
          </p>
        )}

        {naf && (
          <>
            <div className="rounded-xl border border-gray-100 bg-white px-6 py-5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                Network Access Form
              </span>
              <p className="text-2xl font-bold tracking-tight text-blue-600 font-mono mt-1">
                {naf.reference}
              </p>
            </div>

            <NAFDetailHeader naf={naf} />
            <SocResourceRequestList naf={naf} />
          </>
        )}
      </div>
    </SocLayout>
  );
}
