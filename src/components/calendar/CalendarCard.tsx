import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card className="h-full hover:shadow-lg transition-shadow bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">{date.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            {new Date(date.date).toLocaleDateString("pt-BR")}
          </p>
          <div className="mb-2">
            {date.category !== "optional" && (
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs ${getDateTypeStyle(
                  date.category
                )}`}
              >
                {getDateTypeLabel(date.category)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};