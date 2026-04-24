import { useState } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Command } from "cmdk";
import { ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/utils";

export interface ComboboxOption {
  value: number;
  label: string;
}

export function SearchableCombobox({
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
