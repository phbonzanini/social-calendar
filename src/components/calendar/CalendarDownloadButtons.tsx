import { Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";

interface Campaign {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  objetivo?: string;
  descricao?: string;
  data_comemorativa?: string;
}

interface CalendarDownloadButtonsProps {
  campaigns: Campaign[];
  months: string[];
}

export const CalendarDownloadButtons = ({ campaigns, months }: CalendarDownloadButtonsProps) => {
  const { toast } = useToast();

  const downloadPDF = () => {
    const pdf = new jsPDF();
    let yPosition = 20;

    // Set background color
    pdf.setFillColor(155, 135, 245, 0.1); // Light purple background
    pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, "F");

    // Add header
    pdf.setFontSize(24);
    pdf.setTextColor(34, 34, 34); // Dark gray for better contrast
    pdf.text("Calendário de Campanhas 2025", 20, yPosition);
    yPosition += 20;

    months.forEach((month, monthIndex) => {
      const monthCampaigns = campaigns?.filter(campaign => {
        const startDate = new Date(campaign.data_inicio);
        return startDate.getMonth() === monthIndex && startDate.getFullYear() === 2025;
      });

      if (monthCampaigns && monthCampaigns.length > 0) {
        // Add month header with purple background
        pdf.setFillColor(155, 135, 245); // Primary purple
        pdf.rect(15, yPosition - 5, 180, 10, "F");
        
        pdf.setFontSize(16);
        pdf.setTextColor(255, 255, 255); // White text for month
        pdf.text(month, 20, yPosition);
        yPosition += 15;

        pdf.setFontSize(12);
        pdf.setTextColor(34, 34, 34); // Dark gray for content
        monthCampaigns.forEach(campaign => {
          if (yPosition > 270) {
            pdf.addPage();
            // Add background to new page
            pdf.setFillColor(155, 135, 245, 0.1);
            pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, "F");
            yPosition = 20;
          }

          // Add campaign card with light background
          pdf.setFillColor(255, 255, 255);
          pdf.roundedRect(25, yPosition - 5, 160, 35, 3, 3, "F");

          pdf.setFontSize(14);
          pdf.setTextColor(155, 135, 245); // Primary purple for campaign name
          pdf.text(`${campaign.nome}`, 30, yPosition);
          yPosition += 7;

          pdf.setFontSize(11);
          pdf.setTextColor(142, 145, 150); // Neutral gray for details
          pdf.text(
            `${format(new Date(campaign.data_inicio), "dd/MM", { locale: ptBR })} - ${format(new Date(campaign.data_fim), "dd/MM", { locale: ptBR })}`,
            30,
            yPosition
          );
          yPosition += 7;

          if (campaign.objetivo) {
            pdf.text(`Objetivo: ${campaign.objetivo}`, 30, yPosition);
            yPosition += 7;
          }

          if (campaign.descricao) {
            pdf.text(`Descrição: ${campaign.descricao}`, 30, yPosition);
            yPosition += 7;
          }

          if (campaign.data_comemorativa) {
            pdf.text(`Data Comemorativa: ${campaign.data_comemorativa}`, 30, yPosition);
            yPosition += 7;
          }

          yPosition += 10; // Extra space between campaigns
        });
      }
    });

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
      "Data Comemorativa"
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
        campaign.data_comemorativa || ""
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