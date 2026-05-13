import { useState, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";
import { api } from "@/shared/api/client";

interface EmployeeSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
}

interface OwnerValue {
  id: string;
  name: string;
}

interface OwnerSearchInputProps {
  value: OwnerValue | null;
  onChange: (value: OwnerValue | null) => void;
}

export function OwnerSearchInput({ value, onChange }: OwnerSearchInputProps) {
  const [mode, setMode] = useState<"name" | "id">("name");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EmployeeSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get<EmployeeSearchResult[]>("/employees/search", {
          params: { q: query, by: mode },
        });
        setResults(res.data);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, mode]);

  const handleSelect = (emp: EmployeeSearchResult) => {
    onChange({ id: emp.id, name: `${emp.firstName} ${emp.lastName}`.trim() });
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
    setResults([]);
  };

  if (value) {
    return (
      <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-input bg-background text-sm">
        <span className="flex-1 truncate">{value.name}</span>
        <button type="button" onClick={handleClear} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="flex gap-1">
        {(["name", "id"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setQuery(""); setResults([]); }}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              mode === m
                ? "bg-amber-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            By {m === "name" ? "Name" : "ID"}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder={mode === "name" ? "Search by name…" : "Search by employee ID…"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors"
        />

        {open && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
            <ul className="max-h-48 overflow-y-auto py-1">
              {results.map((emp) => (
                <li key={emp.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(emp)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors"
                  >
                    <span className="font-medium">{emp.firstName} {emp.lastName}</span>
                    <span className="text-xs text-muted-foreground">{emp.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
