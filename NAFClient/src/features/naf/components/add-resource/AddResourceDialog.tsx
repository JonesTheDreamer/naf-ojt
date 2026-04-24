import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { NAF, InternetRequestInfo, GroupEmailInfo, SharedFolderInfo } from "@/shared/types/api/naf";
import { Progress } from "@/shared/types/enum/progress";
import { useResource, useResourceMetadata } from "@/shared/hooks/useResource";
import {
  useAddResource,
  type InternetEntry,
  type GroupEmailEntry,
  type SharedFolderEntry,
  type BasicResourceWithDate,
} from "../../hooks/useAddResource";
import { BasicResourceSection } from "./BasicResourceSection";
import { InternetEntryCard } from "./InternetEntryCard";
import { GroupEmailEntryCard } from "./GroupEmailEntryCard";
import { SharedFolderEntryCard } from "./SharedFolderEntryCard";

interface AddResourceDialogProps {
  naf: NAF;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddResourceDialog({ naf, open, onOpenChange }: AddResourceDialogProps) {
  const [basicResources, setBasicResources] = useState<BasicResourceWithDate[]>([]);
  const [internetEntries, setInternetEntries] = useState<InternetEntry[]>([]);
  const [groupEmailEntries, setGroupEmailEntries] = useState<GroupEmailEntry[]>([]);
  const [sharedFolderEntries, setSharedFolderEntries] = useState<SharedFolderEntry[]>([]);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getAllResource } = useResource();
  const { internetPurposes, internetResources, groupEmails, sharedFolders } = useResourceMetadata();
  const { submit } = useAddResource();

  const existingResourceIds = naf.resourceRequests.map((rr) => rr.resource.id);

  const usedInternetResourceIds = naf.resourceRequests
    .filter((rr) => rr.additionalInfo?.type === 0 && rr.progress === Progress.ACCOMPLISHED)
    .map((rr) => (rr.additionalInfo as InternetRequestInfo).internetResourceId);

  const usedGroupEmailIds = naf.resourceRequests
    .filter((rr) => rr.additionalInfo?.type === 2 && rr.progress === Progress.ACCOMPLISHED)
    .map((rr) => (rr.additionalInfo as GroupEmailInfo).groupEmailId);

  const usedSharedFolderIds = naf.resourceRequests
    .filter((rr) => rr.additionalInfo?.type === 1 && rr.progress === Progress.ACCOMPLISHED)
    .map((rr) => (rr.additionalInfo as SharedFolderInfo).sharedFolderId);

  const availableBasic = (getAllResource.data ?? []).filter(
    (r) => !r.isSpecial && !existingResourceIds.includes(r.id),
  );

  const newEntry = () => crypto.randomUUID();

  const addInternetEntry = () =>
    setInternetEntries((prev) => [...prev, { _id: newEntry(), internetPurposeId: null, internetResourceId: null, purpose: "", dateNeeded: "", isOther: false, newPurposeName: "", newPurposeDescription: "", newResourceName: "", newResourceUrl: "", newResourceDescription: "" }]);

  const addGroupEmailEntry = () =>
    setGroupEmailEntries((prev) => [...prev, { _id: newEntry(), groupEmailId: null, purpose: "", dateNeeded: "" }]);

  const addSharedFolderEntry = () =>
    setSharedFolderEntries((prev) => [...prev, { _id: newEntry(), sharedFolderId: null, purpose: "", dateNeeded: "" }]);

  const patchInternetEntry = (_id: string, patch: Partial<InternetEntry>) =>
    setInternetEntries((prev) => prev.map((e) => (e._id === _id ? { ...e, ...patch } : e)));

  const patchGroupEmailEntry = (_id: string, patch: Partial<GroupEmailEntry>) =>
    setGroupEmailEntries((prev) => prev.map((e) => (e._id === _id ? { ...e, ...patch } : e)));

  const patchSharedFolderEntry = (_id: string, patch: Partial<SharedFolderEntry>) =>
    setSharedFolderEntries((prev) => prev.map((e) => (e._id === _id ? { ...e, ...patch } : e)));

  const isInternetEntryComplete = (e: InternetEntry) =>
    e.isOther
      ? e.newPurposeName.trim().length > 0 && e.newResourceName.trim().length > 0 && e.newResourceUrl.trim().length > 0 && e.purpose.trim().length > 0
      : e.internetResourceId !== null && e.purpose.trim().length > 0;

