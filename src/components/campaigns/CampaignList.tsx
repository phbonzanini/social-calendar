import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Campaign } from "@/types/campaign";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { CampaignForm } from "./CampaignForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CampaignListProps {
  campaigns: Campaign[] | undefined;
  isLoading: boolean;
}

export const CampaignList = ({ campaigns, isLoading }: CampaignListProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
          data_comemorativa: values.data_comemorativa || null,
        })
        .eq("id", selectedCampaign.id);

      if (error) throw error;

      toast({
        title: "Campanha atualizada com sucesso!",
        description: "As informações da campanha foram atualizadas.",
      });

      setIsEditDialogOpen(false);
      window.location.reload(); // Recarrega a página para mostrar as alterações
    } catch (error) {
      console.error("Erro ao atualizar campanha:", error);
      toast({
        title: "Erro ao atualizar campanha",
        description: "Não foi possível atualizar a campanha. Tente novamente.",
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
          <Card key={campaign.id} className="bg-neutral-light/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">{campaign.nome}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedCampaign(campaign);
                  setIsEditDialogOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Período: {format(new Date(campaign.data_inicio), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(new Date(campaign.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                </p>
                {campaign.objetivo && (
                  <p className="text-sm">
                    <strong>Objetivo:</strong> {campaign.objetivo}
                  </p>
                )}
                {campaign.descricao && (
                  <p className="text-sm">
                    <strong>Descrição:</strong> {campaign.descricao}
                  </p>
                )}
                {campaign.data_comemorativa && (
                  <p className="text-sm">
                    <strong>Data Comemorativa:</strong> {campaign.data_comemorativa}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Campanha</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <CampaignForm
              onSubmit={handleEdit}
              defaultValues={{
                nome: selectedCampaign.nome,
                data_inicio: selectedCampaign.data_inicio,
                data_fim: selectedCampaign.data_fim,
                objetivo: selectedCampaign.objetivo || "",
                descricao: selectedCampaign.descricao || "",
                data_comemorativa: selectedCampaign.data_comemorativa || "",
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};