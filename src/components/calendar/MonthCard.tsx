import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Campaign {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  objetivo?: string;
  descricao?: string;
  oferta?: string;
}

interface MonthCardProps {
  month: string;
  monthIndex: number;
  campaigns: Campaign[];
}

export const MonthCard = ({ month, monthIndex, campaigns }: MonthCardProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Filter campaigns to only show those starting in this month and year
  const monthCampaigns = campaigns
    .filter((campaign, index, self) => {
      const startDate = new Date(campaign.data_inicio);
      const isCorrectMonth = startDate.getMonth() === monthIndex;
      const isCorrectYear = startDate.getFullYear() === 2025;
      
      // Check if this is the first occurrence of this campaign (prevents duplicates)
      const isFirstOccurrence = index === self.findIndex(c => c.id === campaign.id);
      
      return isCorrectMonth && isCorrectYear && isFirstOccurrence;
    })
    .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());

  const handleEditClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsEditing(true);
  };

  const handleEditSubmit = async (values: Omit<Campaign, "id">) => {
    if (!selectedCampaign) return;

    try {
      const { error } = await supabase
        .from("campanhas_marketing")
        .update({
          nome: values.nome,
          data_inicio: values.data_inicio,
          data_fim: values.data_fim,
          objetivo: values.objetivo || null,
          descricao: values.descricao || null,
          oferta: values.oferta || null,
        })
        .eq("id", selectedCampaign.id);

      if (error) throw error;

      toast({
        title: "Campanha atualizada",
        description: "A campanha foi atualizada com sucesso!",
      });

      setIsEditing(false);
      setSelectedCampaign(null);
      window.location.reload();
    } catch (error) {
      console.error("Erro ao atualizar campanha:", error);
      toast({
        title: "Erro ao atualizar campanha",
        description: "Não foi possível atualizar a campanha. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCampaign = async (campaignId: number) => {
    try {
      const { error } = await supabase
        .from("campanhas_marketing")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;

      toast({
        title: "Campanha excluída",
        description: "A campanha foi excluída com sucesso!",
      });

      window.location.reload();
    } catch (error) {
      console.error("Erro ao excluir campanha:", error);
      toast({
        title: "Erro ao excluir campanha",
        description: "Não foi possível excluir a campanha. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="glass-card hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-3 text-neutral-dark">{month}</h3>
        <div className="space-y-2">
          {monthCampaigns.map(campaign => (
            <div key={campaign.id} className="relative">
              <div
                className="text-sm p-2 bg-primary/10 rounded-md hover:bg-primary/20 transition-colors cursor-pointer"
                onClick={() => handleEditClick(campaign)}
              >
                <p className="font-medium">{campaign.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(campaign.data_inicio), "dd/MM", { locale: ptBR })} - {format(new Date(campaign.data_fim), "dd/MM", { locale: ptBR })}
                </p>
                {campaign.descricao && (
                  <p className="text-xs mt-1 text-muted-foreground">{campaign.descricao}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCampaign(campaign.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog 
        open={isEditing} 
        onOpenChange={(open) => {
          if (!open) {
            setIsEditing(false);
            setSelectedCampaign(null);
          }
        }}
      >
        {selectedCampaign && (
          <CampaignForm
            onSubmit={handleEditSubmit}
            defaultValues={{
              nome: selectedCampaign.nome,
              data_inicio: selectedCampaign.data_inicio,
              data_fim: selectedCampaign.data_fim,
              objetivo: selectedCampaign.objetivo || "",
              descricao: selectedCampaign.descricao || "",
              oferta: selectedCampaign.oferta || "",
            }}
            isEditing={true}
          />
        )}
      </Dialog>
    </Card>
  );
};