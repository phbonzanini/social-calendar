import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PhaseFormProps {
  campaignId: number;
  onSubmit: (values: FormValues) => Promise<void>;
  defaultValues?: FormValues;
  isEditing?: boolean;
  campaignStartDate: string;
  campaignEndDate: string;
}

const createFormSchema = (campaignStartDate: string, campaignEndDate: string) => {
  return z.object({
    nome: z.string().min(1, "Nome é obrigatório"),
    data_inicio: z.string()
      .min(1, "Data de início é obrigatória")
      .refine((date) => {
        const phaseStart = new Date(date);
        const campaignStart = new Date(campaignStartDate);
        const campaignEnd = new Date(campaignEndDate);
        return phaseStart >= campaignStart && phaseStart <= campaignEnd;
      }, "A data de início deve estar dentro do período da campanha"),
    data_fim: z.string()
      .min(1, "Data de fim é obrigatória")
      .refine((date) => {
        const phaseEnd = new Date(date);
        const campaignStart = new Date(campaignStartDate);
        const campaignEnd = new Date(campaignEndDate);
        return phaseEnd >= campaignStart && phaseEnd <= campaignEnd;
      }, "A data de fim deve estar dentro do período da campanha"),
    objetivo: z.string().optional(),
    descricao: z.string().optional(),
  }).refine((data) => {
    const start = new Date(data.data_inicio);
    const end = new Date(data.data_fim);
    return start <= end;
  }, {
    message: "A data de fim deve ser igual ou posterior à data de início",
    path: ["data_fim"],
  });
};

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

export const PhaseForm = ({ 
  campaignId, 
  onSubmit, 
  defaultValues, 
  isEditing = false,
  campaignStartDate,
  campaignEndDate,
}: PhaseFormProps) => {
  const formSchema = createFormSchema(campaignStartDate, campaignEndDate);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      nome: "",
      data_inicio: "",
      data_fim: "",
      objetivo: "",
      descricao: "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    // Ensure dates are in YYYY-MM-DD format without timezone offset
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    const formattedValues = {
      ...values,
      data_inicio: formatDate(values.data_inicio),
      data_fim: formatDate(values.data_fim),
    };

    await onSubmit(formattedValues);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar Fase" : "Nova Fase"}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Fase</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>Data de Início</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field}
                    min={campaignStartDate}
                    max={campaignEndDate}
                  />
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
                <FormLabel>Data de Fim</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field}
                    min={campaignStartDate}
                    max={campaignEndDate}
                  />
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
          <Button type="submit" className="w-full">
            {isEditing ? "Salvar Alterações" : "Criar Fase"}
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
};