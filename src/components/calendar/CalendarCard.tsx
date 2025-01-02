import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface CalendarDate {
  date: string;
  title: string;
  category: "commemorative" | "holiday" | "optional";
  description: string;
}

interface CalendarCardProps {
  date: CalendarDate;
  index: number;
}

const getDateTypeLabel = (type: CalendarDate["category"]) => {
  switch (type) {
    case "commemorative":
      return "Data Comemorativa";
    case "holiday":
      return "Feriado Nacional";
    case "optional":
      return "Ponto Facultativo";
    default:
      return "Data Comemorativa";
  }
};

const getDateTypeColor = (type: CalendarDate["category"]) => {
  switch (type) {
    case "commemorative":
      return "bg-blue-100 text-blue-800";
    case "holiday":
      return "bg-red-100 text-red-800";
    case "optional":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const CalendarCard = ({ date, index }: CalendarCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [campaignData, setCampaignData] = useState({
    nome: "",
    objetivo: "",
    descricao: "",
  });

  const formattedDate = new Date(date.date + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC'
  });

  const handleCreateCampaign = async () => {
    try {
      setIsLoading(true);
      const eventDate = new Date(date.date + 'T00:00:00');
      
      // Set campaign end date to 7 days after start date by default
      const endDate = new Date(eventDate);
      endDate.setDate(endDate.getDate() + 7);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para criar uma campanha",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("campanhas_marketing").insert({
        id_user: user.id,
        nome: campaignData.nome || date.title,
        data_inicio: eventDate.toISOString(),
        data_fim: endDate.toISOString(),
        objetivo: campaignData.objetivo,
        descricao: campaignData.descricao,
        data_comemorativa: date.title,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Campanha criada com sucesso",
      });

      // Refresh campaigns data
      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      
      setIsDialogOpen(false);
      setCampaignData({ nome: "", objetivo: "", descricao: "" });
    } catch (error) {
      console.error("Erro ao criar campanha:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a campanha",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card className="h-full bg-[#F1F0FB]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDateTypeColor(date.category)}`}>
                  {getDateTypeLabel(date.category)}
                </span>
                <h3 className="text-lg font-semibold mt-2">{date.title}</h3>
                <p className="text-sm text-neutral mt-1">{formattedDate}</p>
              </div>
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Criar Campanha
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Campanha para {date.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Campanha</label>
              <input
                type="text"
                placeholder={date.title}
                className="w-full p-2 border rounded-md"
                value={campaignData.nome}
                onChange={(e) => setCampaignData({ ...campaignData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Objetivo</label>
              <input
                type="text"
                placeholder="Objetivo da campanha"
                className="w-full p-2 border rounded-md"
                value={campaignData.objetivo}
                onChange={(e) => setCampaignData({ ...campaignData, objetivo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <textarea
                placeholder="Descrição da campanha"
                className="w-full p-2 border rounded-md"
                rows={3}
                value={campaignData.descricao}
                onChange={(e) => setCampaignData({ ...campaignData, descricao: e.target.value })}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleCreateCampaign}
              disabled={isLoading}
            >
              {isLoading ? "Criando..." : "Criar Campanha"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};