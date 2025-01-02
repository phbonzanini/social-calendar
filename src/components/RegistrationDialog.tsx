import { useState, useEffect } from "react";
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

interface UserData {
  name: string;
  email: string;
  phone: string;
  role: string;
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
  const [role, setRole] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved user data when component mounts
  useEffect(() => {
    const savedUserData = localStorage.getItem("userData");
    if (savedUserData) {
      const userData: UserData = JSON.parse(savedUserData);
      setName(userData.name);
      setEmail(userData.email);
      setPhone(userData.phone);
      setRole(userData.role);
    }
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setPhone(value);
  };

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
            telefone: Number(phone),
            cargo: role,
          },
        ]);

      if (error) throw error;

      // Save user data to localStorage after successful submission
      const userData: UserData = {
        name,
        email,
        phone,
        role,
      };
      localStorage.setItem("userData", JSON.stringify(userData));

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
              onChange={handlePhoneChange}
              className="w-full"
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>
          <div>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Selecione seu cargo" />
              </SelectTrigger>
              <SelectContent className="bg-white">
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