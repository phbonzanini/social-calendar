import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

// Mapeamento de nichos em inglês para português
const nicheMapping: Record<string, string> = {
  'education': 'educação',
  'fashion': 'moda',
  'healthcare': 'saúde e bem-estar',
  'finance': 'finanças',
  'gastronomy': 'gastronomia',
  'logistics': 'logística',
  'industry': 'indústria',
  'tourism': 'turismo'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niches } = await req.json();
    console.log("Received niches:", niches);

    // Traduz os nichos para português
    const translatedNiches = niches.map(niche => nicheMapping[niche] || niche);
    console.log("Translated niches:", translatedNiches);

    // Busca datas do Supabase
    const { data: dates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*');

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    console.log("Total dates from database:", dates?.length);

    // Filtra as datas relevantes baseado nos nichos
    const relevantDates = dates.filter(date => {
      // Verifica se é uma data comemorativa geral
      const isGeneralDate = 
        date.descrição?.toLowerCase().includes('dia das mães') ||
        date.descrição?.toLowerCase().includes('dia dos pais') ||
        date.descrição?.toLowerCase().includes('natal') ||
        date.descrição?.toLowerCase().includes('ano novo') ||
        date.descrição?.toLowerCase().includes('dia do cliente') ||
        date.descrição?.toLowerCase().includes('black friday');

      if (isGeneralDate) {
        console.log("Found general date:", date.descrição);
        return true;
      }

      // Coleta todos os nichos da data
      const dateNiches = [
        date['nicho 1']?.toLowerCase(),
        date['nicho 2']?.toLowerCase(),
        date['nicho 3']?.toLowerCase()
      ].filter(Boolean);

      // Verifica se algum dos nichos traduzidos corresponde aos nichos da data
      const hasMatchingNiche = translatedNiches.some(niche => {
        const nicheMatch = dateNiches.some(dateNiche => {
          const matches = dateNiche?.includes(niche.toLowerCase());
          if (matches) {
            console.log(`Match found: ${dateNiche} includes ${niche}`);
          }
          return matches;
        });
        return nicheMatch;
      });

      return hasMatchingNiche;
    });

    console.log("Relevant dates found:", relevantDates.length);

    // Formata as datas para o formato esperado
    const formattedDates = relevantDates.map(date => ({
      date: date.data?.split('T')[0] || '',
      title: date.descrição || '',
      category: date.tipo?.toLowerCase() || 'commemorative',
      description: date.descrição || ''
    }));

    console.log("Formatted dates:", formattedDates);

    return new Response(
      JSON.stringify({ dates: formattedDates }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in search-dates function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        details: error.message
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});