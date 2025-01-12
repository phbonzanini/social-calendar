import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Campaign } from "@/types/campaign";
import { CampaignPhase } from "@/types/campaign-phase";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { PhaseForm } from "./PhaseForm";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PhaseActions } from "./PhaseActions";

interface CampaignCardProps {
  campaign: Campaign;
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
  showActions?: boolean;
}

export const CampaignCard = ({ campaign, onEdit, onDelete, showActions = true }: CampaignCardProps) => {
  const [phases, setPhases] = useState<CampaignPhase[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<CampaignPhase | null>(null);
  const [isEditPhaseDialogOpen, setIsEditPhaseDialogOpen] = useState(false);
  const [isNewPhaseDialogOpen, setIsNewPhaseDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPhases();
  }, [campaign.id]);

  const fetchPhases = async () => {
    const { data, error } = await supabase
      .from("fases_campanha")
      .select("*")
      .eq("id_campanha", campaign.id)
      .order("data_inicio", { ascending: true });

    if (error) {
      console.error("Error fetching phases:", error);
      return;
    }

    setPhases(data);
  };

  const handleCreatePhase = async (values: Omit<CampaignPhase, "id" | "id_campanha" | "created_at">) => {
    try {
      const { error } = await supabase
        .from("fases_campanha")
        .insert([{ ...values, id_campanha: campaign.id }]);

      if (error) throw error;

      toast({
        title: "Fase criada com sucesso!",
        description: "A fase foi adicionada à campanha.",
      });

      setIsNewPhaseDialogOpen(false);
      fetchPhases();
    } catch (error) {
      console.error("Error creating phase:", error);
      toast({
        title: "Erro ao criar fase",
        description: "Não foi possível criar a fase. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleEditPhase = async (values: Omit<CampaignPhase, "id" | "id_campanha" | "created_at">) => {
    if (!selectedPhase) return;

    try {
      const { error } = await supabase
        .from("fases_campanha")
        .update({
          nome: values.nome,
          data_inicio: values.data_inicio,
          data_fim: values.data_fim,
          objetivo: values.objetivo || null,
          descricao: values.descricao || null,
        })
        .eq("id", selectedPhase.id);

      if (error) throw error;

      toast({
        title: "Fase atualizada com sucesso!",
        description: "As informações da fase foram atualizadas.",
      });

      setIsEditPhaseDialogOpen(false);
      fetchPhases();
    } catch (error) {
      console.error("Error updating phase:", error);
      toast({
        title: "Erro ao atualizar fase",
        description: "Não foi possível atualizar a fase. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePhase = async (phase: CampaignPhase) => {
    try {
      const { error } = await supabase
        .from("fases_campanha")
        .delete()
        .eq("id", phase.id);

      if (error) throw error;

      toast({
        title: "Fase excluída com sucesso!",
        description: "A fase foi removida da campanha.",
      });

      fetchPhases();
    } catch (error) {
      console.error("Error deleting phase:", error);
      toast({
        title: "Erro ao excluir fase",
        description: "Não foi possível excluir a fase. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-neutral-light/50 backdrop-blur-sm max-h-[80vh] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">{campaign.nome}</CardTitle>
        {showActions && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(campaign)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(campaign)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
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
              {campaign.oferta && (
                <p className="text-sm">
                  <strong>Oferta:</strong> {campaign.oferta}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Fases da Campanha</h3>
                <Dialog open={isNewPhaseDialogOpen} onOpenChange={setIsNewPhaseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Nova Fase
                    </Button>
                  </DialogTrigger>
                  <PhaseForm 
                    campaignId={campaign.id} 
                    onSubmit={handleCreatePhase}
                    campaignStartDate={campaign.data_inicio}
                    campaignEndDate={campaign.data_fim}
                  />
                </Dialog>
              </div>

              <div className="space-y-3">
                {phases.map((phase) => (
                  <Card key={phase.id} className="bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                      <CardTitle className="text-base font-semibold">{phase.nome}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPhase(phase);
                            setIsEditPhaseDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePhase(phase)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="space-y-3">
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            {format(new Date(phase.data_inicio), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                            {format(new Date(phase.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          {phase.objetivo && (
                            <p>
                              <strong>Objetivo:</strong> {phase.objetivo}
                            </p>
                          )}
                          {phase.descricao && (
                            <p>
                              <strong>Descrição:</strong> {phase.descricao}
                            </p>
                          )}
                        </div>

<PhaseActions 
  phaseId={phase.id} 
  onActionAdded={fetchPhases} 
  phaseStartDate={phase.data_inicio}
  phaseEndDate={phase.data_fim}
/>

                      </div>
                    </CardContent>
                  </Card>
                ))}
                {phases.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma fase criada ainda. Clique em "Nova Fase" para começar.
                  </p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>

      <Dialog open={isEditPhaseDialogOpen} onOpenChange={setIsEditPhaseDialogOpen}>
        {selectedPhase && (
          <PhaseForm
            campaignId={campaign.id}
            onSubmit={handleEditPhase}
            defaultValues={{
              nome: selectedPhase.nome,
              data_inicio: selectedPhase.data_inicio,
              data_fim: selectedPhase.data_fim,
              objetivo: selectedPhase.objetivo || "",
              descricao: selectedPhase.descricao || "",
            }}
            isEditing={true}
            campaignStartDate={campaign.data_inicio}
            campaignEndDate={campaign.data_fim}
          />
        )}
      </Dialog>
    </Card>
  );
};
