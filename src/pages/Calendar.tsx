import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { CalendarCard } from "@/components/calendar/CalendarCard";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/calendar/LoadingState";
import { getNiches } from "@/utils/nicheUtils";
import { fetchDatesForNiches, type CalendarDate } from "@/services/dateService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const Calendar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDates, setSelectedDates] = useState<CalendarDate[]>([]);

  const selectedNiches = getNiches(location.state, navigate);

  const { data: dates, isLoading, error } = useQuery({
    queryKey: ["calendar-dates", selectedNiches],
    queryFn: () => fetchDatesForNiches(selectedNiches),
    meta: {
      error: (error: Error) => {
        console.error("Erro na query:", error);
        toast({
          title: "Erro ao carregar datas",
          description: error.message || "Não foi possível carregar as datas do calendário. Por favor, tente novamente.",
          variant: "destructive",
        });
      },
    },
  });

  const handleDateSelect = (date: CalendarDate) => {
    setSelectedDates(prev => {
      const isSelected = prev.some(d => d.date === date.date);
      if (isSelected) {
        return prev.filter(d => d.date !== date.date);
      } else {
        return [...prev, date];
      }
    });
  };

  const handleContinue = () => {
    if (selectedDates.length === 0) {
      toast({
        title: "Selecione pelo menos uma data",
        description: "Por favor, selecione as datas que deseja incluir em suas campanhas.",
        variant: "destructive",
      });
      return;
    }
    navigate("/campaigns", { state: { selectedDates } });
  };

  useEffect(() => {
    if (!isLoading && (!selectedNiches || selectedNiches.length === 0)) {
      toast({
        title: "Nenhum nicho selecionado",
        description: "Por favor, selecione pelo menos um nicho.",
        variant: "destructive",
      });
      navigate("/select-niche");
    }
  }, [isLoading, selectedNiches, navigate]);

  // Separate general commemorative dates from niche-specific dates
  const generalDates = dates?.filter(date => 
    date.title.toLowerCase().includes("dia das mães") ||
    date.title.toLowerCase().includes("dia dos pais") ||
    date.title.toLowerCase().includes("natal") ||
    date.title.toLowerCase().includes("ano novo") ||
    date.title.toLowerCase().includes("dia do cliente") ||
    date.title.toLowerCase().includes("black friday")
  ) || [];

  const nicheDates = dates?.filter(date => !generalDates.includes(date)) || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen p-6 bg-gradient-to-br from-primary-light via-white to-neutral-light"
    >
      {isLoading && <LoadingState />}
      <div className="max-w-4xl mx-auto">
        <CalendarHeader selectedNiches={selectedNiches} />
        {error ? (
          <div className="min-h-[200px] flex flex-col items-center justify-center gap-4 p-6 bg-red-50 rounded-lg">
            <p className="text-red-600 text-center">
              Erro ao carregar datas: {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
          </div>
        ) : !isLoading && (!dates || dates.length === 0) ? (
          <div className="min-h-[200px] flex flex-col items-center justify-center gap-4 p-6 bg-amber-50 rounded-lg">
            <p className="text-amber-800 text-center">
              Nenhuma data encontrada para os nichos selecionados.
            </p>
            <p className="text-sm text-amber-600">
              Nichos selecionados: {selectedNiches.join(", ")}
            </p>
          </div>
        ) : (
          <>
            {generalDates.length > 0 && (
              <div className="mb-8">
                <Alert className="mb-4 bg-primary/10 border-primary/20">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Estas são datas comemorativas gerais que sugerimos incluir em seu calendário, 
                    pois costumam ser relevantes para diversos tipos de negócios.
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generalDates.map((date, index) => (
                    <CalendarCard
                      key={`${date.date}-${index}`}
                      date={date}
                      index={index}
                      isSelected={selectedDates.some(d => d.date === date.date)}
                      onSelect={() => handleDateSelect(date)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nicheDates.map((date, index) => (
                <CalendarCard
                  key={`${date.date}-${index}`}
                  date={date}
                  index={index}
                  isSelected={selectedDates.some(d => d.date === date.date)}
                  onSelect={() => handleDateSelect(date)}
                />
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleContinue}
                size="lg"
                className="px-8 text-white"
              >
                Continuar para Campanhas
              </Button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default Calendar;