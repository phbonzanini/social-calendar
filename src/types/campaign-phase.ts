export interface CampaignPhase {
  id: number;
  id_campanha: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  objetivo?: string;
  descricao?: string;
  created_at?: string;
}