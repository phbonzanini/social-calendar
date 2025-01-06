import { Campaign } from "./types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const addFirstPage = (pdf: any, campaigns: Campaign[]) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const padding = 5;

  // Title
  pdf.setFontSize(16);
  pdf.setTextColor(34, 34, 34);
  pdf.text("Calendário de Campanhas 2025", margin, margin + 10);

  // Info text about CSV download
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(
    "Para visualizar informações detalhadas das campanhas, baixe o arquivo CSV utilizando o botão 'Baixar CSV'.",
    margin,
    margin + 20
  );

  // Calendar grid setup
  const monthsPerRow = 2;
  const monthWidth = (pageWidth - (margin * 2)) / monthsPerRow;
  const monthHeight = 45;
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril",
    "Maio", "Junho", "Julho", "Agosto",
    "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  months.forEach((month, index) => {
    const row = Math.floor(index / monthsPerRow);
    const col = index % monthsPerRow;
    const x = margin + (col * monthWidth);
    const y = margin + 30 + (row * monthHeight);

    // Month card background
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, monthWidth - padding, monthHeight - padding, 2, 2, "F");

    // Month title
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
        
        // Campaign card background - Usando um tom mais claro de roxo
        pdf.setFillColor(229, 222, 255); // Cor de fundo mais clara
        pdf.roundedRect(x + padding, cardY, monthWidth - (padding * 3), 6, 2, 2, "F");

        // Campaign details - Texto mais escuro para melhor contraste
        pdf.setFontSize(7);
        pdf.setTextColor(0, 0, 0); // Texto preto para máximo contraste
        const startDate = format(new Date(campaign.data_inicio), "dd/MM", { locale: ptBR });
        const endDate = format(new Date(campaign.data_fim), "dd/MM", { locale: ptBR });
        const text = `${campaign.nome} (${startDate} - ${endDate})`;
        
        // Truncate text if too long
        const maxLength = 25;
        const displayText = text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
        pdf.text(displayText, x + padding + 1, cardY + 4);
      }
    });

    // If there are more campaigns than shown
    if (monthCampaigns.length > 3) {
      pdf.setFontSize(6);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `+${monthCampaigns.length - 3} campanhas`,
        x + padding,
        y + 18 + (3 * 8) + 4
      );
    }
  });
};