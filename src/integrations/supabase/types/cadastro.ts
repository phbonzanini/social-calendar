export interface CadastroTable {
  id_user: number;
  created_at: string;
  nome?: string | null;
  email?: string | null;
  telefone?: number | null;
  cargo?: string | null;
  nichos?: string | null;
}

export type CadastroInsert = Partial<Omit<CadastroTable, 'created_at'>>;
export type CadastroUpdate = CadastroInsert;