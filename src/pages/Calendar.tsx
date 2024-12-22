import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface CalendarDate {
  date: string;
  title: string;
  category: "commemorative" | "holiday" | "optional";
  description: string;
}

const fetchDatesForNiches = async (niches: string[]): Promise<CalendarDate[]> => {
  const { data, error } = await supabase.functions.invoke('generate-calendar', {
    body: { niches }
  });

  if (error) throw error;
  return data.dates;
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
          title: "Erro ao gerar calendário",
          description: "Não foi possível gerar o calendário. Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    }
  });

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
        <p className="text-red-500">Erro ao carregar o calendário. Tente novamente.</p>
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
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {date.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {new Date(date.date).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="mb-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      date.category === 'commemorative' ? 'bg-blue-100 text-blue-800' :
                      date.category === 'holiday' ? 'bg-red-100 text-red-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {date.category === 'commemorative' ? 'Comemorativa' :
                       date.category === 'holiday' ? 'Feriado' : 'Opcional'}
                    </span>
                  </div>
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