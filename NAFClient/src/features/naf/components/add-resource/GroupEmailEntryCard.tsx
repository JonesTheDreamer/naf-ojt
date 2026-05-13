import { useState, useRef, useEffect } from "react";
import { X, Mail, CalendarDays, ChevronDown, CheckCircle2, Plus } from "lucide-react";
import { FieldLabel } from "@/components/ui/field";
import { cn } from "@/shared/utils/utils";
import type { GroupEmailEntry } from "../../hooks/useAddResource";

interface GroupEmailEntryCardProps {
  entry: GroupEmailEntry;
  index: number;
  allGroupEmails: { id: number; email: string }[];
  onChange: (patch: Partial<GroupEmailEntry>) => void;
  onRemove: () => void;
}

export function GroupEmailEntryCard({ entry, index, allGroupEmails, onChange, onRemove }: GroupEmailEntryCardProps) {
  const [inputText, setInputText] = useState(entry.email);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = inputText.trim()
    ? allGroupEmails.filter((g) => g.email.toLowerCase().includes(inputText.toLowerCase()))
    : allGroupEmails;

  const exactMatch = allGroupEmails.find((g) => g.email.toLowerCase() === inputText.trim().toLowerCase());

  const handleInputChange = (text: string) => {
    setInputText(text);
    setIsOpen(true);
    const match = allGroupEmails.find((g) => g.email.toLowerCase() === text.trim().toLowerCase());
    if (text.trim()) {
      onChange({ email: text.trim(), isNew: !match });
    } else {
      onChange({ email: "", isNew: false });
    }
  };

  const handleSelect = (email: string) => {
    setInputText(email);
    setIsOpen(false);
    onChange({ email, isNew: false });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-violet-50 border-b border-violet-100">
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-violet-500" />
          <span className="text-xs font-bold text-violet-700 uppercase tracking-wide">Group Email #{index}</span>
          {entry.email && (
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              entry.isNew
                ? "bg-amber-100 border border-amber-200 text-amber-700"
                : "bg-blue-100 border border-blue-200 text-blue-700",
            )}>
              {entry.isNew ? "New" : "Existing"}
            </span>
          )}
        </div>
        <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors rounded p-0.5">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-4 py-3.5 space-y-3">
        <div className="space-y-1.5">
          <FieldLabel>Group Email <span className="text-red-400">*</span></FieldLabel>
          <div ref={containerRef} className="relative">
            <div className="relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setIsOpen(true)}
                placeholder="Type to filter or enter new email…"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors"
              />
              <ChevronDown
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none"
              />
            </div>
            {isOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                {filtered.length > 0 ? (
                  filtered.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); handleSelect(g.email); }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-violet-50 transition-colors flex items-center gap-2",
                        exactMatch?.id === g.id && "bg-violet-50 text-violet-700 font-medium",
                      )}
                    >
                      <Mail className="h-3 w-3 text-violet-400 shrink-0" />
                      {g.email}
                    </button>
                  ))
                ) : null}
                {inputText.trim() && !exactMatch && (
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setIsOpen(false); onChange({ email: inputText.trim(), isNew: true }); }}
                    className="w-full text-left px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 transition-colors flex items-center gap-2 border-t border-slate-100"
                  >
                    <Plus className="h-3 w-3 shrink-0" />
                    Create "<span className="font-medium">{inputText.trim()}</span>"
                  </button>
                )}
                {filtered.length === 0 && !inputText.trim() && (
                  <p className="px-3 py-2 text-xs text-slate-400">No group emails available</p>
                )}
              </div>
            )}
            {entry.email && !isOpen && (
              <p className={cn(
                "flex items-center gap-1 text-xs mt-1",
                entry.isNew ? "text-amber-600" : "text-emerald-600",
              )}>
                {entry.isNew
                  ? <><Plus className="h-3 w-3 shrink-0" /> New group email will be created.</>
                  : <><CheckCircle2 className="h-3 w-3 shrink-0" /> Existing group email selected.</>
                }
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Purpose of Access <span className="text-red-400">*</span></FieldLabel>
          <textarea
            placeholder="Why do you need access to this group email?"
            value={entry.purpose}
            onChange={(e) => onChange({ purpose: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm resize-none focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" /> Date Needed <span className="text-slate-400 font-normal">(optional)</span>
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
