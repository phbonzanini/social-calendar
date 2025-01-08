import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAutomaticCampaignCreator = (refetchCampaigns: () => void) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const calendarId = searchParams.get("calendar");
  const selectedDates = location.state?.selectedDates || [];

  useEffect(() => {
    const createCampaignsForSelectedDates = async () => {
      if (!selectedDates.length) return;
      if (!calendarId) {
        toast({
          title: "Erro ao criar campanhas",
          description: "É necessário selecionar um calendário primeiro.",
          variant: "destructive",
        });
        return;
      }

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
          // Create a unique key combining date and title
          const uniqueKey = `${date.date}-${date.title}`;
          
          // Skip if we've already processed this exact date and title combination
          if (processedDates.has(uniqueKey)) {
            console.log(`Skipping duplicate date and title combination: ${uniqueKey}`);
            continue;
          }
          processedDates.add(uniqueKey);

          // Check if a campaign already exists for this date, title and user
          const { data: existingCampaigns } = await supabase
            .from("campanhas_marketing")
            .select("*")
            .eq("data_comemorativa", date.date)
            .eq("nome", date.title)
            .eq("id_user", session.session.user.id)
            .eq("id_calendario", parseInt(calendarId))
            .eq("is_from_commemorative", true);

          // Only create if no campaign exists for this date and title
          if (!existingCampaigns || existingCampaigns.length === 0) {
            console.log(`Creating campaign for date: ${date.date} and title: ${date.title}`);
            const campaignData = {
              nome: date.title,
              data_inicio: date.date,
              data_fim: date.date,
              descricao: date.description,
              data_comemorativa: date.date,
              id_user: session.session.user.id,
              is_from_commemorative: true,
              id_calendario: parseInt(calendarId)
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
            console.log(`Campaign already exists for date: ${date.date} and title: ${date.title}`);
          }
        }

        // Clear the selectedDates from location state
        navigate(location.pathname, { replace: true, state: {} });

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
  }, [selectedDates, toast, refetchCampaigns, navigate, location.pathname, calendarId]);
};