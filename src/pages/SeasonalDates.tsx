import { motion } from "framer-motion";
import { NicheSelector } from "@/components/NicheSelector";
import { Logo } from "@/components/Logo";

const SeasonalDates = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen p-6 bg-gradient-to-br from-primary-light via-white to-neutral-light"
    >
      <div className="fixed top-4 left-4 z-10">
        <Logo />
      </div>

      <div className="max-w-4xl mx-auto pt-16">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-dark mb-2">
            Datas Sazonais
          </h1>
          <p className="text-neutral-600">
            Selecione os nichos relevantes para seu negócio e descubra as datas comemorativas mais importantes.
          </p>
        </div>

        <div className="glass-card p-8 rounded-xl">
          <NicheSelector returnPath="/calendar" />
        </div>
      </div>
    </motion.div>
  );
};

export default SeasonalDates;