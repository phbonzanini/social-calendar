import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhaseAction } from "@/types/campaign-phase";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PhaseActionsProps {
  phaseId: number;
  onActionAdded: () => void;
}

export const PhaseActions = ({ phaseId, onActionAdded }: PhaseActionsProps) => {
  const [actions, setActions] = useState<PhaseAction[]>([]);
  const [newAction, setNewAction] = useState("");
  const { toast } = useToast();

  const fetchActions = async () => {
    const { data, error } = await supabase
      .from("acoes_fase")
      .select("*")
      .eq("id_fase", phaseId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching actions:", error);
      return;
    }

    setActions(data);
  };

  const handleAddAction = async () => {
    if (!newAction.trim()) return;

    try {
      const { error } = await supabase
        .from("acoes_fase")
        .insert([{ id_fase: phaseId, descricao: newAction }]);

      if (error) throw error;

      toast({
        title: "Ação adicionada com sucesso!",
        description: "A ação foi adicionada à fase.",
      });

      setNewAction("");
      fetchActions();
      onActionAdded();
    } catch (error) {
      console.error("Error adding action:", error);
      toast({
        title: "Erro ao adicionar ação",
        description: "Não foi possível adicionar a ação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAction = async (actionId: number) => {
    try {
      const { error } = await supabase
        .from("acoes_fase")
        .delete()
        .eq("id", actionId);

      if (error) throw error;

      toast({
        title: "Ação excluída com sucesso!",
        description: "A ação foi removida da fase.",
      });

      fetchActions();
    } catch (error) {
      console.error("Error deleting action:", error);
      toast({
        title: "Erro ao excluir ação",
        description: "Não foi possível excluir a ação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchActions();
  }, [phaseId, onActionAdded]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Adicionar nova ação..."
          value={newAction}
          onChange={(e) => setNewAction(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAddAction()}
        />
        <Button size="sm" onClick={handleAddAction}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {actions.map((action) => (
          <div
            key={action.id}
            className="flex items-center justify-between bg-white p-2 rounded-md"
          >
            <span className="text-sm">{action.descricao}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteAction(action.id)}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};