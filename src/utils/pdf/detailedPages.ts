import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Campaign, PDFConfig } from "./types";

const getConfig = (pdf: jsPDF): PDFConfig => ({
  pageWidth: pdf.internal.pageSize.width,
  margin: 10,
  columnGap: 10,
  columnWidth: (pdf.internal.pageSize.width - (2 * 10) - (2 * 10)) / 3,
  baseCardPadding: 10,
  lineHeight: 7,
  maxY: pdf.internal.pageSize.height - 20,
  titleFontSize: 12,
  dateFontSize: 10,
  contentFontSize: 9
});

export const addDetailedPages = (pdf: jsPDF, campaigns: Campaign[]) => {
  pdf.addPage('landscape');
  pdf.setFillColor(251, 247, 255);
  pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, "F");

  pdf.setFontSize(24);
  pdf.setTextColor(155, 135, 245);
  pdf.text("Detalhes das Campanhas", pdf.internal.pageSize.width / 2, 15, { align: "center" });

  const config = getConfig(pdf);
  let currentColumn = 0;
  let detailY = 30;

  campaigns
    .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime())
    .forEach(campaign => {
      // Calculate total height needed for this campaign card
      pdf.setFontSize(config.titleFontSize);
      const titleLines = pdf.splitTextToSize(campaign.nome, config.columnWidth - 10).length;
      
      pdf.setFontSize(config.contentFontSize);
      const dateText = `${format(new Date(campaign.data_inicio), "dd/MM/yyyy", { locale: ptBR })} - ${format(new Date(campaign.data_fim), "dd/MM/yyyy", { locale: ptBR })}`;
      const objetivoLines = campaign.objetivo ? 
        pdf.splitTextToSize(`Objetivo: ${campaign.objetivo}`, config.columnWidth - 10).length : 0;
      const descricaoLines = campaign.descricao ? 
        pdf.splitTextToSize(`Descrição: ${campaign.descricao}`, config.columnWidth - 10).length : 0;
      const ofertaLines = campaign.oferta ? 
        pdf.splitTextToSize(`Oferta: ${campaign.oferta}`, config.columnWidth - 10).length : 0;

      const cardHeight = config.baseCardPadding + 
        (titleLines * config.lineHeight) +
        (2 * config.lineHeight) + // Date takes up 2 lines
        (objetivoLines * config.lineHeight) +
        (descricaoLines * config.lineHeight) +
        (ofertaLines * config.lineHeight) +
        config.baseCardPadding;

      // Check if we need to move to next column or page
      if (detailY + cardHeight > config.maxY) {
        if (currentColumn < 2) {
          currentColumn++;
          detailY = 30;
        } else {
          pdf.addPage('landscape');
          pdf.setFillColor(251, 247, 255);
          pdf.rect(0, 0, config.pageWidth, pdf.internal.pageSize.height, "F");
          currentColumn = 0;
          detailY = 30;
        }
      }

      const currentX = config.margin + (currentColumn * (config.columnWidth + config.columnGap));

      // Draw card background
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(currentX, detailY - 5, config.columnWidth, cardHeight, 3, 3, "F");

      // Add campaign title
      pdf.setFontSize(config.titleFontSize);
      pdf.setTextColor(155, 135, 245);
      let currentY = detailY + 5;
      currentY = pdf.splitTextToSize(campaign.nome, config.columnWidth - 10)
        .reduce((y, line) => {
          pdf.text(line, currentX + 5, y);
          return y + config.lineHeight;
        }, currentY);

      // Add campaign dates
      pdf.setFontSize(config.dateFontSize);
      pdf.setTextColor(142, 145, 150);
      currentY += 2;
      pdf.text(dateText, currentX + 5, currentY);
      currentY += config.lineHeight * 1.5;

      // Add campaign details
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(config.contentFontSize);

      if (campaign.objetivo) {
        currentY = pdf.splitTextToSize(`Objetivo: ${campaign.objetivo}`, config.columnWidth - 10)
          .reduce((y, line) => {
            pdf.text(line, currentX + 5, y);
            return y + config.lineHeight;
          }, currentY);
        currentY += config.lineHeight * 0.5;
      }

      if (campaign.descricao) {
        currentY = pdf.splitTextToSize(`Descrição: ${campaign.descricao}`, config.columnWidth - 10)
          .reduce((y, line) => {
            pdf.text(line, currentX + 5, y);
            return y + config.lineHeight;
          }, currentY);
        currentY += config.lineHeight * 0.5;
      }

      if (campaign.oferta) {
        currentY = pdf.splitTextToSize(`Oferta: ${campaign.oferta}`, config.columnWidth - 10)
          .reduce((y, line) => {
            pdf.text(line, currentX + 5, y);
            return y + config.lineHeight;
          }, currentY);
      }

      detailY += cardHeight + 5;
    });
};