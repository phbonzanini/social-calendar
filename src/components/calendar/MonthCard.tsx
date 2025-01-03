import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Campaign {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  objetivo?: string;
  descricao?: string;
  data_comemorativa?: string;
}

interface MonthCardProps {
  month: string;
  monthIndex: number;
  campaigns: Campaign[];
}

export const MonthCard = ({ month, monthIndex, campaigns }: MonthCardProps) => {
  const monthCampaigns = campaigns?.filter(campaign => {
    const startDate = new Date(campaign.data_inicio);
    return startDate.getMonth() === monthIndex && startDate.getFullYear() === 2025;
  });

  return (
    <Card className="glass-card hover-scale">
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-3 text-neutral-dark">{month}</h3>
        <div className="space-y-2">
          {monthCampaigns?.map(campaign => (
            <div
              key={campaign.id}
              className="text-sm p-2 bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"
            >
              <p className="font-medium">{campaign.nome}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(campaign.data_inicio), "dd/MM", { locale: ptBR })} - {format(new Date(campaign.data_fim), "dd/MM", { locale: ptBR })}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};