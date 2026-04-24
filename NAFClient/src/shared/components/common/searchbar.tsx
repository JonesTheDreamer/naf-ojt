import { useState, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
// import type { Employee } from "@/types/api/employee";

interface SearchBarProps<T> {
  placeholder?: string;
  fetchResults: (query: string) => Promise<T[]>;
  onSelect?: (result: T) => void;
  getKey: (item: T) => string | number;
  getValue: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
}

export default function SearchBar<T>({
  placeholder = "Search...",
  onSelect,
  fetchResults,
  getKey,
  getValue,
  renderItem,
}: SearchBarProps<T>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await fetchResults(trimmed);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, fetchResults]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSelect = (result: T) => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    onSelect?.(result);
  };

  const showDropdown = hasSearched && !isLoading;

  return (
    <div className="relative w-full max-w-lg">
      <div className="flex items-center gap-2">
        {/* Command used as a styled input container */}
        <Command
          shouldFilter={false}
          className="flex-1 rounded-lg border border-gray-200 shadow-sm overflow-visible"
        >
          <div className="flex flex-col border-b-0">
            <CommandInput
              placeholder={placeholder}
              value={query}
              onValueChange={(val) => {
                setQuery(val);
                // Reset results when user edits query
                if (hasSearched) {
                  setHasSearched(false);
                  setResults([]);
                }
              }}
              onKeyDown={handleKeyDown}
              // className="h-10 flex-1"
            />
          </div>

          {/* Dropdown results */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-12 mt-1 z-50 rounded-lg border border-gray-200 bg-white shadow-md overflow-hidden">
              <CommandList>
                {error ? (
                  <div className="py-4 px-4 text-sm text-red-500">{error}</div>
                ) : results.length === 0 ? (
                  <CommandEmpty>No results found.</CommandEmpty>
                ) : (
                  <CommandGroup heading="Results">
                    {results.map((result) => (
                      <CommandItem
                        key={getKey(result)}
                        value={getValue(result)}
                        onSelect={() => handleSelect(result)}
                        className="cursor-pointer"
                      >
                        {renderItem(result)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </div>
          )}
        </Command>

        {/* Submit button */}
        <Button
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          className="px-4 bg-amber-500 hover:bg-amber-600 text-white"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
