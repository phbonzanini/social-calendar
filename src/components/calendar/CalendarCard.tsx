import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

interface CalendarDate {
  date: string;
  title: string;
  category: "commemorative" | "holiday" | "optional";
  description: string;
}

interface CalendarCardProps {
  date: CalendarDate;
  index: number;
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

const addToGoogleCalendar = (date: CalendarDate) => {
  const eventDate = new Date(date.date);
  const endDate = new Date(eventDate);
  endDate.setDate(endDate.getDate() + 1);

  // Format dates to YYYYMMDD format required by Google Calendar
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: date.title,
    dates: `${formatDate(eventDate)}/${formatDate(endDate)}`,
    details: `${getDateTypeLabel(date.category)} - ${date.description}`,
  });

  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
};

export const CalendarCard = ({ date, index }: CalendarCardProps) => {
  const { toast } = useToast();

  const handleAddToCalendar = () => {
    addToGoogleCalendar(date);
    toast({
      title: "Adicionando ao Google Calendar",
      description: "Uma nova janela foi aberta para adicionar o evento.",
    });
  };

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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddToCalendar}
              className="w-full mt-2 text-xs text-neutral-dark hover:text-primary hover:bg-primary/10"
            >
              <CalendarPlus className="h-4 w-4 mr-1" />
              Adicionar ao Google Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};