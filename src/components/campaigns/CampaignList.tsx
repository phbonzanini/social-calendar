import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Campaign } from "@/types/campaign";
import { Loader2 } from "lucide-react";

interface CampaignListProps {
  campaigns: Campaign[] | undefined;
  isLoading: boolean;
}

export const CampaignList = ({ campaigns, isLoading }: CampaignListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaigns?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Nenhuma campanha criada ainda. Clique em "Nova Campanha" para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {campaigns.map((campaign) => (
        <Card key={campaign.id}>
          <CardHeader>
            <CardTitle>{campaign.nome}</CardTitle>
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
              {campaign.data_comemorativa && (
                <p className="text-sm">
                  <strong>Data Comemorativa:</strong> {campaign.data_comemorativa}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};