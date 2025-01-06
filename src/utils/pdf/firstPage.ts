import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Campaign } from "./types";

export const addFirstPage = (pdf: jsPDF, campaigns: Campaign[], customTitle: string) => {
  // Set background color
  pdf.setFillColor(251, 247, 255);
  pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, "F");

  // Add title
  pdf.setFontSize(20);
  pdf.setTextColor(155, 135, 245); // Primary color
  pdf.text(customTitle, pdf.internal.pageSize.width / 2, 15, { align: "center" });

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const startX = 10;
  const startY = 25; // Adjusted since we removed the CSV text
  const monthWidth = (pdf.internal.pageSize.width - 20) / 2; // 2 columns
  const monthHeight = 45; // Adjusted height for portrait
  const padding = 5;

  months.forEach((month, index) => {
    const col = index % 2; // 2 columns instead of 3
    const row = Math.floor(index / 2);
    const x = startX + (col * monthWidth);
    const y = startY + (row * monthHeight);

    // Draw month card background
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, monthWidth - padding, monthHeight - padding, 3, 3, "F");

    // Month name
    pdf.setFontSize(12);
    pdf.setTextColor(34, 34, 34);
    pdf.text(month, x + padding, y + 12);

    // Get campaigns for this month
    const monthCampaigns = campaigns.filter(campaign => {
      const startDate = new Date(campaign.data_inicio);
      return startDate.getMonth() === index && startDate.getFullYear() === 2025;
    });

    // Add campaign cards
    monthCampaigns.forEach((campaign, campIndex) => {
      if (campIndex < 3) { // Limit to 3 campaigns per month to prevent overflow
        const cardY = y + 18 + (campIndex * 8);
        
        // Campaign card background
        pdf.setFillColor(229, 222, 255);
        pdf.roundedRect(x + padding, cardY, monthWidth - (padding * 3), 6, 2, 2, "F");

        // Campaign details
        pdf.setFontSize(7);
        pdf.setTextColor(0, 0, 0);
        const startDate = format(new Date(campaign.data_inicio), "dd/MM", { locale: ptBR });
        const endDate = format(new Date(campaign.data_fim), "dd/MM", { locale: ptBR });
        const text = `${campaign.nome} (${startDate} - ${endDate})`;
        
        // Truncate text if too long
        const maxWidth = monthWidth - (padding * 4);
        let truncatedText = text;
        if (pdf.getTextWidth(text) > maxWidth) {
          truncatedText = text.substring(0, 25) + "...";
        }
        
        pdf.text(truncatedText, x + (padding * 2), cardY + 4);
      }
    });
  });
};