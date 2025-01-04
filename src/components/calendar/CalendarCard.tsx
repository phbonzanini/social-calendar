import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

interface CalendarDate {
  date: string;
  title: string;
  category: "commemorative" | "holiday" | "optional";
  description: string;
}

interface CalendarCardProps {
  date: CalendarDate;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

const getCategoryLabel = (category: string) => {
  switch (category.toLowerCase()) {
    case "data comemorativa":
    case "commemorative":
      return "Data Comemorativa";
    case "feriado nacional":
    case "holiday":
      return "Feriado Nacional";
    case "ponto facultativo":
    case "optional":
      return "Ponto Facultativo";
    default:
      return category;
  }
};

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case "data comemorativa":
    case "commemorative":
      return "bg-blue-100 text-blue-800";
    case "feriado nacional":
    case "holiday":
      return "bg-red-100 text-red-800";
    case "ponto facultativo":
    case "optional":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const CalendarCard = ({
  date,
  index,
  isSelected,
  onSelect,
}: CalendarCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        className={`relative cursor-pointer transition-all hover:shadow-md bg-white ${
          isSelected ? "ring-2 ring-primary" : ""
        }`}
        onClick={onSelect}
      >
        {isSelected && (
          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-4 w-4 text-white" />
          </div>
        )}
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {format(new Date(date.date), "dd 'de' MMMM", { locale: ptBR })}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(
                  date.category
                )}`}
              >
                {getCategoryLabel(date.category)}
              </span>
            </div>
            <h3 className="font-semibold">{date.title}</h3>
            <p className="text-sm text-muted-foreground">{date.description}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};