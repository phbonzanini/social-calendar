import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { CalendarCard } from "@/components/calendar/CalendarCard";
import { Logo } from "@/components/Logo";

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
      throw error;
    }

    if (!data?.dates) {
      console.log("Nenhuma data encontrada");
      return [];
    }

    console.log("Datas encontradas:", data.dates);
    return data.dates;

  } catch (error) {
    console.error("Erro ao buscar datas:", error);
    throw error;
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
  const { toast } = useToast();
  const selectedNiches = location.state?.selectedNiches || [];

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
        <CalendarHeader
          selectedNiches={selectedNiches}
        />
        {error ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <p className="text-red-600">
              Erro ao carregar datas: {error.message}
            </p>
          </div>
        ) : !isLoading && (!dates || dates.length === 0) ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <p className="text-neutral-dark">
              Nenhuma data encontrada para os nichos selecionados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dates?.map((date, index) => (
              <CalendarCard key={`${date.date}-${index}`} date={date} index={index} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Calendar;