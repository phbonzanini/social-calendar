import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Calendar {
  id: number;
  nome: string;
  ano: number;
  created_at: string;
}

const Calendar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [newCalendarYear, setNewCalendarYear] = useState(2025);

  const { data: calendars, isLoading, refetch } = useQuery({
    queryKey: ["calendars"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("calendarios")
        .select("*")
        .order("ano", { ascending: true });

      if (error) throw error;
      return data as Calendar[];
    },
  });

  const handleCreateCalendar = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from("calendarios")
        .insert([
          {
            nome: newCalendarName,
            ano: newCalendarYear,
            id_user: session.session.user.id,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Calendário criado com sucesso!",
        description: "Seu novo calendário foi adicionado.",
      });

      setIsDialogOpen(false);
      setNewCalendarName("");
      refetch();
    } catch (error) {
      console.error("Erro ao criar calendário:", error);
      toast({
        title: "Erro ao criar calendário",
        description: "Não foi possível criar o calendário. Tente novamente.",
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

      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-neutral-dark">
              Calendários
            </h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Calendário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Calendário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Nome do Calendário
                    </label>
                    <Input
                      id="name"
                      value={newCalendarName}
                      onChange={(e) => setNewCalendarName(e.target.value)}
                      placeholder="Ex: Calendário de Marketing 2025"
                    />
                  </div>
                  <div>
                    <label htmlFor="year" className="block text-sm font-medium mb-1">
                      Ano
                    </label>
                    <Input
                      id="year"
                      type="number"
                      value={newCalendarYear}
                      onChange={(e) => setNewCalendarYear(Number(e.target.value))}
                    />
                  </div>
                  <Button
                    onClick={handleCreateCalendar}
                    className="w-full text-white"
                    disabled={!newCalendarName || !newCalendarYear}
                  >
                    Criar Calendário
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calendars?.map((calendar) => (
              <div
                key={calendar.id}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/calendar/${calendar.id}`)}
              >
                <h3 className="text-lg font-semibold mb-2">{calendar.nome}</h3>
                <p className="text-neutral-600">Ano: {calendar.ano}</p>
                <p className="text-sm text-neutral-400 mt-2">
                  Criado em: {new Date(calendar.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
            {(!calendars || calendars.length === 0) && (
              <div className="col-span-full text-center py-8 text-neutral-500">
                Nenhum calendário criado ainda.
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Calendar;