import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhaseAction } from "@/types/campaign-phase";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface PhaseActionsProps {
  phaseId: number;
  onActionAdded: () => void;
}

interface ActionFormValues {
  descricao: string;
  data_inicio: Date;
  data_fim: Date;
}

export const PhaseActions = ({ phaseId, onActionAdded }: PhaseActionsProps) => {
  const [actions, setActions] = useState<PhaseAction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<ActionFormValues>({
    defaultValues: {
      descricao: "",
      data_inicio: new Date(),
      data_fim: new Date(),
    },
  });

  const fetchActions = useCallback(async () => {
    const { data, error } = await supabase
      .from("acoes_fase")
      .select("*")
      .eq("id_fase", phaseId)
      .order("data_inicio", { ascending: true });

    if (error) {
      console.error("Error fetching actions:", error);
      return;
    }

    setActions(data);
  }, [phaseId]);

  const handleAddAction = async (values: ActionFormValues) => {
    try {
      const { error } = await supabase
        .from("acoes_fase")
        .insert([{
          id_fase: phaseId,
          descricao: values.descricao,
          data_inicio: values.data_inicio.toISOString().split('T')[0],
          data_fim: values.data_fim.toISOString().split('T')[0],
        }]);

      if (error) throw error;

      toast({
        title: "Ação adicionada com sucesso!",
        description: "A ação foi adicionada à fase.",
      });

      form.reset();
      setIsDialogOpen(false);
      await fetchActions();
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

      await fetchActions();
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
  }, [fetchActions]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Ações da Fase</h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Ação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Ação</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddAction)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição da Ação</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Descreva a ação a ser realizada" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_fim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Término</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Adicionar Ação
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {actions.map((action) => (
          <div
            key={action.id}
            className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium">{action.descricao}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(action.data_inicio), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                {format(new Date(action.data_fim), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteAction(action.id)}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
        {actions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma ação criada ainda.
          </p>
        )}
      </div>
    </div>
  );
};