import { Loader2 } from "lucide-react";
import { Campaign } from "@/types/campaign";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CampaignCard } from "./CampaignCard";
import { EditCampaignDialog } from "./EditCampaignDialog";
import { DeleteCampaignDialog } from "./DeleteCampaignDialog";

interface CampaignListProps {
  campaigns: Campaign[] | undefined;
  isLoading: boolean;
}

export const CampaignList = ({ campaigns, isLoading }: CampaignListProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const { toast } = useToast();

  const handleEdit = async (values: Omit<Campaign, "id">) => {
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
        title: "Campanha atualizada com sucesso!",
        description: "As informações da campanha foram atualizadas.",
      });

      setIsEditDialogOpen(false);
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

  const handleDelete = async (campaignId: number) => {
    try {
      const { error } = await supabase
        .from("campanhas_marketing")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;

      toast({
        title: "Campanha excluída com sucesso!",
        description: "A campanha foi removida do calendário.",
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaigns?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Nenhuma campanha criada ainda. Clique em "Nova Campanha" para começar.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onEdit={(campaign) => {
              setSelectedCampaign(campaign);
              setIsEditDialogOpen(true);
            }}
            onDelete={(campaign) => {
              setSelectedCampaign(campaign);
              setIsDeleteDialogOpen(true);
            }}
          />
        ))}
      </div>

      <EditCampaignDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        campaign={selectedCampaign}
        onSubmit={handleEdit}
      />

      <DeleteCampaignDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => {
          if (selectedCampaign) {
            handleDelete(selectedCampaign.id);
            setIsDeleteDialogOpen(false);
          }
        }}
      />
    </>
  );
};