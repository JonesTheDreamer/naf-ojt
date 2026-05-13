import { useState, useRef, useEffect } from "react";
import { X, FolderOpen, CalendarDays, ChevronDown, Check } from "lucide-react";
import { FieldLabel } from "@/components/ui/field";
import { cn } from "@/shared/utils/utils";
import type { SharedFolderEntry } from "../../hooks/useAddResource";
import type { SharedFolderItem } from "@/shared/types/api/naf";

interface SharedFolderEntryCardProps {
  entry: SharedFolderEntry;
  index: number;
  allSharedFolders: SharedFolderItem[];
  onChange: (patch: Partial<SharedFolderEntry>) => void;
  onRemove: () => void;
}

export function SharedFolderEntryCard({
  entry,
  index,
  allSharedFolders,
  onChange,
  onRemove,
}: SharedFolderEntryCardProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = allSharedFolders.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (folder: SharedFolderItem) => {
    onChange({ folderId: folder.id, folderName: folder.name });
    setSearch("");
    setOpen(false);
  };

  const handleClear = () => {
    onChange({ folderId: null, folderName: "" });
    setSearch("");
  };

  const displayValue = entry.folderId !== null ? entry.folderName : search;

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 border-b border-emerald-100">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
            Shared Folder #{index}
          </span>
          {entry.folderId !== null && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700">
              Selected
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-red-500 transition-colors rounded p-0.5"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-4 py-3.5 space-y-3">
        <div className="space-y-1.5">
          <FieldLabel>
            Folder <span className="text-red-400">*</span>
          </FieldLabel>

          <div ref={containerRef} className="relative">
            {/* Trigger input */}
            <div className="relative">
              <input
                type="text"
                value={displayValue}
                placeholder="Search shared folders…"
                readOnly={entry.folderId !== null}
                onFocus={() => {
                  if (entry.folderId === null) setOpen(true);
                }}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setOpen(true);
                }}
                className={cn(
                  "h-9 w-full rounded-lg border bg-white pl-3 pr-16 text-sm transition-colors",
                  open
                    ? "border-emerald-400 outline-none ring-2 ring-emerald-400/20"
                    : "border-slate-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20",
                  entry.folderId !== null &&
                    "text-slate-700 font-medium cursor-default",
                )}
              />
              <div className="absolute inset-y-0 right-0 flex items-center gap-0.5 pr-2">
                {entry.folderId !== null && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-0.5 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (entry.folderId !== null) {
                      handleClear();
                      setOpen(true);
                    } else setOpen((v) => !v);
                  }}
                  className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Dropdown */}
            {open && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
                {filtered.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs text-slate-400">
                    No folders match "{search}"
                  </div>
                ) : (
                  <ul className="max-h-48 overflow-y-auto py-1">
                    {filtered.map((folder) => (
                      <li key={folder.id}>
                        <button
                          type="button"
                          onClick={() => handleSelect(folder)}
                          className={cn(
                            "flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                            entry.folderId === folder.id
                              ? "bg-emerald-50 text-emerald-700 font-medium"
                              : "text-slate-700 hover:bg-slate-50",
                          )}
                        >
                          <FolderOpen className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          <span className="flex-1 truncate">{folder.name}</span>
                          {entry.folderId === folder.id && (
                            <Check className="h-3.5 w-3.5 shrink-0" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <FieldLabel>
            Purpose of Access <span className="text-red-400">*</span>
          </FieldLabel>
          <textarea
            placeholder="Why do you need access to this folder?"
            value={entry.purpose}
            onChange={(e) => onChange({ purpose: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm resize-none focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" /> Date Needed{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </span>
          </FieldLabel>
          <input
            type="date"
            value={entry.dateNeeded}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => onChange({ dateNeeded: e.target.value })}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
