import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
        navigate("/");
      }
    };
    
    checkAuth();

    // Monitora mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleResendConfirmation = async () => {
    if (isResendingEmail) {
      toast.error("Aguarde 60 segundos antes de solicitar novamente");
      return;
    }

    setIsResendingEmail(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      
      if (error) {
        if (error.message.includes("rate limit")) {
          toast.error("Aguarde alguns minutos antes de solicitar um novo email");
        } else {
          toast.error("Erro ao reenviar email de confirmação");
        }
        return;
      }
      
      toast.success("Email de confirmação reenviado com sucesso");
      setShowConfirmationAlert(true);
    } finally {
      setTimeout(() => {
        setIsResendingEmail(false);
      }, 60000);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowConfirmationAlert(false);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setShowConfirmationAlert(true);
          toast.error(
            "Email não confirmado. Clique no botão abaixo para reenviar o email de confirmação.",
            {
              action: {
                label: "Reenviar",
                onClick: handleResendConfirmation,
              },
              duration: 10000,
            }
          );
        } else if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos");
        } else {
          throw error;
        }
        return;
      }
      
      toast.success("Login realizado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-white to-neutral-light p-6">
      <div className="fixed top-4 left-4">
        <Logo />
      </div>
      <div className="max-w-md mx-auto pt-24">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold text-center mb-6">
            Bem-vindo de volta
          </h2>
          {showConfirmationAlert && (
            <Alert className="mb-6">
              <AlertDescription>
                Por favor, verifique seu email para confirmar sua conta. 
                Se você não recebeu o email, clique em "Reenviar" acima.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu endereço de email"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || isResendingEmail}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="text-center mt-4 text-sm">
            Não tem uma conta?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;