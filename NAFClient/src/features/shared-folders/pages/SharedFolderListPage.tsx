import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, PowerOff } from "lucide-react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { TablePagination } from "@/features/naf/components/tablePagination";
import { useSharedFolders } from "../hooks/useSharedFolders";
import { useSharedFolderMutations } from "../hooks/useSharedFolderMutations";
import { SharedFolderFormDialog } from "../components/SharedFolderFormDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SharedFolderDTO } from "../types";

export default function SharedFolderListPage() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<SharedFolderDTO | null>(null);
  const [deactivateError, setDeactivateError] = useState("");

  const { data, isLoading } = useSharedFolders(search, page);
  const { deleteMutation } = useSharedFolderMutations();

  const handleSearch = useCallback(() => {
    setSearch(inputValue);
    setPage(1);
  }, [inputValue]);

  const handleClearSearch = () => {
    setInputValue("");
    setSearch("");
    setPage(1);
  };

  const handleDeactivate = async (folder: SharedFolderDTO) => {
    setDeactivateError("");
    try {
      await deleteMutation.mutateAsync(folder.id);
      setConfirmDelete(null);
    } catch {
      setDeactivateError("Failed to deactivate. Please try again.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-500">Shared Folders</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage shared folders and their access.
            </p>
          </div>
          <SharedFolderFormDialog
            trigger={
              <Button size="sm">
                New Folder
              </Button>
            }
          />
        </div>

        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search folders…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors"
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="h-9 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
          >
            Search
          </button>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          {isLoading ? (
            <SharedFolderTableSkeleton />
          ) : !data || data.data.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              No shared folders found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Owner</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.data.map((folder) => (
                  <tr
                    key={folder.id}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() =>
                      navigate(`/admin/resources/shared-folders/${folder.id}`)
                    }
                  >
                    <td className="px-4 py-3 font-medium">{folder.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {folder.ownerName ?? <span className="italic text-muted-foreground/60">No owner</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        folder.isActive
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-gray-100 text-gray-500 border border-gray-200"
                      }`}>
                        {folder.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SharedFolderFormDialog
                          folder={folder}
                          trigger={
                            <button
                              type="button"
                              className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          }
                        />
                        <button
                          type="button"
                          className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Deactivate"
                          onClick={() => setConfirmDelete(folder)}
                        >
                          <PowerOff className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <TablePagination
            currentPage={data.currentPage}
            totalPages={data.totalPages}
            totalCount={data.totalCount}
            pageSize={data.pageSize}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Deactivate confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) { setConfirmDelete(null); setDeactivateError(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Deactivate folder?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deactivate <strong>{confirmDelete?.name}</strong>? Existing access requests will not be affected.
          </p>
          {deactivateError && <p className="text-sm text-red-500">{deactivateError}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => confirmDelete && handleDeactivate(confirmDelete)}
            >
              {deleteMutation.isPending ? "Deactivating…" : "Deactivate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function SharedFolderTableSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
          <div className="h-4 w-1/4 rounded bg-muted animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}
