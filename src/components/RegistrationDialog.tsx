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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface RegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNiches: string[];
}

const roles = [
  "Social media",
  "Analista de marketing",
  "Head/Gerente de marketing",
  "CMO",
  "Outros"
] as const;

export const RegistrationDialog = ({
  open,
  onOpenChange,
  selectedNiches,
}: RegistrationDialogProps) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !phone || !role) {
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
            cargo: role,
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
          <DialogTitle className="text-center">Para começarmos, conte um pouco sobre você...</DialogTitle>
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
          <div>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione seu cargo" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((roleOption) => (
                  <SelectItem key={roleOption} value={roleOption}>
                    {roleOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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