import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  data_fim: z.string().min(1, "Data de fim é obrigatória"),
  objetivo: z.string().optional(),
  descricao: z.string().optional(),
  oferta: z.string().optional(),
  big_idea: z.string().min(1, "Big Idea é obrigatória"),
});

type FormValues = z.infer<typeof formSchema>;

interface CampaignFormProps {
  onSubmit: (values: FormValues) => Promise<void>;
  defaultValues?: FormValues;
  initialData?: FormValues;
  isEditing?: boolean;
}

export const CampaignForm = ({ onSubmit, defaultValues, initialData, isEditing = false }: CampaignFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || initialData || {
      nome: "",
      data_inicio: "",
      data_fim: "",
      objetivo: "",
      descricao: "",
      oferta: "",
      big_idea: "",
    },
  });

  useEffect(() => {
    if (defaultValues || initialData) {
      form.reset(defaultValues || initialData);
    }
  }, [defaultValues, initialData, form]);

  return (
    <DialogContent className="max-h-[85vh] p-0">
      <DialogHeader className="p-6 pb-0">
        <DialogTitle>{isEditing ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
        <DialogDescription>
          Preencha os detalhes da sua campanha. Campos com * são obrigatórios.
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="h-[calc(85vh-120px)] px-6 pb-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Campanha *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="big_idea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Big Idea (Tese Central) *</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Digite a tese central da campanha" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="data_inicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Início *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="data_fim"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Fim *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="objetivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="oferta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Oferta</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: 20% de desconto" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              {isEditing ? "Salvar Alterações" : "Criar Campanha"}
            </Button>
          </form>
        </Form>
      </ScrollArea>
    </DialogContent>
  );
};