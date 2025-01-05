import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CalendarDate } from "@/services/dateService";

export const useAutomaticCampaignCreator = (refetchCampaigns: () => void) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const selectedDates = location.state?.selectedDates || [];

  useEffect(() => {
    const createCampaignsForSelectedDates = async () => {
      if (!selectedDates.length) return;

      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para criar campanhas.",
          variant: "destructive",
        });
        return;
      }

      try {
        let createdCount = 0;
        const processedDates = new Set<string>();

        for (const date of selectedDates) {
          // Skip if we've already processed this date in the current batch
          if (processedDates.has(date.date)) {
            console.log(`Skipping duplicate date: ${date.date}`);
            continue;
          }
          processedDates.add(date.date);

          // Check if a campaign already exists for this date and user
          const { data: existingCampaigns } = await supabase
            .from("campanhas_marketing")
            .select("*")
            .eq("data_comemorativa", date.date)
            .eq("id_user", session.session.user.id)
            .eq("is_from_commemorative", true);

          // Only create if no campaign exists for this date
          if (!existingCampaigns || existingCampaigns.length === 0) {
            console.log(`Creating campaign for date: ${date.date}`);
            const campaignData = {
              nome: date.title,
              data_inicio: date.date,
              data_fim: date.date,
              descricao: date.description,
              data_comemorativa: date.date,
              id_user: session.session.user.id,
              is_from_commemorative: true
            };

            const { error } = await supabase
              .from("campanhas_marketing")
              .insert([campaignData]);

            if (error) {
              console.error(`Error creating campaign for date ${date.date}:`, error);
              throw error;
            }
            createdCount++;
          } else {
            console.log(`Campaign already exists for date: ${date.date}`);
          }
        }

        // Clear the selectedDates from location state after processing
        navigate(location.pathname, { replace: true });

        if (createdCount > 0) {
          toast({
            title: "Campanhas criadas com sucesso!",
            description: `${createdCount} nova(s) data(s) foram adicionadas ao seu calendário.`,
          });
          refetchCampaigns();
        } else if (selectedDates.length > 0) {
          toast({
            title: "Nenhuma campanha nova criada",
            description: "As datas selecionadas já existem no seu calendário.",
          });
        }
      } catch (error) {
        console.error("Erro ao criar campanhas:", error);
        toast({
          title: "Erro ao criar campanhas",
          description: "Não foi possível criar as campanhas. Tente novamente.",
          variant: "destructive",
        });
      }
    };

    createCampaignsForSelectedDates();
  }, [selectedDates, toast, refetchCampaigns, navigate, location.pathname]);
};