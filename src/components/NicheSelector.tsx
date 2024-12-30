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
import { toast } from "sonner";

export const niches = [
  { value: "education", label: "Educação" },
  { value: "marketing", label: "Marketing" },
  { value: "health-beauty", label: "Beleza e Saúde" },
  { value: "sustainability", label: "Sustentabilidade" },
  { value: "tech", label: "Tecnologia" },
  { value: "consulting", label: "Consultoria" },
  { value: "pets", label: "Pets" },
  { value: "food", label: "Alimentação" },
  { value: "finance", label: "Finanças" },
  { value: "fashion", label: "Moda" },
  { value: "events", label: "Eventos" },
  { value: "realestate", label: "Imóveis" },
  { value: "tourism", label: "Turismo" },
  { value: "art-culture", label: "Arte e Cultura" },
  { value: "sports", label: "Esportes" },
  { value: "automotive", label: "Automotivo" },
  { value: "infoproducts", label: "Infoprodutos" },
  { value: "gastronomy", label: "Gastronomia" },
  { value: "entrepreneurship", label: "Empreendedorismo" },
  { value: "games", label: "Games" },
  { value: "weddings", label: "Casamentos" },
  { value: "industry", label: "Indústria" },
  { value: "design", label: "Design" },
  { value: "logistics", label: "Logística" },
  { value: "healthcare", label: "Saúde e Cuidados" }
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

  const handleGenerateCalendar = async () => {
    if (selectedNiches.length === 0) {
      toast.error("Selecione pelo menos um nicho");
      return;
    }

    try {
      navigate("/calendar", { 
        state: { 
          selectedNiches: selectedNiches.map(niche => niche.trim()) 
        } 
      });
    } catch (error) {
      console.error("Navigation error:", error);
      toast.error("Erro ao gerar calendário. Tente novamente.");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-white bg-neutral-dark hover:bg-neutral-dark/90"
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
        className="w-full text-white"
      >
        <Calendar className="mr-2" />
        Gerar Calendário
      </Button>
    </div>
  );
};