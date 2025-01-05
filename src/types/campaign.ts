export interface Campaign {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  objetivo?: string;
  descricao?: string;
  data_comemorativa?: string;
  id_user?: string; // Changed to string for UUID
  created_at?: string;
  is_from_commemorative?: boolean;
}