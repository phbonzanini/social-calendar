import { supabase } from "@/integrations/supabase/client";

export interface CalendarDate {
  date: string;
  title: string;
  category: "commemorative" | "holiday" | "optional";
  description: string;
}

export const fetchDatesForNiches = async (niches: string[]): Promise<CalendarDate[]> => {
  if (!niches || niches.length === 0) {
    throw new Error("Nenhum nicho selecionado");
  }

  console.log("Buscando datas para os nichos:", niches);

  try {
    const { data, error } = await supabase.functions.invoke(
      "search-dates",
      {
        body: { niches },
      }
    );

    if (error) {
      console.error("Erro na função de busca:", error);
      throw new Error(`Erro na função de busca: ${error.message}`);
    }

    if (!data?.dates || !Array.isArray(data.dates)) {
      console.log("Nenhuma data encontrada ou formato inválido");
      return [];
    }

    console.log("Datas encontradas:", data.dates);
    return data.dates;

  } catch (error) {
    console.error("Erro ao buscar datas:", error);
    throw error instanceof Error 
      ? error 
      : new Error("Erro desconhecido ao buscar datas");
  }
};