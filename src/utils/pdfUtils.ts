import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Campaign {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  objetivo?: string;
  descricao?: string;
  data_comemorativa?: string;
}

export const createCalendarPDF = (campaigns: Campaign[], months: string[]) => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
  });
  
  addFirstPage(pdf, campaigns, months);
  addDetailedPages(pdf, campaigns);
  
  return pdf;
};

const addFirstPage = (pdf: jsPDF, campaigns: Campaign[], months: string[]) => {
  // Set initial position for the grid
  let currentX = 10;
  let currentY = 20;
  const columnWidth = 90;
  const rowHeight = 65;
  const margin = 5;

  // Set background color for first page
  pdf.setFillColor(251, 247, 255);
  pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, "F");

  // Add title
  pdf.setFontSize(24);
  pdf.setTextColor(155, 135, 245);
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
        if (idx < 4) {
          pdf.setTextColor(155, 135, 245);
          pdf.text(campaign.nome, currentX + 5, campaignY);
          
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
};

const addDetailedPages = (pdf: jsPDF, campaigns: Campaign[]) => {
  pdf.addPage('landscape');
  pdf.setFillColor(251, 247, 255);
  pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, "F");

  // Add title for second page
  pdf.setFontSize(24);
  pdf.setTextColor(155, 135, 245);
  pdf.text("Detalhes das Campanhas", pdf.internal.pageSize.width / 2, 15, { align: "center" });

  // Reset position for campaign details
  let detailY = 30;
  const pageWidth = pdf.internal.pageSize.width;
  const maxWidth = pageWidth - 20;

  campaigns.sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime())
    .forEach(campaign => {
      // Calculate card height based on content
      const cardHeight = 45; // Fixed minimum height for all cards

      // Check if we need to add a new page
      if (detailY + cardHeight > pdf.internal.pageSize.height - 20) {
        pdf.addPage('landscape');
        pdf.setFillColor(251, 247, 255);
        pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.height, "F");
        detailY = 30;
      }

      // Add white background card
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(10, detailY - 5, maxWidth, cardHeight, 3, 3, "F");

      // Campaign name and dates
      pdf.setFontSize(14);
      pdf.setTextColor(155, 135, 245);
      pdf.text(campaign.nome, 15, detailY + 5);

      pdf.setFontSize(10);
      pdf.setTextColor(142, 145, 150);
      const dateText = `${format(new Date(campaign.data_inicio), "dd/MM/yyyy", { locale: ptBR })} - ${format(new Date(campaign.data_fim), "dd/MM/yyyy", { locale: ptBR })}`;
      pdf.text(dateText, 15, detailY + 12);

      // Add details
      let textY = detailY + 20;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);

      if (campaign.objetivo) {
        pdf.text(`Objetivo: ${campaign.objetivo}`, 15, textY);
        textY += 7;
      }

      if (campaign.descricao) {
        pdf.text(`Descrição: ${campaign.descricao}`, 15, textY);
        textY += 7;
      }

      if (campaign.data_comemorativa) {
        pdf.text(`Data Comemorativa: ${campaign.data_comemorativa}`, 15, textY);
      }

      detailY += cardHeight + 10;
    });
};