import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/select-niche");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        switch (event) {
          case 'SIGNED_IN':
            if (session) {
              toast.success('Login realizado com sucesso!');
              navigate("/select-niche");
            } else {
              toast.error('Erro ao fazer login. Tente novamente.');
            }
            break;
          case 'SIGNED_OUT':
            toast.info('Você foi desconectado');
            break;
          case 'PASSWORD_RECOVERY':
            toast.info('Email de recuperação de senha enviado');
            break;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

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
          <Auth
            supabaseClient={supabase}
            view="sign_in"
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#9b87f5',
                    brandAccent: '#7d66f2',
                  },
                },
              },
              style: {
                input: {
                  borderRadius: '0.375rem',
                },
                message: {
                  borderRadius: '0.375rem',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                },
              },
            }}
            providers={[]}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Senha',
                  password_input_placeholder: 'Sua senha',
                  button_label: 'Entrar',
                  loading_button_label: 'Entrando...',
                  email_input_placeholder: 'Seu endereço de email',
                },
                forgotten_password: {
                  button_label: 'Esqueci minha senha',
                  loading_button_label: 'Enviando email...',
                  email_label: 'Email',
                  password_label: 'Nova senha',
                  email_input_placeholder: 'Seu endereço de email',
                },
              },
            }}
          />
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 mb-2">Ainda não tem uma conta?</p>
            <Button
              variant="outline"
              onClick={() => navigate("/signup")}
              className="w-full"
            >
              Criar conta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;