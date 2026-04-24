import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectObject<T = string> {
  value: T;
  display: string;
}

interface SelectProps<T = string> {
  label: string;
  placeholder?: string;
  value: T;
  onValueChange: (value: T) => void;
  options: SelectObject<T>[];
}

export const SelectComponent = <T extends string | number>({
  label,
  placeholder,
  value,
  onValueChange,
  options,
}: SelectProps<T>) => {
  return (
    <Select
      value={value?.toString()}
      onValueChange={(val) => onValueChange(val as T)}
    >
      <SelectTrigger className="w-full max-w-48">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {options.map((s, i) => (
            <SelectItem key={i} value={s.value.toString()}>
              {s.display}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
