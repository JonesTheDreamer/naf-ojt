import { Button } from "@/components/ui/button";

interface Props {
  value: "per-naf" | "per-resource";
  onChange: (value: "per-naf" | "per-resource") => void;
}

export function ImplementationViewToggle({ value, onChange }: Props) {
  return (
    <div className="flex border rounded-lg overflow-hidden w-fit">
      <Button
        size="sm"
        variant={value === "per-naf" ? "default" : "ghost"}
        className="rounded-none border-0"
        onClick={() => onChange("per-naf")}
      >
        Per NAF
      </Button>
      <Button
        size="sm"
        variant={value === "per-resource" ? "default" : "ghost"}
        className="rounded-none border-0"
        onClick={() => onChange("per-resource")}
      >
        Per Resource
      </Button>
    </div>
  );
}
