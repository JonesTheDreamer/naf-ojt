import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import {
  Select as SelectPrimitive,
  Popover as PopoverPrimitive,
} from "radix-ui";
import { Command } from "cmdk";
import { X, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  NAF,
  InternetRequestInfo,
  GroupEmailInfo,
  SharedFolderInfo,
} from "@/types/api/naf";
import { Progress } from "@/types/enum/progress";
import {
  useResource,
  useResourceMetadata,
} from "@/features/resources/hooks/useResource";
import {
  useAddResource,
  type InternetEntry,
  type GroupEmailEntry,
  type SharedFolderEntry,
  type BasicResourceWithDate,
} from "../hooks/useAddResource";

// ── Searchable Combobox ────────────────────────────────────────────────────────

interface ComboboxOption {
  value: number;
  label: string;
}

function SearchableCombobox({
  options,
  value,
  onValueChange,
  placeholder,
  disabled,
}: {
  options: ComboboxOption[];
  value: number | null;
  onValueChange: (v: number) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between font-normal"
          disabled={disabled}
          type="button"
        >
          <span className={selected ? "" : "text-muted-foreground"}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-md border bg-popover p-1 shadow-md"
          sideOffset={4}
        >
          <Command>
            <div className="flex items-center border-b px-2 pb-1 mb-1">
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground py-1"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="px-2 py-3 text-sm text-muted-foreground text-center">
                  No results found
                </p>
              )}
              {filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent cursor-pointer",
                    value === o.value && "bg-accent",
                  )}
                  onClick={() => {
                    onValueChange(o.value);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "h-3.5 w-3.5",
                      value === o.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {o.label}
                </button>
              ))}
            </div>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

// ── Internet Entry Card ────────────────────────────────────────────────────────

const OTHER_SENTINEL = "__other__";

