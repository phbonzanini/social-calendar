import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface CalendarCardProps {
  date: CalendarDate;
  index: number;
}

interface CalendarDate {
  date: string;
  title: string;
  category: "commemorative" | "holiday" | "optional";
  description: string;
}

const getDateTypeLabel = (category: string) => {
  switch (category) {
    case "commemorative":
      return "Data Comemorativa";
    case "holiday":
      return "Feriado Nacional";
    case "optional":
      return "Ponto Facultativo";
    default:
      return "";
  }
};

const getDateTypeStyle = (category: string) => {
  switch (category) {
    case "commemorative":
      return "bg-blue-100 text-blue-800";
    case "holiday":
      return "bg-red-100 text-red-800";
    case "optional":
      return "bg-gray-100 text-gray-800";
    default:
      return "";
  }
};

export const CalendarCard = ({ date, index }: CalendarCardProps) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="hover:shadow-md transition-shadow bg-white/90 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-neutral-dark">
              {date.title}
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-neutral">
                {new Date(date.date).toLocaleDateString("pt-BR")}
              </span>
              {date.category !== "optional" && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${getDateTypeStyle(
                    date.category
                  )}`}
                >
                  {getDateTypeLabel(date.category)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};