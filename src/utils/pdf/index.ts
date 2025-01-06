import jsPDF from "jspdf";
import { Campaign } from "./types";
import { addFirstPage } from "./firstPage";

export const createCalendarPDF = (campaigns: Campaign[], months: string[]) => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
  });
  
  addFirstPage(pdf, campaigns, months);
  
  return pdf;
};