import { Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createCalendarPDF } from "@/utils/pdfUtils";

interface Campaign {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  objetivo?: string;
  descricao?: string;
  oferta?: string;
}

interface CalendarDownloadButtonsProps {
  campaigns: Campaign[];
  months: string[];
}

export const CalendarDownloadButtons = ({ campaigns, months }: CalendarDownloadButtonsProps) => {
  const { toast } = useToast();

  const downloadPDF = () => {
    const pdf = createCalendarPDF(campaigns, months);
    pdf.save("calendario-campanhas-2025.pdf");
    
    toast({
      title: "Download concluído",
      description: "O calendário foi baixado em formato PDF.",
    });
  };

  const downloadCSV = () => {
    const headers = [
      "Mês",
      "Campanha",
      "Data Início",
      "Data Fim",
      "Objetivo",
      "Descrição",
      "Oferta"
    ];
    
    const rows = months.map(month => {
      const monthCampaigns = campaigns?.filter(campaign => {
        const startDate = new Date(campaign.data_inicio);
        return startDate.getMonth() === months.indexOf(month) && startDate.getFullYear() === 2025;
      });

      if (!monthCampaigns?.length) return [];

      return monthCampaigns.map(campaign => [
        month,
        campaign.nome,
        format(new Date(campaign.data_inicio), "dd/MM/yyyy", { locale: ptBR }),
        format(new Date(campaign.data_fim), "dd/MM/yyyy", { locale: ptBR }),
        campaign.objetivo || "",
        campaign.descricao || "",
        campaign.oferta || ""
      ]);
    }).flat();

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "calendario-campanhas-2025.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download concluído",
      description: "O calendário foi baixado em formato CSV.",
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={downloadPDF}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Baixar PDF
      </Button>
      <Button
        onClick={downloadCSV}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <FileDown className="h-4 w-4" />
        Baixar CSV
      </Button>
    </div>
  );
};