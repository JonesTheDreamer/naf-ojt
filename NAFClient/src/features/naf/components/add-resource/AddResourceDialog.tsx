import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Globe,
  Mail,
  FolderOpen,
  Settings2,
  Zap,
  Plus,
  CheckCircle2,
} from "lucide-react";
import type { NAF, InternetRequestInfo } from "@/shared/types/api/naf";
import { Progress } from "@/shared/types/enum/progress";
import { useResource, useResourceMetadata } from "@/shared/hooks/useResource";
import {
  useAddResource,
  DEDICATED_SPECIAL_IDS,
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

type TabId = "basic" | "special" | "internet" | "email" | "folder";

const TAB_META: Record<
  TabId,
  { label: string; icon: typeof Globe; color: string }
> = {
  basic: { label: "Basic", icon: Settings2, color: "text-slate-600" },
  special: { label: "Special", icon: Zap, color: "text-amber-600" },
  internet: { label: "Internet", icon: Globe, color: "text-sky-600" },
  email: { label: "Email", icon: Mail, color: "text-violet-600" },
  folder: { label: "Folder", icon: FolderOpen, color: "text-emerald-600" },
};

export function AddResourceDialog({
  naf,
  open,
  onOpenChange,
}: AddResourceDialogProps) {
  const [basicResources, setBasicResources] = useState<BasicResourceWithDate[]>(
    [],
  );
  const [specialResources, setSpecialResources] = useState<
    BasicResourceWithDate[]
  >([]);
  const [internetEntries, setInternetEntries] = useState<InternetEntry[]>([]);
  const [groupEmailEntries, setGroupEmailEntries] = useState<GroupEmailEntry[]>(
    [],
  );
  const [sharedFolderEntries, setSharedFolderEntries] = useState<
    SharedFolderEntry[]
  >([]);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("internet");

  const { getAllResource, resourceGroups } = useResource();
  const { internetPurposes, internetResources, groupEmails, sharedFolders } =
    useResourceMetadata();

  const { submit } = useAddResource();

  const existingResourceIds = naf.resourceRequests
    .filter((rr) => rr.progress !== Progress.CANCELLED && !rr.cancelledAt)
    .map((rr) => rr.resource.id);

  const usedInternetResourceIds = naf.resourceRequests
    .filter(
      (rr) =>
        rr.additionalInfo?.type === 0 && rr.progress === Progress.ACCOMPLISHED,
    )
    .map((rr) => (rr.additionalInfo as InternetRequestInfo).internetResourceId);

  const blockedByGroup = new Set<number>();
  for (const group of resourceGroups.data ?? []) {
    if (group.canOwnMany) continue;
    if (group.resources.some((r) => existingResourceIds.includes(r.id))) {
      group.resources.forEach((r) => blockedByGroup.add(r.id));
    }
  }

  const availableBasic = (getAllResource.data ?? []).filter(
    (r) =>
      !r.isSpecial &&
      !existingResourceIds.includes(r.id) &&
      !blockedByGroup.has(r.id),
  );
  const availableSpecial = (getAllResource.data ?? []).filter(
    (r) =>
      r.isSpecial &&
      !DEDICATED_SPECIAL_IDS.includes(r.id) &&
      !existingResourceIds.includes(r.id) &&
      !blockedByGroup.has(r.id),
  );

  const newEntry = () => crypto.randomUUID();

  const addInternetEntry = () =>
    setInternetEntries((prev) => [
      ...prev,
      {
        _id: newEntry(),
        internetPurposeId: null,
        internetResourceId: null,
        purpose: "",
        dateNeeded: "",
        isOther: false,
        newPurposeName: "",
        newPurposeDescription: "",
        newResourceName: "",
        newResourceUrl: "",
        newResourceDescription: "",
      },
    ]);

  const addGroupEmailEntry = () =>
    setGroupEmailEntries((prev) => [
      ...prev,
      { _id: newEntry(), email: "", isNew: false, purpose: "", dateNeeded: "" },
    ]);

  const addSharedFolderEntry = () =>
    setSharedFolderEntries((prev) => [
      ...prev,
      {
        _id: newEntry(),
        folderId: null,
        folderName: "",
        purpose: "",
        dateNeeded: "",
      },
    ]);

  const patchInternetEntry = (_id: string, patch: Partial<InternetEntry>) =>
    setInternetEntries((p) =>
      p.map((e) => (e._id === _id ? { ...e, ...patch } : e)),
    );
  const patchGroupEmailEntry = (_id: string, patch: Partial<GroupEmailEntry>) =>
    setGroupEmailEntries((p) =>
      p.map((e) => (e._id === _id ? { ...e, ...patch } : e)),
    );
  const patchSharedFolderEntry = (
    _id: string,
    patch: Partial<SharedFolderEntry>,
  ) =>
    setSharedFolderEntries((p) =>
      p.map((e) => (e._id === _id ? { ...e, ...patch } : e)),
    );

  const isInternetEntryComplete = (e: InternetEntry) =>
    e.isOther
      ? e.newPurposeName.trim().length > 0 &&
        e.newResourceName.trim().length > 0 &&
        e.newResourceUrl.trim().length > 0 &&
        e.purpose.trim().length > 0
      : e.internetResourceId !== null && e.purpose.trim().length > 0;

  const isGroupEmailEntryComplete = (e: GroupEmailEntry) =>
    e.email.trim().length > 0 && e.purpose.trim().length > 0;
  const isSharedFolderEntryComplete = (e: SharedFolderEntry) =>
    e.folderId !== null && e.purpose.trim().length > 0;

  const allSpecialHavePurpose = specialResources.every(
    (r) => (r.purpose ?? "").trim().length > 0,
  );
  const hasAnything =
    basicResources.length > 0 ||
    specialResources.length > 0 ||
    internetEntries.length > 0 ||
    groupEmailEntries.length > 0 ||
    sharedFolderEntries.length > 0;
  const allComplete =
    allSpecialHavePurpose &&
    internetEntries.every(isInternetEntryComplete) &&
    groupEmailEntries.every(isGroupEmailEntryComplete) &&
    sharedFolderEntries.every(isSharedFolderEntryComplete);
  const canSubmit = hasAnything && allComplete && !isSubmitting;

  const reset = () => {
    setBasicResources([]);
    setSpecialResources([]);
    setInternetEntries([]);
    setGroupEmailEntries([]);
    setSharedFolderEntries([]);
    setSubmitErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitErrors([]);
    const result = await submit({
      nafId: naf.id,
      basicResources,
      specialResources,
      internetEntries,
      groupEmailEntries,
      sharedFolderEntries,
    });
    setIsSubmitting(false);
    if (result.allSucceeded) {
      reset();
      onOpenChange(false);
    } else {
      setSubmitErrors(result.errors);
    }
  };

  // Tab counts
  const counts: Record<TabId, number> = {
    basic: basicResources.length,
    special: specialResources.length,
    internet: internetEntries.length,
    email: groupEmailEntries.length,
    folder: sharedFolderEntries.length,
  };

  // Only show tabs that are relevant
  const visibleTabs: TabId[] = [
    ...(availableBasic.length > 0 ? ["basic"] : ([] as TabId[])),
    ...(availableSpecial.length > 0 ? ["special"] : ([] as TabId[])),
    "internet",
    "email",
    "folder",
  ] as TabId[];

  const totalSelected =
    counts.basic +
    counts.special +
    counts.internet +
    counts.email +
    counts.folder;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="w-full max-w-xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-white border-b px-5 pt-5 pb-0">
          <div className="mb-4 pr-8">
            <h2 className="text-slate-900 font-bold text-lg leading-tight">
              Add Resources
            </h2>
            <p className="text-slate-400 text-xs mt-0.5 font-mono">
              {naf.reference}
            </p>
          </div>

          {/* Tab bar */}
          <div className="flex flex-wrap gap-1">
            {visibleTabs.map((id) => {
              const { label, icon: Icon, color } = TAB_META[id];
              const count = counts[id];
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg transition-all
                    ${
                      isActive
                        ? "bg-slate-50 text-slate-900 border border-b-0 border-slate-200 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? color : ""}`} />
                  {label}
                  {count > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[1.1rem] h-4 px-1 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden bg-slate-50/60"
        >
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {activeTab === "basic" && (
              <BasicResourceSection
                availableBasic={availableBasic}
                basicResources={basicResources}
                onChange={setBasicResources}
                locationId={naf.locationId ?? undefined}
              />
            )}

            {activeTab === "special" && (
              <BasicResourceSection
                availableBasic={availableSpecial}
                basicResources={specialResources}
                onChange={setSpecialResources}
                requiresPurpose
                locationId={naf.locationId ?? undefined}
              />
            )}

            {activeTab === "internet" && (
              <div className="space-y-3">
                {internetEntries.length === 0 ? (
                  <EmptyTabState
                    icon={Globe}
                    label="No internet access entries yet"
                    action="Add Entry"
                    onAdd={addInternetEntry}
                  />
                ) : (
                  <>
                    {internetEntries.map((entry, i) => (
                      <InternetEntryCard
                        key={entry._id}
                        entry={entry}
                        index={i + 1}
                        allInternetResources={internetResources.data ?? []}
                        allInternetPurposes={internetPurposes.data ?? []}
                        usedInternetResourceIds={[
                          ...usedInternetResourceIds,
                          ...internetEntries
                            .filter(
                              (e) =>
                                e._id !== entry._id &&
                                e.internetResourceId !== null,
                            )
                            .map((e) => e.internetResourceId!),
                        ]}
                        onChange={(patch) =>
                          patchInternetEntry(entry._id, patch)
                        }
                        onRemove={() =>
                          setInternetEntries((prev) =>
                            prev.filter((e) => e._id !== entry._id),
                          )
                        }
                      />
                    ))}
                    <AddEntryButton
                      onClick={addInternetEntry}
                      label="Add another entry"
                    />
                  </>
                )}
              </div>
            )}

            {activeTab === "email" && (
              <div className="space-y-3">
                {groupEmailEntries.length === 0 ? (
                  <EmptyTabState
                    icon={Mail}
                    label="No group email entries yet"
                    action="Add Entry"
                    onAdd={addGroupEmailEntry}
                  />
                ) : (
                  <>
                    {groupEmailEntries.map((entry, i) => (
                      <GroupEmailEntryCard
                        key={entry._id}
                        entry={entry}
                        index={i + 1}
                        allGroupEmails={groupEmails.data ?? []}
                        onChange={(patch) =>
                          patchGroupEmailEntry(entry._id, patch)
                        }
                        onRemove={() =>
                          setGroupEmailEntries((prev) =>
                            prev.filter((e) => e._id !== entry._id),
                          )
                        }
                      />
                    ))}
                    <AddEntryButton
                      onClick={addGroupEmailEntry}
                      label="Add another entry"
                    />
                  </>
                )}
              </div>
            )}

            {activeTab === "folder" && (
              <div className="space-y-3">
                {sharedFolderEntries.length === 0 ? (
                  <EmptyTabState
                    icon={FolderOpen}
                    label="No shared folder entries yet"
                    action="Add Entry"
                    onAdd={addSharedFolderEntry}
                  />
                ) : (
                  <>
                    {sharedFolderEntries.map((entry, i) => (
                      <SharedFolderEntryCard
                        key={entry._id}
                        entry={entry}
                        index={i + 1}
                        allSharedFolders={sharedFolders.data ?? []}
                        onChange={(patch) =>
                          patchSharedFolderEntry(entry._id, patch)
                        }
                        onRemove={() =>
                          setSharedFolderEntries((prev) =>
                            prev.filter((e) => e._id !== entry._id),
                          )
                        }
                      />
                    ))}
                    <AddEntryButton
                      onClick={addSharedFolderEntry}
                      label="Add another entry"
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-white px-5 py-3 space-y-3">
            {submitErrors.length > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 space-y-0.5">
                {submitErrors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600">
                    • {err}
                  </p>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {totalSelected > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>
                      <span className="font-semibold text-slate-700">
                        {totalSelected}
                      </span>{" "}
                      resource{totalSelected !== 1 ? "s" : ""} selected
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    onOpenChange(false);
                  }}
                  className="px-4 py-2 rounded-lg border text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    "Add Resources"
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmptyTabState({
  icon: Icon,
  label,
  action,
  onAdd,
}: {
  icon: typeof Globe;
  label: string;
  action: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-sm text-slate-500 font-medium mb-4">{label}</p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors shadow-sm"
      >
        <Plus className="h-4 w-4" />
        {action}
      </button>
    </div>
  );
}

function AddEntryButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-600 text-xs font-semibold transition-colors"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
