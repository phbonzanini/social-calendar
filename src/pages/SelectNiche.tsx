import { motion } from "framer-motion";
import { NicheSelector } from "@/components/NicheSelector";

const SelectNiche = () => {
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
        className="glass-card p-8 rounded-xl w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-white mb-2">
          Selecione seus Nichos
        </h2>
        <p className="text-neutral mb-6">
          Escolha um ou mais nichos para ver datas relevantes para seu negócio
        </p>
        <NicheSelector />
      </motion.div>
    </motion.div>
  );
};

export default SelectNiche;