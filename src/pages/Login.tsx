import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";

const Login = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"sign_in" | "sign_up">("sign_in");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: Session | null) => {
        switch (event) {
          case 'SIGNED_UP':
            toast.success('Conta criada com sucesso!');
            navigate("/");
            break;
          case 'SIGNED_IN':
            toast.success('Login realizado com sucesso!');
            navigate("/");
            break;
          case 'SIGNED_OUT':
            toast.info('Você foi desconectado');
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
            {view === "sign_in" ? "Bem-vindo de volta" : "Crie sua conta"}
          </h2>
          <Auth
            supabaseClient={supabase}
            view={view}
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
                  password_input_placeholder: 'Senha (mínimo 6 caracteres)',
                  button_label: 'Entrar',
                  loading_button_label: 'Entrando...',
                  email_input_placeholder: 'Seu endereço de email',
                  link_text: 'Não tem uma conta? Cadastre-se',
                },
                sign_up: {
                  email_label: 'Email',
                  password_label: 'Senha',
                  password_input_placeholder: 'Senha (mínimo 6 caracteres)',
                  button_label: 'Criar conta',
                  loading_button_label: 'Criando conta...',
                  email_input_placeholder: 'Seu endereço de email',
                  link_text: 'Já tem uma conta? Entre',
                  confirmation_text: 'Confirme sua senha',
                  phone_label: 'Telefone',
                  phone_input_placeholder: 'Seu número de telefone',
                  name_label: 'Nome completo',
                  name_input_placeholder: 'Seu nome completo',
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