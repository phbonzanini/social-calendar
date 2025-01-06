import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Campaign } from "./types";

export const addFirstPage = (pdf: jsPDF, campaigns: Campaign[], months: string[]) => {
  pdf.setFillColor(251, 247, 255);
  pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, "F");

  // Add title
  pdf.setFontSize(24);
  pdf.setTextColor(155, 135, 245);
  pdf.text("Calendário de Campanhas 2025", pdf.internal.pageSize.width / 2, 20, { align: "center" });

  const startX = 10;
  const startY = 40;
  const monthWidth = (pdf.internal.pageSize.width - 20) / 4;
  const monthHeight = (pdf.internal.pageSize.height - startY - 10) / 3;
  const daySize = (monthWidth - 20) / 7;
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  months.forEach((month, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = startX + (col * monthWidth);
    const y = startY + (row * monthHeight);

    // Add month name
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text(month, x + 10, y + 15);

    // Add weekday headers
    pdf.setFontSize(8);
    weekDays.forEach((day, dayIndex) => {
      pdf.text(day, x + 10 + (dayIndex * daySize), y + 25);
    });

    // Calculate first day and number of days in month
    const date = new Date(2025, index, 1);
    const firstDay = date.getDay();
    const daysInMonth = new Date(2025, index + 1, 0).getDate();

    // Add days
    let currentDay = 1;
    const rows = Math.ceil((firstDay + daysInMonth) / 7);

    for (let week = 0; week < rows; week++) {
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const dayNumber = week * 7 + dayOfWeek - firstDay + 1;
        const xPos = x + 10 + (dayOfWeek * daySize);
        const yPos = y + 35 + (week * 10);

        if (dayNumber > 0 && dayNumber <= daysInMonth) {
          const currentDate = new Date(2025, index, dayNumber);
          const hasCampaign = campaigns.some(campaign => {
            const startDate = new Date(campaign.data_inicio);
            const endDate = new Date(campaign.data_fim);
            return currentDate >= startDate && currentDate <= endDate;
          });

          if (hasCampaign) {
            // Draw circle for campaign days
            pdf.setFillColor(155, 135, 245);
            pdf.circle(xPos + 2, yPos - 2, 3, 'F');
            pdf.setTextColor(255, 255, 255);
          } else {
            pdf.setTextColor(0, 0, 0);
          }

          pdf.text(dayNumber.toString(), xPos, yPos);
        }
      }
    }
  });
};