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
  // Filter campaigns to only show those starting in this month and year
  // Also ensure we don't show duplicates by using campaign ID
  const monthCampaigns = campaigns
    .filter((campaign, index, self) => {
      const startDate = new Date(campaign.data_inicio);
      const isCorrectMonth = startDate.getMonth() === monthIndex;
      const isCorrectYear = startDate.getFullYear() === 2025;
      
      // Check if this is the first occurrence of this campaign (prevents duplicates)
      const isFirstOccurrence = index === self.findIndex(c => c.id === campaign.id);
      
      return isCorrectMonth && isCorrectYear && isFirstOccurrence;
    })
    .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());

  return (
    <Card className="glass-card hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-3 text-neutral-dark">{month}</h3>
        <div className="space-y-2">
          {monthCampaigns.map(campaign => (
            <div
              key={campaign.id}
              className="text-sm p-2 bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"
            >
              <p className="font-medium">{campaign.nome}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(campaign.data_inicio), "dd/MM", { locale: ptBR })} - {format(new Date(campaign.data_fim), "dd/MM", { locale: ptBR })}
              </p>
              {campaign.descricao && (
                <p className="text-xs mt-1 text-muted-foreground">{campaign.descricao}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};