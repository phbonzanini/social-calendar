export interface Data2025Table {
  id: number;
  created_at: string;
  descrição?: string | null;
  tipo?: string | null;
  data?: string | null;
  "nicho 1"?: string | null;
  "nicho 2"?: string | null;
  "nicho 3"?: string | null;
}

export type Data2025Insert = Omit<Data2025Table, 'id' | 'created_at'>;
export type Data2025Update = Partial<Data2025Insert>;