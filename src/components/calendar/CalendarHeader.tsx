import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { niches } from "@/components/NicheSelector";

interface CalendarHeaderProps {
  selectedNiches: string[];
}

export const CalendarHeader = ({
  selectedNiches,
}: CalendarHeaderProps) => {
  const navigate = useNavigate();

  const getNicheLabel = (value: string) => {
    const niche = niches.find((n) => n.value === value);
    return niche ? niche.label : value;
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
        <h1 className="text-3xl font-bold text-neutral-dark">
          Seu Calendário Personalizado
        </h1>
        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
          <Button
            onClick={() => navigate("/select-niche")}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Settings2 className="h-4 w-4" />
            Alterar Nichos
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedNiches.map((niche: string) => (
          <span
            key={niche}
            className="inline-block px-4 py-1.5 bg-primary text-white rounded-full text-sm font-medium shadow-sm hover:bg-primary-dark transition-colors"
          >
            {getNicheLabel(niche)}
          </span>
        ))}
      </div>
    </div>
  );
};