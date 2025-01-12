import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhaseAction } from "@/types/campaign-phase";
import { Plus, Trash2, CalendarIcon, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface PhaseActionsProps {
  phaseId: number;
  onActionAdded: () => void;
  phaseStartDate: string;
  phaseEndDate: string;
}

interface ActionFormValues {
  descricao: string;
  data_inicio: Date;
  data_fim: Date;
}

export const PhaseActions = ({ phaseId, onActionAdded, phaseStartDate, phaseEndDate }: PhaseActionsProps) => {
  const [actions, setActions] = useState<PhaseAction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<PhaseAction | null>(null);
  const { toast } = useToast();
  const form = useForm<ActionFormValues>({
    defaultValues: {
      descricao: "",
      data_inicio: new Date(phaseStartDate),
      data_fim: new Date(phaseEndDate),
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

    setActions(data as PhaseAction[]);
  }, [phaseId]);

  const handleAddAction = async (values: ActionFormValues) => {
    const phaseStart = new Date(phaseStartDate);
    const phaseEnd = new Date(phaseEndDate);
    const actionStart = values.data_inicio;
    const actionEnd = values.data_fim;

    if (actionStart < phaseStart || actionEnd > phaseEnd) {
      toast({
        title: "Erro de validação",
        description: "As datas da ação devem estar dentro do período da fase.",
        variant: "destructive",
      });
      return;
    }

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

  const handleUpdateAction = async (actionId: number, values: Partial<ActionFormValues>) => {
    try {
      const { error } = await supabase
        .from("acoes_fase")
        .update({
          data_inicio: values.data_inicio?.toISOString().split('T')[0],
          data_fim: values.data_fim?.toISOString().split('T')[0],
        })
        .eq("id", actionId);

      if (error) throw error;

      toast({
        title: "Ação atualizada com sucesso!",
        description: "As datas da ação foram atualizadas.",
      });

      await fetchActions();
    } catch (error) {
      console.error("Error updating action:", error);
      toast({
        title: "Erro ao atualizar ação",
        description: "Não foi possível atualizar a ação. Tente novamente.",
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
          <DialogContent className="bg-white">
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
                                "w-full pl-3 text-left font-normal bg-white",
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
                        <PopoverContent className="w-auto p-0 bg-white" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(date);
                              }
                            }}
                            disabled={(date) =>
                              date < new Date(phaseStartDate) || date > new Date(phaseEndDate)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
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
                                "w-full pl-3 text-left font-normal bg-white",
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
                        <PopoverContent className="w-auto p-0 bg-white" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(date);
                              }
                            }}
                            disabled={(date) =>
                              date < new Date(phaseStartDate) || date > new Date(phaseEndDate)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
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
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {format(new Date(action.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(action.data_inicio)}
                      onSelect={(date) => {
                        if (date) {
                          handleUpdateAction(action.id, { data_inicio: date });
                        }
                      }}
                      disabled={(date) =>
                        date < new Date(phaseStartDate) || date > new Date(phaseEndDate)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-xs text-muted-foreground self-center">até</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {format(new Date(action.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(action.data_fim)}
                      onSelect={(date) => {
                        if (date) {
                          handleUpdateAction(action.id, { data_fim: date });
                        }
                      }}
                      disabled={(date) =>
                        date < new Date(phaseStartDate) || date > new Date(phaseEndDate)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
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