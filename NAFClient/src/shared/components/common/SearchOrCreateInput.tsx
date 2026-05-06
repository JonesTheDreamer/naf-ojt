import { useState } from "react";
import { Search, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchOrCreateInputProps {
  options: string[];
  value: string;
  onChange: (value: string, isNew: boolean) => void;
  placeholder?: string;
}

export function SearchOrCreateInput({
  options,
  value,
  onChange,
  placeholder = "Type to search...",
}: SearchOrCreateInputProps) {
  const [inputText, setInputText] = useState(value);
  const [status, setStatus] = useState<"found" | "new" | null>(null);

  const handleInputChange = (text: string) => {
    setInputText(text);
    setStatus(null);
    if (!text.trim()) onChange("", false);
  };

  const handleSearch = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    const match = options.find((o) => o.toLowerCase() === trimmed.toLowerCase());
    if (match) {
      setStatus("found");
      onChange(match, false);
    } else {
      setStatus("new");
      onChange(trimmed, true);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={placeholder}
          className="h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleSearch}
          disabled={!inputText.trim()}
          className="gap-1.5"
        >
          <Search className="h-3.5 w-3.5" />
          Search
        </Button>
      </div>
      {status === "found" && (
        <p className="flex items-center gap-1 text-xs text-emerald-600">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          Existing record found. It will be used.
        </p>
      )}
      {status === "new" && (
        <p className="flex items-center gap-1 text-xs text-amber-600">
          <Plus className="h-3 w-3 shrink-0" />
          No record found. A new one will be created.
        </p>
      )}
    </div>
  );
}
