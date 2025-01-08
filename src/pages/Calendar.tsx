import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Calendar {
  id: number;
  nome: string;
  ano: number;
  created_at: string;
}

export default function Calendar() {
  const [nome, setNome] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear());

  const { data: calendars, isLoading, refetch } = useQuery({
    queryKey: ["calendars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendarios")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Erro ao carregar calendários");
        throw error;
      }

      return data as Calendar[];
    },
  });

  const handleCreateCalendar = async () => {
    if (!nome || !ano) {
      toast.error("Preencha todos os campos");
      return;
    }

    const { error } = await supabase.from("calendarios").insert([
      {
        nome,
        ano,
      },
    ]);

    if (error) {
      if (error.code === "23505") {
        toast.error("Você já tem um calendário para este ano");
      } else {
        toast.error("Erro ao criar calendário");
      }
      return;
    }

    toast.success("Calendário criado com sucesso");
    setNome("");
    refetch();
  };

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-8">Calendários</h1>

      <div className="grid gap-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Criar novo calendário</h2>
          <div className="grid gap-4">
            <div>
              <Input
                placeholder="Nome do calendário"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Ano"
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
              />
            </div>
            <Button onClick={handleCreateCalendar}>Criar calendário</Button>
          </div>
        </Card>

        <div className="grid gap-4">
          <h2 className="text-lg font-semibold">Seus calendários</h2>
          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : calendars?.length === 0 ? (
            <p className="text-muted-foreground text-center">
              Você ainda não tem calendários
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {calendars?.map((calendar) => (
                <Card key={calendar.id} className="p-6">
                  <h3 className="font-semibold">{calendar.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    Ano: {calendar.ano}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}