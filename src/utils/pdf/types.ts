export interface Campaign {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  objetivo?: string;
  descricao?: string;
  oferta?: string;
}

export interface PDFConfig {
  pageWidth: number;
  margin: number;
  columnGap: number;
  columnWidth: number;
  baseCardPadding: number;
  lineHeight: number;
  maxY: number;
  titleFontSize: number;
  dateFontSize: number;
  contentFontSize: number;
}