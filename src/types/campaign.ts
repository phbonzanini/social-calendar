export interface Campaign {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  objetivo?: string;
  descricao?: string;
  oferta?: string;
  id_user?: string;
  created_at?: string;
  is_from_commemorative?: boolean;
  big_idea: string;
}