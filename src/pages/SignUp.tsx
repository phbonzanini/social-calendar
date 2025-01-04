import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const SignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRateLimited) {
      toast.error("Por favor, aguarde alguns segundos antes de tentar novamente");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
          },
        },
      });

      if (error) {
        if (error.message.includes("rate_limit") || error.status === 429) {
          setIsRateLimited(true);
          setTimeout(() => {
            setIsRateLimited(false);
          }, 60000); // Reset after 60 seconds
          throw new Error("Por favor, aguarde alguns segundos antes de tentar novamente");
        }
        throw error;
      }

      toast.success("Conta criada com sucesso!");
      navigate("/signin");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
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
            Crie sua conta
          </h2>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Seu nome completo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Seu endereço de email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Seu número de telefone"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Senha (mínimo 6 caracteres)"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirme sua senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Digite sua senha novamente"
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || isRateLimited}
            >
              {loading ? "Criando conta..." : isRateLimited ? "Aguarde..." : "Criar conta"}
            </Button>
          </form>
          <p className="text-center mt-4 text-sm">
            Já tem uma conta?{" "}
            <Link to="/signin" className="text-primary hover:underline">
              Entre
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;