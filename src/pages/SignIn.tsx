import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [showConfirmationAlert, setShowConfirmationAlert] = useState(false);

  // Adiciona verificação de autenticação ao carregar o componente
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/select-niche");
      }
    };
    
    checkAuth();

    // Monitora mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/select-niche");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleResendConfirmation = async () => {
    if (isResendingEmail) {
      return;
    }

    try {
      setIsResendingEmail(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      toast.success("Email de confirmação reenviado com sucesso!");
      
      // Inicia o contador de 60 segundos
      setTimeout(() => {
        setIsResendingEmail(false);
      }, 60000);
      
    } catch (error: any) {
      toast.error(error.message || "Erro ao reenviar email de confirmação");
      setIsResendingEmail(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === "Email not confirmed") {
          setShowConfirmationAlert(true);
          toast.error(
            "Email não confirmado",
            {
              description: "Clique no botão abaixo para reenviar o email de confirmação",
              action: {
                label: isResendingEmail ? "Aguarde..." : "Reenviar",
                onClick: handleResendConfirmation,
              },
            }
          );
          return;
        }
        
        if (error.message === "Invalid login credentials") {
          toast.error("Email ou senha inválidos");
          return;
        }
        
        throw error;
      }
      
      toast.success("Login realizado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary-light via-white to-neutral-light">
      <div className="mb-8">
        <Logo />
      </div>
      
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Bem-vindo de volta!</h1>
          <p className="text-neutral">Faça login para continuar</p>
        </div>

        {showConfirmationAlert && (
          <Alert>
            <AlertDescription>
              Por favor, confirme seu email para continuar. 
              {isResendingEmail ? (
                <span className="block mt-2 text-sm text-neutral">
                  Aguarde 60 segundos antes de solicitar um novo email...
                </span>
              ) : (
                <Button
                  variant="link"
                  className="ml-2"
                  onClick={handleResendConfirmation}
                  disabled={isResendingEmail}
                >
                  Reenviar email de confirmação
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSignIn} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="link"
              onClick={() => navigate("/forgot-password")}
              className="text-sm"
            >
              Esqueceu a senha?
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={() => navigate("/signup")}
              className="text-sm"
            >
              Criar conta
            </Button>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;