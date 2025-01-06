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
      pdf.setFontSize(config.titleFontSize);
      const titleLines = pdf.splitTextToSize(campaign.nome, config.columnWidth - 10).length;
      
      pdf.setFontSize(config.contentFontSize);
      const objetivoLines = campaign.objetivo ? 
        pdf.splitTextToSize(`Objetivo: ${campaign.objetivo}`, config.columnWidth - 10).length : 0;
      const descricaoLines = campaign.descricao ? 
        pdf.splitTextToSize(`Descrição: ${campaign.descricao}`, config.columnWidth - 10).length : 0;
      const ofertaLines = campaign.oferta ? 
        pdf.splitTextToSize(`Oferta: ${campaign.oferta}`, config.columnWidth - 10).length : 0;

      const cardHeight = config.baseCardPadding + 
        (titleLines * config.lineHeight) +
        (config.lineHeight) +
        (objetivoLines * config.lineHeight) +
        (descricaoLines * config.lineHeight) +
        (ofertaLines * config.lineHeight) +
        config.baseCardPadding;

      const currentX = config.margin + (currentColumn * (config.columnWidth + config.columnGap));

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

      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(currentX, detailY - 5, config.columnWidth, cardHeight, 3, 3, "F");

      pdf.setFontSize(config.titleFontSize);
      pdf.setTextColor(155, 135, 245);
      const titleY = pdf.splitTextToSize(campaign.nome, config.columnWidth - 10)
        .reduce((y, line) => {
          pdf.text(line, currentX + 5, y);
          return y + config.lineHeight;
        }, detailY + 5);

      pdf.setFontSize(config.dateFontSize);
      pdf.setTextColor(142, 145, 150);
      const dateText = `${format(new Date(campaign.data_inicio), "dd/MM/yyyy", { locale: ptBR })} - ${format(new Date(campaign.data_fim), "dd/MM/yyyy", { locale: ptBR })}`;
      let currentY = titleY + 2;
      pdf.text(dateText, currentX + 5, currentY);

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(config.contentFontSize);
      currentY += config.lineHeight;

      if (campaign.objetivo) {
        currentY = pdf.splitTextToSize(`Objetivo: ${campaign.objetivo}`, config.columnWidth - 10)
          .reduce((y, line) => {
            pdf.text(line, currentX + 5, y);
            return y + config.lineHeight;
          }, currentY);
      }

      if (campaign.descricao) {
        currentY = pdf.splitTextToSize(`Descrição: ${campaign.descricao}`, config.columnWidth - 10)
          .reduce((y, line) => {
            pdf.text(line, currentX + 5, y);
            return y + config.lineHeight;
          }, currentY);
      }

      if (campaign.oferta) {
        pdf.splitTextToSize(`Oferta: ${campaign.oferta}`, config.columnWidth - 10)
          .forEach(line => {
            pdf.text(line, currentX + 5, currentY);
            currentY += config.lineHeight;
          });
      }

      detailY += cardHeight + 5;
    });
};