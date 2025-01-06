import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Campaign } from "./types";

export const addFirstPage = (pdf: jsPDF, campaigns: Campaign[], months: string[]) => {
  let currentX = 10;
  let currentY = 20;
  const columnWidth = 90;
  const rowHeight = 65;
  const margin = 5;

  pdf.setFillColor(251, 247, 255);
  pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, "F");

  pdf.setFontSize(24);
  pdf.setTextColor(155, 135, 245);
  pdf.text("Calendário de Campanhas 2025", pdf.internal.pageSize.width / 2, 15, { align: "center" });

  months.forEach((month, monthIndex) => {
    if (monthIndex > 0 && monthIndex % 3 === 0) {
      currentY += rowHeight + margin;
      currentX = 10;
    }

    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(currentX, currentY, columnWidth, rowHeight, 3, 3, "F");

    pdf.setFillColor(155, 135, 245);
    pdf.roundedRect(currentX, currentY, columnWidth, 8, 3, 3, "F");

    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.text(month, currentX + 5, currentY + 6);

    const monthCampaigns = campaigns?.filter(campaign => {
      const startDate = new Date(campaign.data_inicio);
      return startDate.getMonth() === monthIndex && startDate.getFullYear() === 2025;
    });

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