import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Campaign, PDFConfig } from "./types";

const getConfig = (pdf: jsPDF): PDFConfig => ({
  pageWidth: pdf.internal.pageSize.width,
  margin: 20,
  lineHeight: 7,
  maxY: pdf.internal.pageSize.height - 20,
  titleFontSize: 16,
  contentFontSize: 10,
  headerFontSize: 12
});

export const addDetailedPages = (pdf: jsPDF, campaigns: Campaign[]) => {
  pdf.addPage('landscape');
  pdf.setFillColor(251, 247, 255);
  pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, "F");

  const config = getConfig(pdf);
  
  // Title
  pdf.setFontSize(24);
  pdf.setTextColor(155, 135, 245);
  pdf.text("Detalhes das Campanhas", pdf.internal.pageSize.width / 2, 30, { align: "center" });

  // Sort campaigns by start date
  const sortedCampaigns = [...campaigns].sort(
    (a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
  );

  // Table headers
  const startY = 50;
  const headers = ["Campanha", "Período", "Objetivo", "Descrição", "Oferta"];
  const colWidths = [160, 100, 160, 160, 160];
  let currentY = startY;

  // Function to add a new page with headers
  const addNewPageWithHeaders = () => {
    pdf.addPage('landscape');
    pdf.setFillColor(251, 247, 255);
    pdf.rect(0, 0, config.pageWidth, pdf.internal.pageSize.height, "F");
    currentY = startY;
    
    // Add headers
    pdf.setFillColor(155, 135, 245);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(config.headerFontSize);
    
    let xOffset = config.margin;
    headers.forEach((header, index) => {
      pdf.rect(xOffset, currentY - 6, colWidths[index], 10, "F");
      pdf.text(header, xOffset + 5, currentY);
      xOffset += colWidths[index];
    });
    currentY += 15;
  };

  // Add initial headers
  addNewPageWithHeaders();

  // Add campaign rows
  sortedCampaigns.forEach((campaign) => {
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

    // Calculate required height for this row
    const maxLines = Math.max(
      ...rowContent.map((text, index) => 
        pdf.splitTextToSize(text, colWidths[index] - 10).length
      )
    );
    const rowHeight = maxLines * 7;

    // Check if we need a new page
    if (currentY + rowHeight > config.maxY) {
      addNewPageWithHeaders();
    }

    // Draw row content
    let xOffset = config.margin;
    rowContent.forEach((text, index) => {
      const lines = pdf.splitTextToSize(text, colWidths[index] - 10);
      pdf.text(lines, xOffset + 5, currentY);
      xOffset += colWidths[index];
    });

    currentY += rowHeight + 10;
  });
};