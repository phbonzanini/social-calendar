import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const WelcomeScreen = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary-light via-white to-neutral-light"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center max-w-2xl"
      >
        <span className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full mb-6 inline-block">
          Planejamento Inteligente
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-neutral-dark mb-6">
          Social Calendar 2025
        </h1>
        <p className="text-lg text-neutral mb-8">
          Organize suas datas comemorativas e planeje suas campanhas de forma inteligente
        </p>
        <div className="flex flex-col items-center gap-2">
          <Button
            onClick={() => navigate("/select-niche")}
            className="bg-primary hover:bg-primary-dark text-white px-8 py-6 rounded-lg text-lg transition-all hover:shadow-lg"
          >
            Começar Agora
          </Button>
          <span className="text-xs italic text-neutral/70">100% gratuito</span>
        </div>
      </motion.div>
    </motion.div>
  );
};