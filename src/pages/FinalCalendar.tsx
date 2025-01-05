import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MonthCard } from "@/components/calendar/MonthCard";
import { CalendarDownloadButtons } from "@/components/calendar/CalendarDownloadButtons";
import { Campaign } from "@/types/campaign";

const FinalCalendar = () => {
  const navigate = useNavigate();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("campanhas_marketing")
        .select("*")
        .order("data_inicio", { ascending: true });

      if (error) throw error;
      
      const uniqueCampaigns = data?.filter((campaign, index, self) =>
        index === self.findIndex((c) => c.id === campaign.id)
      );

      return uniqueCampaigns as Campaign[];
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
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => navigate("/campaigns")}
                variant="outline"
                size="sm"
              >
                Voltar às Campanhas
              </Button>
              <CalendarDownloadButtons campaigns={campaigns || []} months={months} />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {months.map((month, index) => (
              <MonthCard
                key={month}
                month={month}
                monthIndex={index}
                campaigns={campaigns || []}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FinalCalendar;