  const isGroupEmailEntryComplete = (e: GroupEmailEntry) => e.groupEmailId !== null && e.purpose.trim().length > 0;
  const isSharedFolderEntryComplete = (e: SharedFolderEntry) => e.sharedFolderId !== null && e.purpose.trim().length > 0;

  const hasAnything = basicResources.length > 0 || internetEntries.length > 0 || groupEmailEntries.length > 0 || sharedFolderEntries.length > 0;
  const allComplete = internetEntries.every(isInternetEntryComplete) && groupEmailEntries.every(isGroupEmailEntryComplete) && sharedFolderEntries.every(isSharedFolderEntryComplete);
  const canSubmit = hasAnything && allComplete && !isSubmitting;

  const reset = () => {
    setBasicResources([]);
    setInternetEntries([]);
    setGroupEmailEntries([]);
    setSharedFolderEntries([]);
    setSubmitErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitErrors([]);
    const result = await submit({ nafId: naf.id, basicResources, internetEntries, groupEmailEntries, sharedFolderEntries });
    setIsSubmitting(false);
    if (result.allSucceeded) { reset(); onOpenChange(false); }
    else { setSubmitErrors(result.errors); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="w-full max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-amber-600 font-bold">Add Resources</DialogTitle>
          <p className="text-xs text-muted-foreground">{naf.reference}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
          <BasicResourceSection availableBasic={availableBasic} basicResources={basicResources} onChange={setBasicResources} />

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-500">INTERNET ACCESS</p>
              <Button type="button" variant="outline" size="sm" onClick={addInternetEntry}>+ Add Entry</Button>
            </div>
            {internetEntries.length === 0 && <p className="text-xs text-muted-foreground italic">No entries yet</p>}
            {internetEntries.map((entry) => (
              <InternetEntryCard
                key={entry._id}
                entry={entry}
                allInternetResources={internetResources.data ?? []}
                allInternetPurposes={internetPurposes.data ?? []}
                usedInternetResourceIds={[...usedInternetResourceIds, ...internetEntries.filter((e) => e._id !== entry._id && e.internetResourceId !== null).map((e) => e.internetResourceId!)]}
                onChange={(patch) => patchInternetEntry(entry._id, patch)}
                onRemove={() => setInternetEntries((prev) => prev.filter((e) => e._id !== entry._id))}
              />
            ))}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-500">GROUP EMAIL</p>
              <Button type="button" variant="outline" size="sm" onClick={addGroupEmailEntry}>+ Add Entry</Button>
            </div>
            {groupEmailEntries.length === 0 && <p className="text-xs text-muted-foreground italic">No entries yet</p>}
            {groupEmailEntries.map((entry) => (
              <GroupEmailEntryCard
                key={entry._id}
                entry={entry}
                allGroupEmails={groupEmails.data ?? []}
                usedGroupEmailIds={[...usedGroupEmailIds, ...groupEmailEntries.filter((e) => e._id !== entry._id && e.groupEmailId !== null).map((e) => e.groupEmailId!)]}
                onChange={(patch) => patchGroupEmailEntry(entry._id, patch)}
                onRemove={() => setGroupEmailEntries((prev) => prev.filter((e) => e._id !== entry._id))}
              />
            ))}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-500">SHARED FOLDER</p>
              <Button type="button" variant="outline" size="sm" onClick={addSharedFolderEntry}>+ Add Entry</Button>
            </div>
            {sharedFolderEntries.length === 0 && <p className="text-xs text-muted-foreground italic">No entries yet</p>}
            {sharedFolderEntries.map((entry) => (
              <SharedFolderEntryCard
                key={entry._id}
                entry={entry}
                allSharedFolders={sharedFolders.data ?? []}
                usedSharedFolderIds={[...usedSharedFolderIds, ...sharedFolderEntries.filter((e) => e._id !== entry._id && e.sharedFolderId !== null).map((e) => e.sharedFolderId!)]}
                onChange={(patch) => patchSharedFolderEntry(entry._id, patch)}
                onRemove={() => setSharedFolderEntries((prev) => prev.filter((e) => e._id !== entry._id))}
              />
            ))}
          </section>

          {submitErrors.length > 0 && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 space-y-1">
              {submitErrors.map((err, i) => <p key={i} className="text-xs text-red-600">• {err}</p>)}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
            <Button type="submit" disabled={!canSubmit} className="bg-amber-500 hover:bg-amber-600 text-white">
              {isSubmitting ? "Adding..." : "Add Resources"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
