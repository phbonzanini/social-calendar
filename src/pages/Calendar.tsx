import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileDown, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { niches } from "@/components/NicheSelector";
import jsPDF from 'jspdf';

interface CalendarDate {
  date: string;
  title: string;
  category: "commemorative" | "holiday" | "optional";
  description: string;
}

const fetchDatesForNiches = async (niches: string[]): Promise<CalendarDate[]> => {
  if (!niches || niches.length === 0) {
    throw new Error("Nenhum nicho selecionado");
  }

  console.log('Buscando datas para os nichos:', niches);
  
  try {
    const { data: gptResponse, error: gptError } = await supabase.functions.invoke('search-dates', {
      body: { niches },
    });

    if (gptError) {
      console.error('Erro na busca com GPT:', gptError);
      throw gptError;
    }

    console.log('Resposta da busca com GPT:', gptResponse);

    if (gptResponse?.dates && gptResponse.dates.length > 0) {
      return gptResponse.dates.map(item => ({
        date: item.data,
        title: item.descrição,
        category: item.tipo as "commemorative" | "holiday" | "optional",
        description: item.descrição
      }));
    }

    console.log('Nenhuma data encontrada via GPT, usando busca padrão');
    
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('dastas_2025')
      .select('*')
      .overlaps('niches', niches)
      .order('data');

    if (fallbackError) {
      console.error('Erro na busca padrão:', fallbackError);
      throw fallbackError;
    }

    if (!fallbackData || fallbackData.length === 0) {
      console.log('Nenhuma data encontrada na busca padrão');
      return [];
    }

    console.log('Datas encontradas na busca padrão:', fallbackData.length);

    return fallbackData.map(item => ({
      date: item.data,
      title: item.descrição,
      category: item.tipo as "commemorative" | "holiday" | "optional",
      description: item.descrição
    }));
  } catch (error) {
    console.error('Erro ao buscar datas:', error);
    throw error;
  }
};

const Calendar = () => {
  const location = useLocation();
  const { toast } = useToast();
  const selectedNiches = location.state?.selectedNiches || [];

  const { data: dates, isLoading, error } = useQuery({
    queryKey: ["calendar-dates", selectedNiches],
    queryFn: () => fetchDatesForNiches(selectedNiches),
    meta: {
      onError: () => {
        toast({
          title: "Erro ao carregar datas",
          description: "Não foi possível carregar as datas do calendário. Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    }
  });

  const getNicheLabel = (value: string) => {
    const niche = niches.find(n => n.value === value);
    return niche ? niche.label : value;
  };

  const getDateTypeLabel = (category: string) => {
    switch (category) {
      case 'commemorative':
        return 'Data Comemorativa';
      case 'holiday':
        return 'Feriado Nacional';
      case 'optional':
        return 'Ponto Facultativo';
      default:
        return '';
    }
  };

  const exportToPDF = () => {
    if (!dates || dates.length === 0) return;

    const pdf = new jsPDF();
    let yPosition = 20;

    // Add title
    pdf.setFontSize(16);
    pdf.text('Calendário Personalizado', 20, yPosition);
    yPosition += 10;

    // Add selected niches
    pdf.setFontSize(12);
    const nichesText = selectedNiches.map(niche => getNicheLabel(niche)).join(', ');
    pdf.text(`Nichos selecionados: ${nichesText}`, 20, yPosition);
    yPosition += 15;

    // Add dates
    pdf.setFontSize(10);
    dates.forEach((date) => {
      const dateStr = new Date(date.date).toLocaleDateString('pt-BR');
      const typeStr = getDateTypeLabel(date.category);
      
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.text(`${dateStr} - ${typeStr}`, 20, yPosition);
      yPosition += 7;
      pdf.text(date.title, 30, yPosition);
      yPosition += 10;
    });

    pdf.save('calendario-personalizado.pdf');
    
    toast({
      title: "PDF gerado com sucesso",
      description: "O arquivo foi baixado para o seu computador.",
    });
  };

  const exportToCSV = () => {
    if (!dates || dates.length === 0) return;

    const headers = ['Data', 'Tipo', 'Descrição'];
    const csvContent = dates.map(date => {
      const dateStr = new Date(date.date).toLocaleDateString('pt-BR');
      const typeStr = getDateTypeLabel(date.category);
      return `${dateStr},"${typeStr}","${date.title}"`;
    });

    const csv = [headers.join(','), ...csvContent].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'calendario-personalizado.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV gerado com sucesso",
      description: "O arquivo foi baixado para o seu computador.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Erro ao carregar o calendário. Tente novamente.</p>
      </div>
    );
  }

  if (!dates || dates.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-dark">Nenhuma data encontrada para os nichos selecionados.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6 bg-gradient-to-br from-primary-light via-white to-neutral-light"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-dark mb-2">
              Seu Calendário Personalizado
            </h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedNiches.map((niche: string) => (
                <span
                  key={niche}
                  className="inline-block px-3 py-1 bg-primary/10 text-primary-dark rounded-full text-sm"
                >
                  {getNicheLabel(niche)}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={exportToPDF}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              PDF
            </Button>
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dates.map((date, index) => (
            <motion.div
              key={`${date.date}-${index}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {date.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {new Date(date.date).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="mb-2">
                    {date.category !== 'optional' && (
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        date.category === 'commemorative' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getDateTypeLabel(date.category)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Calendar;