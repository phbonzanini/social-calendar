export interface ProfileTable {
  id: string;
  nome?: string | null;
  email?: string | null;
  telefone?: string | null;
  cargo?: string | null;
  created_at?: string | null;
}

export type ProfileInsert = ProfileTable;
export type ProfileUpdate = Partial<ProfileTable>;