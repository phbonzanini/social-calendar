import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Prepara os dados para o GPT
    const datesForGPT = dates.map(date => ({
      date: date.data,
      description: date.descrição,
      type: date.tipo,
      niches: [date['nicho 1'], date['nicho 2'], date['nicho 3']].filter(Boolean)
    }));

    // Chama a API do GPT para filtrar as datas relevantes
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes dates and their relevance to specific business niches. Please return your response in JSON format.'
          },
          {
            role: 'user',
            content: `Please analyze these dates and return only the ones that are relevant to these niches: ${translatedNiches.join(', ')}. 
            Here are the dates: ${JSON.stringify(datesForGPT)}. 
            Return the response as a JSON array with objects containing: date, title, category, and description.
            Response must be in valid JSON format.`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!gptResponse.ok) {
      const errorData = await gptResponse.json();
      console.error("[Main] OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${gptResponse.status} - ${JSON.stringify(errorData)}`);
    }

    const gptData = await gptResponse.json();
    console.log("[Main] GPT Response:", gptData);

    let relevantDates = [];
    try {
      relevantDates = JSON.parse(gptData.choices[0].message.content).dates;
    } catch (error) {
      console.error("[Main] Error parsing GPT response:", error);
      throw new Error('Failed to parse GPT response');
    }

    // Adiciona datas gerais importantes
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
    }).map(date => ({
      date: date.data,
      title: date.descrição || '',
      category: date.tipo?.toLowerCase() || 'commemorative',
      description: date.descrição || ''
    }));

    // Combina e remove duplicatas
    const allDates = [...generalDates, ...relevantDates];
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