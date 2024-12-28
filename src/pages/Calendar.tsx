import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { CalendarCard } from "@/components/calendar/CalendarCard";
import { exportToPDF, exportToCSV } from "@/utils/exportUtils";

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
    // First try with direct database query using the new niches column
    const { data: dbData, error: dbError } = await supabase
      .from("datas_2025")
      .select("*")
      .overlaps('niches', niches)
      .order("data");

    if (dbError) {
      console.error("Erro na busca no banco:", dbError);
      throw dbError;
    }

    if (dbData && dbData.length > 0) {
      console.log("Datas encontradas no banco:", dbData.length);
      return dbData.map((item) => ({
        date: item.data,
        title: item.descrição,
        category: item.tipo as "commemorative" | "holiday" | "optional",
        description: item.descrição,
      }));
    }

    // If no results from direct query, try with GPT
    console.log("Nenhuma data encontrada no banco, tentando com GPT");
    
    const { data: gptResponse, error: gptError } = await supabase.functions.invoke(
      "search-dates",
      {
        body: { niches },
      }
    );

    if (gptError) {
      console.error("Erro na busca com GPT:", gptError);
      throw gptError;
    }

    if (!gptResponse?.dates || gptResponse.dates.length === 0) {
      console.log("Nenhuma data encontrada via GPT");
      return [];
    }

    console.log("Datas encontradas via GPT:", gptResponse.dates.length);
    
    return gptResponse.dates.map((item) => ({
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

const Calendar = () => {
  const location = useLocation();
  const { toast } = useToast();
  const selectedNiches = location.state?.selectedNiches || [];

  const { data: dates, isLoading, error } = useQuery({
    queryKey: ["calendar-dates", selectedNiches],
    queryFn: () => fetchDatesForNiches(selectedNiches),
    meta: {
      onError: () => {
        toast({
          title: "Erro ao carregar datas",
          description:
            "Não foi possível carregar as datas do calendário. Tente novamente mais tarde.",
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">
          Erro ao carregar o calendário. Tente novamente.
        </p>
      </div>
    );
  }

  if (!dates || dates.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-dark">
          Nenhuma data encontrada para os nichos selecionados.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6 bg-gradient-to-br from-primary-light via-white to-neutral-light"
    >
      <div className="max-w-4xl mx-auto">
        <CalendarHeader
          selectedNiches={selectedNiches}
          onExportPDF={handleExportPDF}
          onExportCSV={handleExportCSV}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dates.map((date, index) => (
            <CalendarCard key={`${date.date}-${index}`} date={date} index={index} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Calendar;