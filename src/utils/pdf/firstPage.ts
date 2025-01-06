import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Campaign } from "./types";

export const addFirstPage = (pdf: jsPDF, campaigns: Campaign[]) => {
  // Set background color
  pdf.setFillColor(251, 247, 255);
  pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, "F");

  // Add title
  pdf.setFontSize(24);
  pdf.setTextColor(155, 135, 245); // Primary color
  pdf.text("Calendário de Campanhas 2025", pdf.internal.pageSize.width / 2, 20, { align: "center" });

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const startX = 10;
  const startY = 40;
  const monthWidth = (pdf.internal.pageSize.width - 20) / 3; // 3 columns
  const monthHeight = 65; // Fixed height for each month
  const padding = 5;

  months.forEach((month, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = startX + (col * monthWidth);
    const y = startY + (row * monthHeight);

    // Draw month card background
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, monthWidth - padding, monthHeight - padding, 3, 3, "F");

    // Month name
    pdf.setFontSize(14);
    pdf.setTextColor(34, 34, 34);
    pdf.text(month, x + padding, y + 15);

    // Get campaigns for this month
    const monthCampaigns = campaigns.filter(campaign => {
      const startDate = new Date(campaign.data_inicio);
      return startDate.getMonth() === index && startDate.getFullYear() === 2025;
    });

    // Add campaign cards
    monthCampaigns.forEach((campaign, campIndex) => {
      const cardY = y + 20 + (campIndex * 12);
      
      // Campaign card background
      pdf.setFillColor(155, 135, 245, 0.1);
      pdf.roundedRect(x + padding, cardY, monthWidth - (padding * 3), 10, 2, 2, "F");

      // Campaign details
      pdf.setFontSize(8);
      pdf.setTextColor(34, 34, 34);
      const startDate = format(new Date(campaign.data_inicio), "dd/MM", { locale: ptBR });
      const endDate = format(new Date(campaign.data_fim), "dd/MM", { locale: ptBR });
      pdf.text(`${campaign.nome} (${startDate} - ${endDate})`, x + (padding * 2), cardY + 6);
    });
  });
};