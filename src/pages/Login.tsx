import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";

const Login = () => {
  const navigate = useNavigate();

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
                  password_input_placeholder: 'Senha (mínimo 6 caracteres)',
                  button_label: 'Entrar',
                  loading_button_label: 'Entrando...',
                  email_input_placeholder: 'Seu endereço de email',
                  link_text: 'Já tem uma conta? Entre',
                  forgotten_password_label: 'Esqueceu sua senha?'
                },
                sign_up: {
                  email_label: 'Email',
                  password_label: 'Senha',
                  password_input_placeholder: 'Senha (mínimo 6 caracteres)',
                  button_label: 'Criar conta',
                  loading_button_label: 'Criando conta...',
                  email_input_placeholder: 'Seu endereço de email',
                  link_text: 'Não tem uma conta? Cadastre-se',
                  confirmation_text: 'Verifique seu email para confirmar o cadastro'
                },
                forgotten_password: {
                  email_label: 'Email',
                  password_label: 'Senha',
                  button_label: 'Enviar instruções',
                  loading_button_label: 'Enviando instruções...',
                  link_text: 'Esqueceu sua senha?',
                  confirmation_text: 'Verifique seu email para redefinir sua senha'
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