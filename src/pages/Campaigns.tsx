import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CampaignList } from "@/components/campaigns/CampaignList";
import { Campaign } from "@/types/campaign";
import { CampaignHeader } from "@/components/campaigns/CampaignHeader";
import { useAutomaticCampaignCreator } from "@/components/campaigns/AutomaticCampaignCreator";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Campaigns = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const calendarIdParam = searchParams.get("calendar");
  const calendarId = calendarIdParam ? parseInt(calendarIdParam) : null;

  const { data: calendar } = useQuery({
    queryKey: ["calendar", calendarId],
    queryFn: async () => {
      if (!calendarId) return null;

      const { data, error } = await supabase
        .from("calendarios")
        .select("*")
        .eq("id", calendarId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!calendarId,
  });

  const { data: campaigns, isLoading, refetch } = useQuery({
    queryKey: ["campaigns", calendarId],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      let query = supabase
        .from("campanhas_marketing")
        .select("*")
        .order("data_inicio", { ascending: true });

      if (calendarId) {
        query = query.eq("id_calendario", calendarId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Campaign[];
    },
  });

  // Use the automatic campaign creator hook
  useAutomaticCampaignCreator(refetch);

  const onSubmit = async (values: Omit<Campaign, "id">) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const campaignData = {
        nome: values.nome,
        data_inicio: values.data_inicio,
        data_fim: values.data_fim,
        objetivo: values.objetivo || null,
        descricao: values.descricao || null,
        oferta: values.oferta || null,
        id_user: session.session.user.id,
        id_calendario: calendarId || null,
      };

      const { error } = await supabase
        .from("campanhas_marketing")
        .insert([campaignData]);

      if (error) throw error;

      toast({
        title: "Campanha criada com sucesso!",
        description: "Sua campanha foi adicionada ao calendário.",
      });

      refetch();
    } catch (error) {
      console.error("Erro ao criar campanha:", error);
      toast({
        title: "Erro ao criar campanha",
        description: "Não foi possível criar a campanha. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen p-6 bg-gradient-to-br from-primary-light via-white to-neutral-light"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/calendar")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {calendar && (
            <h1 className="text-2xl font-bold">
              Campanhas - {calendar.nome} ({calendar.ano})
            </h1>
          )}
        </div>
        <CampaignHeader onSubmit={onSubmit} />
        <CampaignList campaigns={campaigns} isLoading={isLoading} />
      </div>
    </motion.div>
  );
};

export default Campaigns;