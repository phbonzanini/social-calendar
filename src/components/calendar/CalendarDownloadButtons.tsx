import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { createCalendarPDF } from "@/utils/pdf";
import { Campaign } from "@/utils/pdf/types";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

interface CalendarDownloadButtonsProps {
  campaigns: Campaign[];
}

export function CalendarDownloadButtons({ campaigns }: CalendarDownloadButtonsProps) {
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const [customTitle, setCustomTitle] = useState("");

  const handleDownloadPDF = () => {
    setShowTitleDialog(true);
  };

  const handleConfirmTitle = () => {
    const pdf = createCalendarPDF(campaigns, customTitle || "Calendário de Campanhas 2025");
    pdf.save("calendario-2025.pdf");
    setShowTitleDialog(false);
    setCustomTitle("");
  };

  const handleDownloadCSV = () => {
    const csvContent = [
      ["Nome", "Data Início", "Data Fim", "Descrição"],
      ...campaigns.map((campaign) => [
        campaign.nome,
        campaign.data_inicio,
        campaign.data_fim,
        campaign.descricao,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "campanhas.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex gap-4">
      <Button onClick={handleDownloadPDF} variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Baixar PDF
      </Button>
      <Button onClick={handleDownloadCSV} variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Baixar CSV
      </Button>

      <AlertDialog open={showTitleDialog} onOpenChange={setShowTitleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Personalizar título do PDF</AlertDialogTitle>
            <AlertDialogDescription>
              Digite o título que você gostaria que aparecesse no seu calendário PDF.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Calendário de Campanhas 2025"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmTitle}>Baixar PDF</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}