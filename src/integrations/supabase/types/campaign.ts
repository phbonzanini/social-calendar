export interface CampaignTable {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  objetivo?: string | null;
  descricao?: string | null;
  data_comemorativa?: string | null;
  id_user?: string | null;
  created_at?: string | null;
  is_from_commemorative?: boolean | null;
}

export type CampaignInsert = Omit<CampaignTable, 'id'>;
export type CampaignUpdate = Partial<CampaignInsert>;