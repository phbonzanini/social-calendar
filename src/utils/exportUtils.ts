import jsPDF from "jspdf";
import { niches } from "@/components/NicheSelector";

interface CalendarDate {
  date: string;
  title: string;
  category: "commemorative" | "holiday" | "optional";
  description: string;
}

const getNicheLabel = (value: string) => {
  const niche = niches.find((n) => n.value === value);
  return niche ? niche.label : value;
};

const getDateTypeLabel = (category: string) => {
  switch (category) {
    case "commemorative":
      return "Data Comemorativa";
    case "holiday":
      return "Feriado Nacional";
    case "optional":
      return "Ponto Facultativo";
    default:
      return "";
  }
};

export const exportToPDF = (dates: CalendarDate[], selectedNiches: string[]) => {
  if (!dates || dates.length === 0) return;

  const pdf = new jsPDF();
  let yPosition = 20;

  // Add title
  pdf.setFontSize(16);
  pdf.text("Calendário Personalizado", 20, yPosition);
  yPosition += 10;

  // Add selected niches
  pdf.setFontSize(12);
  const nichesText = selectedNiches
    .map((niche) => getNicheLabel(niche))
    .join(", ");
  pdf.text(`Nichos selecionados: ${nichesText}`, 20, yPosition);
  yPosition += 15;

  // Add dates
  pdf.setFontSize(10);
  dates.forEach((date) => {
    const dateStr = new Date(date.date).toLocaleDateString("pt-BR");
    const typeStr = getDateTypeLabel(date.category);

    if (yPosition > 270) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.text(`${dateStr} - ${typeStr}`, 20, yPosition);
    yPosition += 7;
    pdf.text(date.title, 30, yPosition);
    yPosition += 10;
  });

  pdf.save("calendario-personalizado.pdf");
};

export const exportToCSV = (dates: CalendarDate[]) => {
  if (!dates || dates.length === 0) return;

  const headers = ["Data", "Tipo", "Descrição"];
  const csvContent = dates.map((date) => {
    const dateStr = new Date(date.date).toLocaleDateString("pt-BR");
    const typeStr = getDateTypeLabel(date.category);
    return `${dateStr},"${typeStr}","${date.title}"`;
  });

  const csv = [headers.join(","), ...csvContent].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", "calendario-personalizado.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};