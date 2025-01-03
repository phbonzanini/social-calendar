import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session: Session | null) => {
        if (event === 'SIGNED_UP') {
          toast.success('Conta criada com sucesso!');
        }
        if (event === 'SIGNED_IN') {
          toast.success('Login realizado com sucesso!');
        }
        if (session) {
          navigate("/");
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
                  password_input_placeholder: 'Mínimo de 6 caracteres',
                  button_label: 'Entrar',
                  loading_button_label: 'Entrando...',
                },
                sign_up: {
                  email_label: 'Email',
                  password_label: 'Senha',
                  password_input_placeholder: 'Mínimo de 6 caracteres',
                  button_label: 'Cadastrar',
                  loading_button_label: 'Cadastrando...',
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;