function InternetEntryCard({
  entry,
  allInternetResources,
  allInternetPurposes,
  usedInternetResourceIds,
  onChange,
  onRemove,
}: {
  entry: InternetEntry;
  allInternetResources: { id: number; name: string; purposeId: number }[];
  allInternetPurposes: { id: number; name: string }[];
  usedInternetResourceIds: number[];
  onChange: (patch: Partial<InternetEntry>) => void;
  onRemove: () => void;
}) {
  // Purposes that still have at least one non-used resource available
  const availablePurposeIds = Array.from(
    new Set(
      allInternetResources
        .filter((r) => !usedInternetResourceIds.includes(r.id))
        .map((r) => r.purposeId),
    ),
  );

  const resourcesForPurpose = allInternetResources.filter(
    (r) =>
      r.purposeId === entry.internetPurposeId &&
      !usedInternetResourceIds.includes(r.id),
  );

  const purposeSelectValue = entry.isOther
    ? OTHER_SENTINEL
    : (entry.internetPurposeId?.toString() ?? "");

  const handlePurposeChange = (v: string) => {
    if (v === OTHER_SENTINEL) {
      onChange({
        isOther: true,
        internetPurposeId: null,
        internetResourceId: null,
      });
    } else {
      onChange({
        isOther: false,
        internetPurposeId: Number(v),
        internetResourceId: null,
        newPurposeName: "",
        newPurposeDescription: "",
        newResourceName: "",
        newResourceUrl: "",
        newResourceDescription: "",
      });
    }
  };

  return (
    <div className="border rounded-md p-3 space-y-2 relative">
      <button
        type="button"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </button>

      {/* Purpose Category */}
      <div className="space-y-1">
        <FieldLabel>Purpose Category</FieldLabel>
        <SelectPrimitive.Root
          value={purposeSelectValue}
          onValueChange={handlePurposeChange}
        >
          <SelectPrimitive.Trigger className="flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <SelectPrimitive.Value placeholder="Select purpose category" />
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
              <SelectPrimitive.Viewport className="p-1">
                {availablePurposeIds.map((purposeId) => {
                  const purpose = allInternetPurposes.find(
                    (p) => p.id === purposeId,
                  );
                  return (
                    <SelectPrimitive.Item
                      key={purposeId}
                      value={purposeId.toString()}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                    >
                      <SelectPrimitive.ItemText>
                        {purpose?.name ?? `Purpose ${purposeId}`}
                      </SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  );
                })}
                <SelectPrimitive.Separator className="my-1 h-px bg-muted" />
                <SelectPrimitive.Item
                  value={OTHER_SENTINEL}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent italic text-muted-foreground"
                >
                  <SelectPrimitive.ItemText>
                    Other (add new)
                  </SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>

      {/* "Other" mode — form to create a new purpose + resource */}
      {entry.isOther ? (
        <div className="rounded-md border border-dashed border-amber-300 bg-amber-50/40 p-3 space-y-2">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
            New Purpose
          </p>
          <div className="space-y-1">
            <FieldLabel>
              Purpose Name <span className="text-red-500">*</span>
            </FieldLabel>
            <input
              type="text"
              placeholder="e.g. Research"
              value={entry.newPurposeName}
              onChange={(e) => onChange({ newPurposeName: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Purpose Description</FieldLabel>
            <input
              type="text"
              placeholder="Optional description"
              value={entry.newPurposeDescription}
              onChange={(e) =>
                onChange({ newPurposeDescription: e.target.value })
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            />
          </div>

          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide pt-1">
            New Internet Resource
          </p>
          <div className="space-y-1">
            <FieldLabel>
              Resource Name <span className="text-red-500">*</span>
            </FieldLabel>
            <input
              type="text"
              placeholder="e.g. GitHub"
              value={entry.newResourceName}
              onChange={(e) => onChange({ newResourceName: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>
              URL <span className="text-red-500">*</span>
            </FieldLabel>
            <input
              type="url"
              placeholder="https://..."
              value={entry.newResourceUrl}
              onChange={(e) => onChange({ newResourceUrl: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Resource Description</FieldLabel>
            <input
              type="text"
              placeholder="Optional description"
              value={entry.newResourceDescription}
              onChange={(e) =>
                onChange({ newResourceDescription: e.target.value })
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            />
          </div>
        </div>
      ) : (
        /* Normal mode — existing resource picker */
        <div className="space-y-1">
          <FieldLabel>Internet Resource</FieldLabel>
          <SearchableCombobox
            options={resourcesForPurpose.map((r) => ({
              value: r.id,
              label: r.name,
            }))}
            value={entry.internetResourceId}
            onValueChange={(v) => onChange({ internetResourceId: v })}
            placeholder="Select internet resource"
            disabled={entry.internetPurposeId === null}
          />
        </div>
      )}

      <div className="space-y-1">
        <FieldLabel>Purpose of Access</FieldLabel>
        <Textarea
          placeholder="Describe the purpose of access"
          value={entry.purpose}
          onChange={(e) => onChange({ purpose: e.target.value })}
          rows={2}
        />
      </div>

      <div className="space-y-1">
        <FieldLabel>Date Needed</FieldLabel>
        <input
          type="date"
          value={entry.dateNeeded}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => onChange({ dateNeeded: e.target.value })}
          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        />
      </div>
    </div>
  );
}

// ── Group Email Entry Card ────────────────────────────────────────────────────

function GroupEmailEntryCard({
  entry,
  allGroupEmails,
  usedGroupEmailIds,
  onChange,
  onRemove,
}: {
  entry: GroupEmailEntry;
  allGroupEmails: { id: number; email: string; departmentId: string }[];
  usedGroupEmailIds: number[];
  onChange: (patch: Partial<GroupEmailEntry>) => void;
  onRemove: () => void;
}) {
  const options = allGroupEmails
    .filter((g) => !usedGroupEmailIds.includes(g.id))
    .map((g) => ({
      value: g.id,
      label: `${g.email} — ${g.departmentId}`,
    }));

  return (
    <div className="border rounded-md p-3 space-y-2 relative">
      <button
        type="button"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="space-y-1">
        <FieldLabel>Group Email</FieldLabel>
        <SearchableCombobox
          options={options}
          value={entry.groupEmailId}
          onValueChange={(v) => onChange({ groupEmailId: v })}
          placeholder="Search group emails"
        />
      </div>

      <div className="space-y-1">
        <FieldLabel>Purpose of Access</FieldLabel>
        <Textarea
          placeholder="Describe the purpose of access"
          value={entry.purpose}
          onChange={(e) => onChange({ purpose: e.target.value })}
          rows={2}
        />
      </div>

      <div className="space-y-1">
        <FieldLabel>Date Needed</FieldLabel>
        <input
          type="date"
          value={entry.dateNeeded}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => onChange({ dateNeeded: e.target.value })}
          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        />
      </div>
    </div>
  );
}

// ── Shared Folder Entry Card ──────────────────────────────────────────────────

function SharedFolderEntryCard({
  entry,
  allSharedFolders,
  usedSharedFolderIds,
  onChange,
  onRemove,
}: {
  entry: SharedFolderEntry;
  allSharedFolders: {
    id: number;
    name: string;
    departmentId: string;
    remarks: string;
  }[];
  usedSharedFolderIds: number[];
  onChange: (patch: Partial<SharedFolderEntry>) => void;
  onRemove: () => void;
}) {
  const options = allSharedFolders
    .filter((f) => !usedSharedFolderIds.includes(f.id))
    .map((f) => ({
      value: f.id,
      label: `${f.name} — ${f.departmentId} — ${f.remarks}`,
    }));

  return (
    <div className="border rounded-md p-3 space-y-2 relative">
      <button
        type="button"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="space-y-1">
        <FieldLabel>Shared Folder</FieldLabel>
        <SearchableCombobox
          options={options}
          value={entry.sharedFolderId}
          onValueChange={(v) => onChange({ sharedFolderId: v })}
          placeholder="Search shared folders"
        />
      </div>

      <div className="space-y-1">
        <FieldLabel>Purpose of Access</FieldLabel>
        <Textarea
          placeholder="Describe the purpose of access"
          value={entry.purpose}
          onChange={(e) => onChange({ purpose: e.target.value })}
          rows={2}
        />
      </div>

      <div className="space-y-1">
        <FieldLabel>Date Needed</FieldLabel>
        <input
          type="date"
          value={entry.dateNeeded}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => onChange({ dateNeeded: e.target.value })}
          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        />
      </div>
    </div>
  );
}

// ── Main Dialog ───────────────────────────────────────────────────────────────

interface AddResourceDialogProps {
  naf: NAF;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddResourceDialog({
  naf,
  open,
  onOpenChange,
}: AddResourceDialogProps) {
  const [basicResources, setBasicResources] = useState<BasicResourceWithDate[]>(
    [],
  );
  const [internetEntries, setInternetEntries] = useState<InternetEntry[]>([]);
  const [groupEmailEntries, setGroupEmailEntries] = useState<GroupEmailEntry[]>(
    [],
  );
  const [sharedFolderEntries, setSharedFolderEntries] = useState<
    SharedFolderEntry[]
  >([]);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getAllResource } = useResource();
  const { internetPurposes, internetResources, groupEmails, sharedFolders } =
    useResourceMetadata();
  const { submit } = useAddResource();

  // IDs already requested in this NAF
  const existingResourceIds = naf.resourceRequests.map((rr) => rr.resource.id);

  const usedInternetResourceIds = naf.resourceRequests
    .filter(
      (rr) =>
        rr.additionalInfo?.type === 0 && rr.progress === Progress.ACCOMPLISHED,
    )
    .map((rr) => (rr.additionalInfo as InternetRequestInfo).internetResourceId);

  const usedGroupEmailIds = naf.resourceRequests
    .filter(
      (rr) =>
        rr.additionalInfo?.type === 2 && rr.progress === Progress.ACCOMPLISHED,
    )
    .map((rr) => (rr.additionalInfo as GroupEmailInfo).groupEmailId);

  const usedSharedFolderIds = naf.resourceRequests
    .filter(
      (rr) =>
        rr.additionalInfo?.type === 1 && rr.progress === Progress.ACCOMPLISHED,
    )
    .map((rr) => (rr.additionalInfo as SharedFolderInfo).sharedFolderId);

  const availableBasic = (getAllResource.data ?? []).filter(
    (r) => !r.isSpecial && !existingResourceIds.includes(r.id),
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
      { _id: newEntry(), groupEmailId: null, purpose: "", dateNeeded: "" },
    ]);

  const addSharedFolderEntry = () =>
    setSharedFolderEntries((prev) => [
      ...prev,
      { _id: newEntry(), sharedFolderId: null, purpose: "", dateNeeded: "" },
    ]);

  const patchInternetEntry = (_id: string, patch: Partial<InternetEntry>) =>
    setInternetEntries((prev) =>
      prev.map((e) => (e._id === _id ? { ...e, ...patch } : e)),
    );

  const patchGroupEmailEntry = (_id: string, patch: Partial<GroupEmailEntry>) =>
    setGroupEmailEntries((prev) =>
      prev.map((e) => (e._id === _id ? { ...e, ...patch } : e)),
    );

  const patchSharedFolderEntry = (
    _id: string,
    patch: Partial<SharedFolderEntry>,
  ) =>
    setSharedFolderEntries((prev) =>
      prev.map((e) => (e._id === _id ? { ...e, ...patch } : e)),
    );

  const isInternetEntryComplete = (e: InternetEntry) => {
    if (e.isOther) {
      return (
        e.newPurposeName.trim().length > 0 &&
        e.newResourceName.trim().length > 0 &&
        e.newResourceUrl.trim().length > 0 &&
        e.purpose.trim().length > 0
      );
    }
    return e.internetResourceId !== null && e.purpose.trim().length > 0;
  };

  const isGroupEmailEntryComplete = (e: GroupEmailEntry) =>
    e.groupEmailId !== null && e.purpose.trim().length > 0;

  const isSharedFolderEntryComplete = (e: SharedFolderEntry) =>
    e.sharedFolderId !== null && e.purpose.trim().length > 0;

  const hasAnything =
    basicResources.length > 0 ||
    internetEntries.length > 0 ||
    groupEmailEntries.length > 0 ||
    sharedFolderEntries.length > 0;

  const allComplete =
    internetEntries.every(isInternetEntryComplete) &&
    groupEmailEntries.every(isGroupEmailEntryComplete) &&
    sharedFolderEntries.every(isSharedFolderEntryComplete);

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
    console.log(basicResources);
    console.log("internet entries", internetEntries);
    const result = await submit({
      nafId: naf.id,
      basicResources,
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

  console.log(getAllResource.data);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="w-full max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-amber-600 font-bold">
            Add Resources
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{naf.reference}</p>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1"
        >
          {/* Basic Resources */}
          {availableBasic.length > 0 && (
            <section className="space-y-2">
              <p className="text-sm font-semibold text-amber-500">
                BASIC RESOURCES
              </p>
              <div className="flex flex-col gap-2">
                {availableBasic.map((r) => {
                  const entry = basicResources.find((b) => b.id === r.id);
                  const isChecked = !!entry;
                  return (
                    <div
                      key={r.id}
                      className="border rounded-md p-2 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`basic-${r.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setBasicResources((prev) => [
                                ...prev,
                                { id: r.id, dateNeeded: "" },
                              ]);
                            } else {
                              setBasicResources((prev) =>
                                prev.filter((b) => b.id !== r.id),
                              );
                            }
                          }}
                        />
                        <FieldLabel htmlFor={`basic-${r.id}`}>
                          {r.name}
                        </FieldLabel>
                      </div>
                      {isChecked && (
                        <input
                          type="date"
                          value={entry!.dateNeeded}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) =>
                            setBasicResources((prev) =>
                              prev.map((b) =>
                                b.id === r.id
                                  ? { ...b, dateNeeded: e.target.value }
                                  : b,
                              ),
                            )
                          }
                          className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Internet Access */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-500">
                INTERNET ACCESS
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addInternetEntry}
              >
                + Add Entry
              </Button>
            </div>
            {internetEntries.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No entries yet
              </p>
            )}
            {internetEntries.map((entry) => (
              <InternetEntryCard
                key={entry._id}
                entry={entry}
                allInternetResources={internetResources.data ?? []}
                allInternetPurposes={internetPurposes.data ?? []}
                usedInternetResourceIds={[
                  ...usedInternetResourceIds,
                  ...internetEntries
                    .filter(
                      (e) =>
                        e._id !== entry._id && e.internetResourceId !== null,
                    )
                    .map((e) => e.internetResourceId!),
                ]}
                onChange={(patch) => patchInternetEntry(entry._id, patch)}
                onRemove={() =>
                  setInternetEntries((prev) =>
                    prev.filter((e) => e._id !== entry._id),
                  )
                }
              />
            ))}
          </section>

          {/* Group Email */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-500">
                GROUP EMAIL
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGroupEmailEntry}
              >
                + Add Entry
              </Button>
            </div>
            {groupEmailEntries.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No entries yet
              </p>
            )}
            {groupEmailEntries.map((entry) => (
              <GroupEmailEntryCard
                key={entry._id}
                entry={entry}
                allGroupEmails={groupEmails.data ?? []}
                usedGroupEmailIds={[
                  ...usedGroupEmailIds,
                  ...groupEmailEntries
                    .filter(
                      (e) => e._id !== entry._id && e.groupEmailId !== null,
                    )
                    .map((e) => e.groupEmailId!),
                ]}
                onChange={(patch) => patchGroupEmailEntry(entry._id, patch)}
                onRemove={() =>
                  setGroupEmailEntries((prev) =>
                    prev.filter((e) => e._id !== entry._id),
                  )
                }
              />
            ))}
          </section>

          {/* Shared Folder */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-500">
                SHARED FOLDER
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSharedFolderEntry}
              >
                + Add Entry
              </Button>
            </div>
            {sharedFolderEntries.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No entries yet
              </p>
            )}
            {sharedFolderEntries.map((entry) => (
              <SharedFolderEntryCard
                key={entry._id}
                entry={entry}
                allSharedFolders={sharedFolders.data ?? []}
                usedSharedFolderIds={[
                  ...usedSharedFolderIds,
                  ...sharedFolderEntries
                    .filter(
                      (e) => e._id !== entry._id && e.sharedFolderId !== null,
                    )
                    .map((e) => e.sharedFolderId!),
                ]}
                onChange={(patch) => patchSharedFolderEntry(entry._id, patch)}
                onRemove={() =>
                  setSharedFolderEntries((prev) =>
                    prev.filter((e) => e._id !== entry._id),
                  )
                }
              />
            ))}
          </section>

          {/* Errors */}
          {submitErrors.length > 0 && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 space-y-1">
              {submitErrors.map((err, i) => (
                <p key={i} className="text-xs text-red-600">
                  • {err}
                </p>
              ))}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isSubmitting ? "Adding..." : "Add Resources"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
