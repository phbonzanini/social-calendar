import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Campaign, PDFConfig } from "./types";

const getConfig = (pdf: jsPDF): PDFConfig => ({
  pageWidth: pdf.internal.pageSize.width,
  margin: 20,
  lineHeight: 5,
  maxY: pdf.internal.pageSize.height - 20,
  titleFontSize: 16,
  contentFontSize: 8,
  headerFontSize: 9,
  columnGap: 0,
  columnWidth: 0,
  baseCardPadding: 0,
  dateFontSize: 8
});

export const addDetailedPages = (pdf: jsPDF, campaigns: Campaign[]) => {
  pdf.addPage('landscape');
  const config = getConfig(pdf);
  
  // Title
  pdf.setFontSize(16);
  pdf.setTextColor(155, 135, 245);
  pdf.text("Detalhes das Campanhas", config.margin, 30);

  // Table settings
  const startY = 40;
  const colWidths = [80, 60, 100, 100, 80];
  let currentY = startY;

  const addTableHeader = () => {
    pdf.setFillColor(155, 135, 245);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(config.headerFontSize);
    
    let xOffset = config.margin;
    ["Campanha", "Período", "Objetivo", "Descrição", "Oferta"].forEach((header, index) => {
      pdf.rect(xOffset, currentY - 5, colWidths[index], 7, "F");
      pdf.text(header, xOffset + 2, currentY);
      xOffset += colWidths[index];
    });
    currentY += 8;
  };

  const addTableRow = (campaign: Campaign) => {
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(config.contentFontSize);

    const period = `${format(new Date(campaign.data_inicio), "dd/MM/yyyy", { locale: ptBR })} - 
                   ${format(new Date(campaign.data_fim), "dd/MM/yyyy", { locale: ptBR })}`;

    const rowContent = [
      campaign.nome,
      period,
      campaign.objetivo || "-",
      campaign.descricao || "-",
      campaign.oferta || "-"
    ];

    let xOffset = config.margin;
    let maxHeight = 0;

    // Calculate max height needed for this row
    rowContent.forEach((text, index) => {
      const lines = pdf.splitTextToSize(text, colWidths[index] - 4);
      const height = lines.length * config.lineHeight;
      maxHeight = Math.max(maxHeight, height);
    });

    // Check if we need a new page
    if (currentY + maxHeight > config.maxY) {
      pdf.addPage('landscape');
      currentY = startY;
      addTableHeader();
    }

    // Draw row content
    rowContent.forEach((text, index) => {
      const lines = pdf.splitTextToSize(text, colWidths[index] - 4);
      pdf.text(lines, xOffset + 2, currentY);
      xOffset += colWidths[index];
    });

    currentY += maxHeight + 2;
  };

  // Add initial header
  addTableHeader();

  // Sort campaigns by start date and add them to the table
  const sortedCampaigns = [...campaigns].sort(
    (a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
  );

  sortedCampaigns.forEach(addTableRow);
};