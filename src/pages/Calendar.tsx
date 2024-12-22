import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CalendarDate {
  date: string;
  title: string;
  category: "commemorative" | "holiday" | "optional";
  description: string;
}

const fetchDatesForNiches = async (niches: string[]): Promise<CalendarDate[]> => {
  // Aqui implementaremos a chamada para a API do OpenAI
  // Por enquanto, retornamos dados mockados
  return [
    {
      date: "2024-05-12",
      title: "Dia das Mães",
      category: "commemorative",
      description: "Uma das datas mais importantes para o comércio"
    },
    {
      date: "2024-06-12",
      title: "Dia dos Namorados",
      category: "commemorative",
      description: "Excelente para campanhas promocionais"
    }
  ];
};

const Calendar = () => {
  const location = useLocation();
  const selectedNiches = location.state?.selectedNiches || [];

  const { data: dates, isLoading } = useQuery({
    queryKey: ["calendar-dates", selectedNiches],
    queryFn: () => fetchDatesForNiches(selectedNiches),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <h1 className="text-3xl font-bold text-neutral-dark mb-6">
          Seu Calendário Personalizado
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dates?.map((date, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {date.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {new Date(date.date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm">{date.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Calendar;