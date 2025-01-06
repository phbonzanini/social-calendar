import jsPDF from "jspdf";
import { Campaign } from "./types";
import { addFirstPage } from "./firstPage";

export const createCalendarPDF = (campaigns: Campaign[], customTitle: string) => {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
  });

  addFirstPage(pdf, campaigns, customTitle);
  
  return pdf;
};