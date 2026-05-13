import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OwnerSearchInput } from "./OwnerSearchInput";
import { useSharedFolderMutations } from "../hooks/useSharedFolderMutations";
import type { SharedFolderDTO } from "../types";

interface SharedFolderFormDialogProps {
  trigger: React.ReactNode;
  folder?: SharedFolderDTO;
  onSuccess?: () => void;
}

export function SharedFolderFormDialog({ trigger, folder, onSuccess }: SharedFolderFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [owner, setOwner] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState("");

  const { createMutation, updateMutation } = useSharedFolderMutations();
  const isEdit = !!folder;
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setName(folder?.name ?? "");
      setOwner(
        folder?.ownerId && folder?.ownerName
          ? { id: folder.ownerId, name: folder.ownerName }
          : null,
      );
      setError("");
    }
  }, [open, folder]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setError("");
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: folder!.id, dto: { name: name.trim(), ownerId: owner?.id ?? null } });
      } else {
        await createMutation.mutateAsync({ name: name.trim(), ownerId: owner?.id ?? null });
      }
      setOpen(false);
      onSuccess?.();
    } catch {
      setError("Failed to save. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Shared Folder" : "New Shared Folder"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Folder name"
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Owner <span className="text-muted-foreground font-normal">(optional)</span></label>
            <OwnerSearchInput value={owner} onChange={setOwner} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!name.trim() || isPending}
              onClick={handleSubmit}
            >
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
