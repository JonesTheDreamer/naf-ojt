import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ApprovalFilter = "subordinates" | "approval";

const FILTER_OPTIONS: { value: ApprovalFilter; label: string }[] = [
  { value: "subordinates", label: "Subordinates" },
  { value: "approval", label: "Approval" },
];

interface ApprovalFilterProps {
  value: ApprovalFilter;
  onChange: (value: ApprovalFilter) => void;
}

export function ApprovalFilterDropdown({
  value,
  onChange,
}: ApprovalFilterProps) {
  const current = FILTER_OPTIONS.find((o) => o.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 gap-2 rounded-md">
          {current?.label}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => onChange(v as ApprovalFilter)}
        >
          {FILTER_OPTIONS.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="cursor-pointer"
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
