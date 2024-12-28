import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const getDateTypeLabel = (type: CalendarDate["category"]) => {
  switch (type) {
    case "commemorative":
      return "Data Comemorativa";
    case "holiday":
      return "Feriado Nacional";
    case "optional":
      return "Ponto Facultativo";
    default:
      return "Data Comemorativa";
  }
};

const getDateTypeColor = (type: CalendarDate["category"]) => {
  switch (type) {
    case "commemorative":
      return "bg-blue-100 text-blue-800";
    case "holiday":
      return "bg-red-100 text-red-800";
    case "optional":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const addToGoogleCalendar = (date: CalendarDate) => {
  const eventDate = new Date(date.date + 'T00:00:00');
  
  // Format dates to YYYYMMDD format required by Google Calendar
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  const formattedDate = formatDate(eventDate);
  const baseUrl = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: date.title,
    dates: `${formattedDate}/${formattedDate}`,
    details: `${getDateTypeLabel(date.category)} - ${date.description}`,
  });

  window.open(`${baseUrl}?${params.toString()}`, '_blank');
};

export const CalendarCard = ({ date, index }: CalendarCardProps) => {
  const { toast } = useToast();
  const formattedDate = new Date(date.date + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC'
  });

  const handleAddToCalendar = () => {
    addToGoogleCalendar(date);
    toast({
      title: "Evento adicionado",
      description: "O evento foi aberto no Google Calendar",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="h-full bg-[#F1F0FB]">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDateTypeColor(date.category)}`}>
                {getDateTypeLabel(date.category)}
              </span>
              <h3 className="text-lg font-semibold mt-2">{date.title}</h3>
              <p className="text-sm text-neutral mt-1">{formattedDate}</p>
            </div>
            <Button
              variant="outline"
              className="w-full flex items-center gap-2"
              onClick={handleAddToCalendar}
            >
              <CalendarIcon className="h-4 w-4" />
              Adicionar ao Google Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};