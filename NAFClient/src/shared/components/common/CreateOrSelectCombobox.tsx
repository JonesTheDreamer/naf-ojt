import { useState } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/shared/utils/utils";

interface CreateOrSelectComboboxProps {
  options: string[];
  value: string;
  onChange: (value: string, isNew: boolean) => void;
  placeholder?: string;
}

export function CreateOrSelectCombobox({
  options,
  value,
  onChange,
  placeholder = "Search or enter new...",
}: CreateOrSelectComboboxProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(input.toLowerCase()),
  );

  const exactMatch = options.some(
    (o) => o.toLowerCase() === input.toLowerCase(),
  );

  const showCreate = input.trim().length > 0 && !exactMatch;

  const handleSelect = (selected: string, isNew: boolean) => {
    onChange(selected, isNew);
    setInput("");
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value ? (
            <span className="truncate">{value}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-md border bg-popover p-0 shadow-md"
          sideOffset={4}
        >
          <Command>
            <CommandInput
              placeholder={placeholder}
              value={input}
              onValueChange={setInput}
            />
            <CommandList>
              {filtered.length > 0 && (
                <CommandGroup>
                  {filtered.map((option) => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => handleSelect(option, false)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {option}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {showCreate && (
                <CommandGroup>
                  <CommandItem
                    value={`__create__${input}`}
                    onSelect={() => handleSelect(input.trim(), true)}
                  >
                    <Plus className="mr-2 h-4 w-4 text-amber-500" />
                    Use{" "}
                    <span className="font-semibold mx-1">"{input.trim()}"</span>
                    <span className="text-xs text-amber-600">(new)</span>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
