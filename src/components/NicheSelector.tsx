import { useState } from "react";
import { Check, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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

export const niches = [
  { value: "ecommerce", label: "E-commerce" },
  { value: "food", label: "Alimentação" },
  { value: "fashion", label: "Moda" },
  { value: "beauty", label: "Beleza" },
  { value: "tech", label: "Tecnologia" },
  { value: "health", label: "Saúde e Bem-estar" },
  { value: "education", label: "Educação" },
  { value: "pets", label: "Pets" },
  { value: "sports", label: "Esportes" },
  { value: "home", label: "Casa e Decoração" },
  { value: "automotive", label: "Automotivo" },
  { value: "books", label: "Livraria" },
  { value: "games", label: "Games" },
  { value: "toys", label: "Brinquedos" },
  { value: "jewelry", label: "Joias e Acessórios" }
];

export const NicheSelector = () => {
  const [open, setOpen] = useState(false);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const navigate = useNavigate();

  const toggleNiche = (value: string) => {
    setSelectedNiches((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const handleGenerateCalendar = () => {
    if (selectedNiches.length === 0) {
      return;
    }
    navigate("/calendar", { state: { selectedNiches } });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
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
          <Command className="bg-white rounded-lg">
            <CommandInput placeholder="Procurar nicho..." className="h-9" />
            <CommandList>
              <CommandEmpty>Nenhum nicho encontrado.</CommandEmpty>
              <CommandGroup>
                {niches.map((niche) => (
                  <CommandItem
                    key={niche.value}
                    onSelect={() => toggleNiche(niche.value)}
                    className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50"
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

      <Button
        onClick={handleGenerateCalendar}
        disabled={selectedNiches.length === 0}
        className="w-full"
      >
        <Calendar className="mr-2" />
        Gerar Calendário
      </Button>
    </div>
  );
};