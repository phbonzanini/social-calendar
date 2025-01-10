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

export interface PhaseAction {
  id: number;
  id_fase: number;
  descricao: string;
  responsavel?: string;
  status?: string;
  created_at?: string;
}