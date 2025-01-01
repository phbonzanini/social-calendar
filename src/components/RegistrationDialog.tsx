import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface RegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNiches: string[];
}

export const RegistrationDialog = ({
  open,
  onOpenChange,
  selectedNiches,
}: RegistrationDialogProps) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !phone) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from("cadastros")
        .insert([
          {
            nome: name,
            email: email,
            telefone: Number(phone.replace(/\D/g, "")), // Remove non-numeric characters
          },
        ]);

      if (error) throw error;

      navigate("/calendar", { 
        state: { 
          selectedNiches: selectedNiches.map(niche => niche.trim()) 
        } 
      });
    } catch (error) {
      console.error("Error saving registration:", error);
      toast.error("Erro ao salvar cadastro. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Complete seu cadastro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Input
              type="tel"
              placeholder="Telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full"
            />
          </div>
          <p className="text-sm text-neutral">
            Ao clicar em prosseguir, você concorda com nossos termos de uso.
          </p>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processando..." : "Prosseguir"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};