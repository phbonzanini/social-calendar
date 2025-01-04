import { useNavigate } from "react-router-dom";
import { LogOut, Settings, User } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export const Navbar = () => {
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      toast.success("Você saiu com sucesso");
      navigate("/login");
    }
  };

  const handlePasswordReset = async () => {
    if (isResetting) {
      toast.error("Aguarde 60 segundos antes de solicitar novamente");
      return;
    }

    setIsResetting(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      toast.error("Erro ao identificar seu email");
      setIsResetting(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      if (error.message.includes("rate_limit")) {
        toast.error("Aguarde alguns segundos antes de tentar novamente");
      } else {
        toast.error("Erro ao enviar email de redefinição de senha");
      }
    } else {
      toast.success("Email de redefinição de senha enviado");
    }

    // Set a timeout to re-enable the button after 60 seconds
    setTimeout(() => {
      setIsResetting(false);
    }, 60000);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent"
            onClick={() => navigate("/")}
          >
            <Logo />
          </Button>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/calendar")}
              >
                Calendário
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/campaigns")}
              >
                Campanhas
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/final-calendar")}
              >
                Calendário Final
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  onClick={handlePasswordReset}
                  disabled={isResetting}
                  className={isResetting ? "opacity-50 cursor-not-allowed" : ""}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {isResetting ? "Aguarde..." : "Redefinir Senha"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};