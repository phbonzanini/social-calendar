import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Campaign } from "@/types/campaign";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CampaignCardProps {
  campaign: Campaign;
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
  showActions?: boolean;
}

export const CampaignCard = ({ campaign, onEdit, onDelete, showActions = true }: CampaignCardProps) => {
  return (
    <Card className="bg-neutral-light/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">{campaign.nome}</CardTitle>
        {showActions && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(campaign)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(campaign)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Período: {format(new Date(campaign.data_inicio), "dd/MM/yyyy", { locale: ptBR })} -{" "}
            {format(new Date(campaign.data_fim), "dd/MM/yyyy", { locale: ptBR })}
          </p>
          {campaign.objetivo && (
            <p className="text-sm">
              <strong>Objetivo:</strong> {campaign.objetivo}
            </p>
          )}
          {campaign.descricao && (
            <p className="text-sm">
              <strong>Descrição:</strong> {campaign.descricao}
            </p>
          )}
          {campaign.oferta && (
            <p className="text-sm">
              <strong>Oferta:</strong> {campaign.oferta}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};