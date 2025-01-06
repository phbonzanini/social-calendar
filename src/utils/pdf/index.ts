import jsPDF from "jspdf";
import { Campaign } from "./types";
import { addFirstPage } from "./firstPage";
import { addDetailedPages } from "./detailedPages";

export const createCalendarPDF = (campaigns: Campaign[], months: string[]) => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
  });
  
  addFirstPage(pdf, campaigns, months);
  addDetailedPages(pdf, campaigns);
  
  return pdf;
};