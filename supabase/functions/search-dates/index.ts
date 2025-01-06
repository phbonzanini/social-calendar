import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from './cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const nicheMapping: Record<string, string> = {
  'education': 'educação',
  'fashion': 'moda',
  'healthcare': 'saúde',
  'finance': 'finanças',
  'gastronomy': 'gastronomia',
  'logistics': 'logística',
  'industry': 'indústria',
  'tourism': 'turismo'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niches } = await req.json();
    console.log("[Main] Received niches:", niches);

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('No niches provided');
    }

    // Traduz os nichos para português
    const translatedNiches = niches.map(niche => {
      const translated = nicheMapping[niche]?.toLowerCase();
      console.log(`[Main] Translating niche ${niche} to ${translated}`);
      return translated || niche.toLowerCase();
    });

    console.log("[Main] Translated niches:", translatedNiches);

    // Busca todas as datas do Supabase
    const { data: dates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*');

    if (dbError) {
      console.error("[Main] Database error:", dbError);
      throw dbError;
    }

    if (!dates || dates.length === 0) {
      console.log("[Main] No dates found in database");
      return new Response(
        JSON.stringify({ dates: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("[Main] Total dates from database:", dates.length);

    // Filtra datas gerais importantes
    const generalDates = dates.filter(date => {
      const description = date.descrição?.toLowerCase() || '';
      return (
        description.includes('dia das mães') ||
        description.includes('dia dos pais') ||
        description.includes('natal') ||
        description.includes('ano novo') ||
        description.includes('dia do cliente') ||
        description.includes('black friday')
      );
    });

    // Filtra datas específicas do nicho
    const nicheDates = dates.filter(date => {
      const dateNiches = [
        date['nicho 1']?.toLowerCase(),
        date['nicho 2']?.toLowerCase(),
        date['nicho 3']?.toLowerCase()
      ].filter(Boolean);

      console.log(`[Main] Checking date niches for date ${date.data}:`, dateNiches);

      return translatedNiches.some(niche => 
        dateNiches.some(dateNiche => {
          const matches = dateNiche.includes(niche);
          if (matches) {
            console.log(`[Main] Match found for date ${date.data}: ${dateNiche} includes ${niche}`);
          }
          return matches;
        })
      );
    });

    console.log("[Main] Found general dates:", generalDates.length);
    console.log("[Main] Found niche-specific dates:", nicheDates.length);

    // Combina e formata todas as datas
    const allDates = [...generalDates, ...nicheDates].map(date => ({
      date: date.data?.split('T')[0] || '',
      title: date.descrição || '',
      category: date.tipo?.toLowerCase() || 'commemorative',
      description: date.descrição || ''
    }));

    // Remove duplicatas baseado na data
    const uniqueDates = Array.from(
      new Map(allDates.map(date => [date.date, date])).values()
    );

    console.log("[Main] Final unique dates:", uniqueDates.length);

    return new Response(
      JSON.stringify({ dates: uniqueDates }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Main] Error in search-dates function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});