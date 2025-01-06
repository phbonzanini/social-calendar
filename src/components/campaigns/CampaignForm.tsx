import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type CommemorativeDate = {
  data: string | null;
  descricao: string | null;
};

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  data_fim: z.string().min(1, "Data de fim é obrigatória"),
  objetivo: z.string().optional(),
  descricao: z.string().optional(),
  data_comemorativa: z.string().optional(),
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
      data_comemorativa: "",
    },
  });

  const { data: commemorativeDates } = useQuery<CommemorativeDate[]>({
    queryKey: ["commemorative-dates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("datas_2025")
        .select("*")
        .order("data", { ascending: true });

      if (error) throw error;

      const rawData = data as unknown as Tables<"datas_2025">[];
      
      return rawData.map(item => ({
        data: item.data,
        descricao: item.descrição
      }));
    },
  });

  useEffect(() => {
    if (defaultValues || initialData) {
      form.reset(defaultValues || initialData);
    }
  }, [defaultValues, initialData, form]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Campanha</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data_fim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Fim</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
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
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data_comemorativa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Comemorativa</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma data comemorativa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent 
                    position="item-aligned" 
                    className="max-h-[300px] bg-white border border-neutral-200 shadow-lg overflow-y-auto"
                    side="top"
                  >
                    {commemorativeDates?.map((date) => (
                      <SelectItem 
                        key={`${date.data}-${date.descricao}`} 
                        value={date.descricao || ""}
                      >
                        {date.data} - {date.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            {isEditing ? "Salvar Alterações" : "Criar Campanha"}
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
};