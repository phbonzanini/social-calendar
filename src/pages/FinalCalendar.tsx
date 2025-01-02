import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Campaign {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  objetivo?: string;
  descricao?: string;
  data_comemorativa?: string;
}

const FinalCalendar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanhas_marketing")
        .select("*")
        .order("data_inicio", { ascending: true });

      if (error) throw error;
      return data as Campaign[];
    },
  });

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen p-6 bg-gradient-to-br from-primary-light via-white to-neutral-light"
    >
      <div className="fixed top-4 left-4 z-10">
        <Logo />
      </div>

      <div className="max-w-6xl mx-auto pt-16">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <h1 className="text-3xl font-bold text-neutral-dark">
              Calendário de Campanhas 2025
            </h1>
            <Button
              onClick={() => navigate("/campaigns")}
              variant="outline"
              size="sm"
            >
              Voltar às Campanhas
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {months.map((month, index) => (
              <Card key={month} className="overflow-hidden">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-3">{month}</h3>
                  <div className="space-y-2">
                    {campaigns?.filter(campaign => {
                      const startDate = new Date(campaign.data_inicio);
                      return startDate.getMonth() === index && startDate.getFullYear() === 2025;
                    }).map(campaign => (
                      <div
                        key={campaign.id}
                        className="text-sm p-2 bg-primary/10 rounded-md"
                      >
                        <p className="font-medium">{campaign.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(campaign.data_inicio), "dd/MM", { locale: ptBR })} - {format(new Date(campaign.data_fim), "dd/MM", { locale: ptBR })}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FinalCalendar;