import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CalendarDownloadButtons } from "@/components/calendar/CalendarDownloadButtons";
import { Campaign } from "@/types/campaign";
import { format, startOfYear, endOfYear, eachDayOfInterval, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { CampaignCard } from "@/components/campaigns/CampaignCard";

const FinalCalendar = () => {
  const navigate = useNavigate();
  const [selectedCampaigns, setSelectedCampaigns] = useState<Campaign[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

      return uniqueCampaigns as unknown as Campaign[];
    },
  });

  const year2025 = new Date(2025, 0, 1);
  const startDate = startOfYear(year2025);
  const endDate = endOfYear(year2025);
  const allDaysOf2025 = eachDayOfInterval({ start: startDate, end: endDate });

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const getCampaignsForDay = (date: Date): Campaign[] => {
    if (!campaigns) return [];
    return campaigns.filter(campaign => {
      // Criar datas sem considerar o horário
      const campaignStart = new Date(campaign.data_inicio);
      campaignStart.setUTCHours(0, 0, 0, 0);
      
      const campaignEnd = new Date(campaign.data_fim);
      campaignEnd.setUTCHours(23, 59, 59, 999);
      
      const checkDate = new Date(date);
      checkDate.setUTCHours(12, 0, 0, 0);

      return isWithinInterval(checkDate, { 
        start: campaignStart, 
        end: campaignEnd 
      });
    });
  };

  const isDayInAnyCampaign = (date: Date) => {
    return getCampaignsForDay(date).length > 0;
  };

  const handleDayClick = (date: Date) => {
    const campaignsForDay = getCampaignsForDay(date);
    if (campaignsForDay.length > 0) {
      setSelectedCampaigns(campaignsForDay);
      setIsDialogOpen(true);
    }
  };

  const renderMonth = (monthIndex: number) => {
    const daysInMonth = allDaysOf2025.filter(
      date => date.getMonth() === monthIndex
    );

    const firstDayOfMonth = daysInMonth[0];
    const startingDayIndex = firstDayOfMonth.getDay();
    
    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    return (
      <div key={monthIndex} className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-neutral-dark">
          {months[monthIndex]}
        </h3>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => (
            <div key={day} className="text-xs text-center font-medium text-neutral-dark p-1">
              {day}
            </div>
          ))}
          {Array.from({ length: startingDayIndex }).map((_, index) => (
            <div key={`empty-${index}`} className="p-2" />
          ))}
          {daysInMonth.map(date => {
            const hasCampaign = isDayInAnyCampaign(date);
            return (
              <div
                key={date.toISOString()}
                className={`p-2 text-center text-sm rounded-md transition-colors ${
                  hasCampaign 
                    ? "bg-primary text-white hover:bg-primary-dark cursor-pointer" 
                    : "text-neutral-dark hover:bg-neutral-light"
                }`}
                onClick={() => handleDayClick(date)}
              >
                {format(date, "d")}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen p-6 bg-gradient-to-br from-primary-light via-white to-neutral-light"
    >
      <div className="fixed top-4 left-4 z-10">
        <Logo />
      </div>

      <div className="max-w-[1600px] mx-auto">
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
                className="text-neutral-dark bg-white hover:text-neutral-dark hover:bg-neutral-light"
              >
                Voltar às Campanhas
              </Button>
              <CalendarDownloadButtons campaigns={campaigns || []} />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {months.map((_, index) => renderMonth(index))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campanhas nesta data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onEdit={() => {}}
                onDelete={() => {}}
                showActions={false}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default FinalCalendar;