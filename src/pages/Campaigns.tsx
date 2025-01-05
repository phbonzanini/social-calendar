import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { CampaignList } from "@/components/campaigns/CampaignList";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { Campaign } from "@/types/campaign";
import { useEffect } from "react";

const Campaigns = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const selectedDates = location.state?.selectedDates || [];

  const { data: campaigns, isLoading, refetch } = useQuery({
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
      return data as Campaign[];
    },
  });

  // Add automatic campaign creation for selected dates
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
        for (const date of selectedDates) {
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

          if (error) throw error;
        }

        toast({
          title: "Campanhas criadas com sucesso!",
          description: "As datas selecionadas foram adicionadas ao seu calendário.",
        });

        refetch();
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
  }, [selectedDates, toast, refetch]);

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
        data_comemorativa: values.data_comemorativa || null,
        id_user: session.session.user.id
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
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <h1 className="text-3xl font-bold text-neutral-dark">
              Gerenciar Campanhas
            </h1>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate("/calendar")}
                variant="outline"
                size="sm"
              >
                Voltar ao Calendário
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Campanha
                  </Button>
                </DialogTrigger>
                <CampaignForm onSubmit={onSubmit} />
              </Dialog>
              <Button
                onClick={() => navigate("/final-calendar")}
                variant="outline"
                size="sm"
              >
                Ver Calendário Final
              </Button>
            </div>
          </div>
        </div>

        <CampaignList campaigns={campaigns} isLoading={isLoading} />
      </div>
    </motion.div>
  );
};

export default Campaigns;