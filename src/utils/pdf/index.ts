import jsPDF from "jspdf";
import { Campaign } from "./types";
import { addFirstPage } from "./firstPage";

export const createCalendarPDF = (campaigns: Campaign[]) => {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
  });

  addFirstPage(pdf, campaigns);
  
  return pdf;
};