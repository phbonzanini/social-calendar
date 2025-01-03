import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { CalendarCard } from "@/components/calendar/CalendarCard";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CalendarDate {
  date: string;
  title: string;
  category: "commemorative" | "holiday" | "optional";
  description: string;
}

const fetchDatesForNiches = async (niches: string[]): Promise<CalendarDate[]> => {
  if (!niches || niches.length === 0) {
    throw new Error("Nenhum nicho selecionado");
  }

  console.log("Buscando datas para os nichos:", niches);

  try {
    const { data, error } = await supabase.functions.invoke(
      "search-dates",
      {
        body: { niches },
      }
    );

    if (error) {
      console.error("Erro na função de busca:", error);
      throw new Error(`Erro na função de busca: ${error.message}`);
    }

    if (!data?.dates) {
      console.log("Nenhuma data encontrada");
      return [];
    }

    console.log("Datas encontradas:", data.dates);
    return data.dates;

  } catch (error) {
    console.error("Erro ao buscar datas:", error);
    throw error instanceof Error 
      ? error 
      : new Error("Erro desconhecido ao buscar datas");
  }
};

const LoadingState = () => (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
    <div className="text-center max-w-md px-4">
      <h3 className="text-lg font-semibold mb-2">Analisando datas relevantes</h3>
      <p className="text-muted-foreground">
        Estamos buscando as datas mais relevantes para os nichos selecionados. 
        Isso pode levar alguns segundos...
      </p>
    </div>
  </div>
);

const Calendar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const selectedNiches = location.state?.selectedNiches || [];
  const [selectedDates, setSelectedDates] = useState<CalendarDate[]>([]);

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen p-6 bg-gradient-to-br from-primary-light via-white to-neutral-light"
    >
      {isLoading && <LoadingState />}
      <div className="fixed top-4 left-4 z-10">
        <Logo />
      </div>
      <div className="max-w-4xl mx-auto pt-16">
        <CalendarHeader selectedNiches={selectedNiches} />
        {error ? (
          <div className="min-h-[200px] flex flex-col items-center justify-center gap-4 p-6 bg-red-50 rounded-lg">
            <p className="text-red-600 text-center">
              Erro ao carregar datas: {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
            <pre className="text-xs bg-white p-4 rounded overflow-auto max-w-full">
              {JSON.stringify(error, null, 2)}
            </pre>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dates?.map((date, index) => (
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
                className="px-8"
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