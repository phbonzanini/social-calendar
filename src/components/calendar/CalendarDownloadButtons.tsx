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
    // Create landscape PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
    });
    
    // Set initial position for the grid
    let currentX = 10;
    let currentY = 20;
    const columnWidth = 90;
    const rowHeight = 65;
    const margin = 5;

    // Set background color
    pdf.setFillColor(251, 247, 255); // Very light purple background
    pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, "F");

    // Add title
    pdf.setFontSize(24);
    pdf.setTextColor(155, 135, 245); // Primary purple
    pdf.text("Calendário de Campanhas 2025", pdf.internal.pageSize.width / 2, 15, { align: "center" });

    // Create a grid of months (4x3)
    months.forEach((month, monthIndex) => {
      if (monthIndex > 0 && monthIndex % 3 === 0) {
        currentY += rowHeight + margin;
        currentX = 10;
      }

      // Add month card with white background
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(currentX, currentY, columnWidth, rowHeight, 3, 3, "F");

      // Add month header with purple background
      pdf.setFillColor(155, 135, 245);
      pdf.roundedRect(currentX, currentY, columnWidth, 8, 3, 3, "F");

      // Month name
      pdf.setFontSize(12);
      pdf.setTextColor(255, 255, 255);
      pdf.text(month, currentX + 5, currentY + 6);

      // Get campaigns for this month
      const monthCampaigns = campaigns?.filter(campaign => {
        const startDate = new Date(campaign.data_inicio);
        return startDate.getMonth() === monthIndex && startDate.getFullYear() === 2025;
      });

      // Add campaigns under month
      if (monthCampaigns && monthCampaigns.length > 0) {
        let campaignY = currentY + 12;
        pdf.setFontSize(9);
        
        monthCampaigns.forEach((campaign, idx) => {
          if (idx < 4) { // Limit to 4 campaigns per month to avoid overflow
            // Campaign name
            pdf.setTextColor(155, 135, 245);
            pdf.text(campaign.nome, currentX + 5, campaignY);
            
            // Campaign dates
            pdf.setTextColor(142, 145, 150);
            pdf.text(
              `${format(new Date(campaign.data_inicio), "dd/MM", { locale: ptBR })} - ${format(new Date(campaign.data_fim), "dd/MM", { locale: ptBR })}`,
              currentX + 5,
              campaignY + 4
            );
            
            campaignY += 10;
          } else if (idx === 4) {
            pdf.setTextColor(142, 145, 150);
            pdf.text(`+ ${monthCampaigns.length - 4} outras campanhas`, currentX + 5, campaignY);
          }
        });
      }

      currentX += columnWidth + margin;
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