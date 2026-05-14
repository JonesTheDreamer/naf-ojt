import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RoutesEnum } from "@/app/routesEnum";
import { ArrowLeft } from "lucide-react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { TablePagination } from "@/features/naf/components/tablePagination";
import { useSharedFolder } from "../hooks/useSharedFolder";
import { SharedFolderFormDialog } from "../components/SharedFolderFormDialog";
import { SharedFolderAccessList } from "../components/SharedFolderAccessList";
import { Button } from "@/components/ui/button";

export default function SharedFolderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const folderId = Number(id);

  const [activeProgress, setActiveProgress] = useState("all");
  const [accessPage, setAccessPage] = useState(1);

  const { data, isLoading, isFetching } = useSharedFolder(folderId, activeProgress, accessPage);

  const handleProgressChange = (value: string) => {
    setActiveProgress(value);
    setAccessPage(1);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground">Loading…</p>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground">Folder not found.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(RoutesEnum.ADMIN_SHARED_FOLDERS)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Shared Folders
        </button>

        {/* Info card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-amber-500">{data.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Owner:{" "}
                {data.ownerName ? (
                  <span className="font-medium text-foreground">{data.ownerName}</span>
                ) : (
                  <span className="italic">No owner assigned</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                Active
              </span>
              <SharedFolderFormDialog
                folder={data}
                trigger={<Button variant="outline" size="sm">Edit</Button>}
              />
            </div>
          </div>
        </div>

        {/* Access list */}
        <SharedFolderAccessList
          entries={data.accessList.data}
          isLoading={isFetching}
          activeProgress={activeProgress}
          onProgressChange={handleProgressChange}
          totalCount={data.accessList.totalCount}
        />

        {data.accessList.totalPages > 1 && (
          <TablePagination
            currentPage={data.accessList.currentPage}
            totalPages={data.accessList.totalPages}
            totalCount={data.accessList.totalCount}
            pageSize={data.accessList.pageSize}
            onPageChange={setAccessPage}
          />
        )}
      </div>
    </AdminLayout>
  );
}
