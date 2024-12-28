import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { CalendarCard } from "@/components/calendar/CalendarCard";
import { exportToPDF, exportToCSV } from "@/utils/exportUtils";
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
    // Primeiro, buscar todas as datas do banco
    const { data: allDates, error: dbError } = await supabase
      .from("datas_2025")
      .select("*");

    if (dbError) {
      console.error("Erro na busca no banco:", dbError);
      throw dbError;
    }

    if (!allDates) {
      console.error("Nenhuma data encontrada no banco");
      return [];
    }

    console.log("Total de datas encontradas no banco:", allDates.length);

    // Enviar todas as datas para análise via Edge Function
    console.log("Enviando datas para análise");
    const { data: searchData, error: searchError } = await supabase.functions.invoke(
      "search-dates",
      {
        body: { 
          niches,
          allDates
        },
      }
    );

    if (searchError) {
      console.error("Erro na função de busca:", searchError);
      throw searchError;
    }

    if (!searchData?.dates || searchData.dates.length === 0) {
      console.log("Nenhuma data relevante encontrada após análise");
      return [];
    }

    console.log("Datas relevantes encontradas:", searchData.dates.length);

    // Mapear as datas para o formato esperado pelo componente
    return searchData.dates.map((item: any) => ({
      date: item.data,
      title: item.descrição,
      category: item.tipo as "commemorative" | "holiday" | "optional",
      description: item.descrição,
    }));

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
        Estamos buscando e analisando as datas mais relevantes para os nichos selecionados. 
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
      onError: (error: Error) => {
        console.error("Erro na query:", error);
        toast({
          title: "Erro ao carregar datas",
          description: error.message || "Não foi possível carregar as datas do calendário. Por favor, tente novamente.",
          variant: "destructive",
        });
      },
    },
  });

  const handleExportPDF = () => {
    if (!dates || dates.length === 0) return;
    exportToPDF(dates, selectedNiches);
    toast({
      title: "PDF gerado com sucesso",
      description: "O arquivo foi baixado para o seu computador.",
    });
  };

  const handleExportCSV = () => {
    if (!dates || dates.length === 0) return;
    exportToCSV(dates);
    toast({
      title: "CSV gerado com sucesso",
      description: "O arquivo foi baixado para o seu computador.",
    });
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
        <CalendarHeader
          selectedNiches={selectedNiches}
          onExportPDF={handleExportPDF}
          onExportCSV={handleExportCSV}
        />
        {!isLoading && (!dates || dates.length === 0) ? (
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