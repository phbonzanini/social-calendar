export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cadastros: {
        Row: {
          cargo: string | null
          created_at: string
          email: string | null
          id_user: number
          nichos: string | null
          nome: string | null
          telefone: number | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          id_user?: number
          nichos?: string | null
          nome?: string | null
          telefone?: number | null
        }
        Update: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          id_user?: number
          nichos?: string | null
          nome?: string | null
          telefone?: number | null
        }
        Relationships: []
      }
      calendarios: {
        Row: {
          ano: number
          created_at: string | null
          id: number
          id_user: string | null
          nome: string
        }
        Insert: {
          ano: number
          created_at?: string | null
          id?: never
          id_user?: string | null
          nome: string
        }
        Update: {
          ano?: number
          created_at?: string | null
          id?: never
          id_user?: string | null
          nome?: string
        }
        Relationships: []
      }
      campanhas_marketing: {
        Row: {
          created_at: string | null
          data_comemorativa: string | null
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: number
          id_calendario: number
          id_user: string | null
          is_from_commemorative: boolean | null
          nome: string
          objetivo: string | null
          oferta: string | null
        }
        Insert: {
          created_at?: string | null
          data_comemorativa?: string | null
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: number
          id_calendario: number
          id_user?: string | null
          is_from_commemorative?: boolean | null
          nome: string
          objetivo?: string | null
          oferta?: string | null
        }
        Update: {
          created_at?: string | null
          data_comemorativa?: string | null
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: number
          id_calendario?: number
          id_user?: string | null
          is_from_commemorative?: boolean | null
          nome?: string
          objetivo?: string | null
          oferta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_marketing_id_calendario_fkey"
            columns: ["id_calendario"]
            isOneToOne: false
            referencedRelation: "calendarios"
            referencedColumns: ["id"]
          },
        ]
      }
      datas_2025: {
        Row: {
          created_at: string
          data: string | null
          descrição: string | null
          id: number
          "nicho 1": string | null
          "nicho 2": string | null
          "nicho 3": string | null
          tipo: string | null
        }
        Insert: {
          created_at?: string
          data?: string | null
          descrição?: string | null
          id?: number
          "nicho 1"?: string | null
          "nicho 2"?: string | null
          "nicho 3"?: string | null
          tipo?: string | null
        }
        Update: {
          created_at?: string
          data?: string | null
          descrição?: string | null
          id?: number
          "nicho 1"?: string | null
          "nicho 2"?: string | null
          "nicho 3"?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      fases_campanha: {
        Row: {
          created_at: string | null
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: number
          id_campanha: number | null
          nome: string
          objetivo: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: number
          id_campanha?: number | null
          nome: string
          objetivo?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: number
          id_campanha?: number | null
          nome?: string
          objetivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fases_campanha_id_campanha_fkey"
            columns: ["id_campanha"]
            isOneToOne: false
            referencedRelation: "campanhas_marketing"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cargo: string | null
          created_at: string | null
          email: string | null
          id: string
          nome: string | null
          telefone: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          nome?: string | null
          telefone?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
