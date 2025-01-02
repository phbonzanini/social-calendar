import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Campaign {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  objetivo?: string;
  descricao?: string;
  data_comemorativa?: string;
}

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  data_fim: z.string().min(1, "Data de fim é obrigatória"),
  objetivo: z.string().optional(),
  descricao: z.string().optional(),
  data_comemorativa: z.string().optional(),
});

const Campaigns = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const selectedDates = location.state?.selectedDates || [];

  const { data: campaigns, isLoading, refetch } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanhas_marketing")
        .select("*")
        .order("data_inicio", { ascending: true });

      if (error) throw error;
      return data as Campaign[];
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      data_inicio: "",
      data_fim: "",
      objetivo: "",
      descricao: "",
      data_comemorativa: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { error } = await supabase.from("campanhas_marketing").insert([
        {
          nome: values.nome,
          data_inicio: values.data_inicio,
          data_fim: values.data_fim,
          objetivo: values.objetivo,
          descricao: values.descricao,
          data_comemorativa: values.data_comemorativa,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Campanha criada com sucesso!",
        description: "Sua campanha foi adicionada ao calendário.",
      });

      form.reset();
      refetch();
    } catch (error) {
      console.error("Erro ao criar campanha:", error);
      toast({
        title: "Erro ao criar campanha",
        description: "Não foi possível criar a campanha. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen p-6 bg-gradient-to-br from-primary-light via-white to-neutral-light"
    >
      <div className="fixed top-4 left-4 z-10">
        <Logo />
      </div>

      <div className="max-w-4xl mx-auto pt-16">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <h1 className="text-3xl font-bold text-neutral-dark">
              Gerenciar Campanhas
            </h1>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate("/calendar")}
                variant="outline"
                size="sm"
              >
                Voltar ao Calendário
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Campanha
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Campanha</DialogTitle>
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
                      <Button type="submit" className="w-full">
                        Criar Campanha
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <Button
                onClick={() => navigate("/final-calendar")}
                variant="outline"
                size="sm"
              >
                Ver Calendário Final
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <CardTitle>{campaign.nome}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Período: {format(new Date(campaign.data_inicio), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(campaign.data_fim), "dd/MM/yyyy", { locale: ptBR })}
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
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhuma campanha criada ainda. Clique em "Nova Campanha" para começar.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Campaigns;