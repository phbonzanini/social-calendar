import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const niches = [
  { value: "ecommerce", label: "E-commerce" },
  { value: "food", label: "Alimentação" },
  { value: "fashion", label: "Moda" },
  { value: "beauty", label: "Beleza" },
  { value: "tech", label: "Tecnologia" },
];

export const NicheSelector = () => {
  const [open, setOpen] = useState(false);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);

  const toggleNiche = (value: string) => {
    setSelectedNiches((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  return (
    <div className="w-full max-w-sm">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-neutral-dark"
          >
            {selectedNiches.length > 0
              ? `${selectedNiches.length} nicho${
                  selectedNiches.length > 1 ? "s" : ""
                } selecionado${selectedNiches.length > 1 ? "s" : ""}`
              : "Selecione seus nichos"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Procurar nicho..." className="h-9" />
            <CommandList>
              <CommandEmpty>Nenhum nicho encontrado.</CommandEmpty>
              <CommandGroup>
                {niches.map((niche) => (
                  <CommandItem
                    key={niche.value}
                    onSelect={() => toggleNiche(niche.value)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div
                      className={`w-4 h-4 border rounded-sm flex items-center justify-center ${
                        selectedNiches.includes(niche.value)
                          ? "bg-primary border-primary"
                          : "border-neutral"
                      }`}
                    >
                      {selectedNiches.includes(niche.value) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    {niche.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};