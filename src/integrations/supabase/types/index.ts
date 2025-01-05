import { CampaignTable, CampaignInsert, CampaignUpdate } from './campaign';
import { ProfileTable, ProfileInsert, ProfileUpdate } from './profile';
import { CadastroTable, CadastroInsert, CadastroUpdate } from './cadastro';
import { Data2025Table, Data2025Insert, Data2025Update } from './data2025';

export type Database = {
  public: {
    Tables: {
      campanhas_marketing: {
        Row: CampaignTable;
        Insert: CampaignInsert;
        Update: CampaignUpdate;
      };
      profiles: {
        Row: ProfileTable;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      cadastros: {
        Row: CadastroTable;
        Insert: CadastroInsert;
        Update: CadastroUpdate;
      };
      datas_2025: {
        Row: Data2025Table;
        Insert: Data2025Insert;
        Update: Data2025Update;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];