import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { useCreateResourceGroup } from "../hooks/useResourceManagement";
import type { ResourceGroup } from "@/shared/types/api/naf";

interface CreateResourceGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (group: ResourceGroup) => void;
}

export function CreateResourceGroupDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateResourceGroupDialogProps) {
  const [name, setName] = useState("");
  const [canOwnMany, setCanOwnMany] = useState(false);
  const { mutate, isPending } = useCreateResourceGroup();

  const handleSubmit = () => {
    if (!name.trim()) return;
    mutate(
      { name: name.trim(), canOwnMany },
      {
        onSuccess: (group) => {
          onCreated(group);
          onOpenChange(false);
          setName("");
          setCanOwnMany(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Resource Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hardware"
            />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="can-own-many"
              checked={canOwnMany}
              onCheckedChange={(checked) => setCanOwnMany(checked === true)}
            />
            <Label htmlFor="can-own-many">Can own many resources of this group</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isPending}>
            {isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
