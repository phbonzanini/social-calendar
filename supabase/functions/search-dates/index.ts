import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from './cors.ts';
import { analyzeRelevantDates } from './openaiClient.ts';
import { 
  filterGeneralDates, 
  filterDatesByNiches, 
  formatDatesForPrompt,
  translateNiches 
} from './dateProcessor.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niches } = await req.json();
    console.log("[Main] Received niches:", niches);

    // Busca datas do Supabase
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

    // Filtra datas pelos nichos
    const filteredDates = filterDatesByNiches(dates, niches);
    console.log("[Main] Filtered dates:", filteredDates.length);

    // Pega datas comemorativas gerais
    const generalDates = filterGeneralDates(dates);
    console.log("[Main] Found general dates:", generalDates.length);

    // Prepara as datas para análise do GPT
    const datesPrompt = formatDatesForPrompt(filteredDates);

    // Chama OpenAI para análise
    const gptResult = await analyzeRelevantDates(datesPrompt);
    console.log("[Main] GPT Response:", gptResult);

    let relevantDates = [];
    try {
      const parsedContent = JSON.parse(gptResult.choices[0].message.content);
      relevantDates = parsedContent.dates || [];
      console.log("[Main] Parsed relevant dates:", relevantDates);
    } catch (error) {
      console.error("[Main] Error parsing GPT response:", error);
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    // Formata as datas para o formato esperado
    const formattedDates = [...generalDates, ...filteredDates].map(date => ({
      date: date.data?.split('T')[0] || '',
      title: date.descrição || '',
      category: date.tipo?.toLowerCase() || 'commemorative',
      description: date.descrição || ''
    }));

    console.log("[Main] Final formatted dates:", formattedDates);

    return new Response(
      JSON.stringify({ dates: formattedDates }),
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