import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

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

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

async function callOpenAIWithRetry(prompt: string, retryCount = 0): Promise<any> {
  try {
    console.log(`[OpenAI] Attempt ${retryCount + 1}/${MAX_RETRIES}`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using the faster model to reduce rate limits
        messages: [
          { 
            role: 'system', 
            content: 'You are a JSON-only response bot. Return a JSON object with a "dates" array containing relevant dates.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[OpenAI] Error status: ${response.status}`);
      console.error('[OpenAI] Error details:', errorText);

      if (response.status === 429 && retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`[OpenAI] Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return callOpenAIWithRetry(prompt, retryCount + 1);
      }

      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[OpenAI] Response received:', data);
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('[OpenAI] Error:', error);
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`[OpenAI] Error occurred. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callOpenAIWithRetry(prompt, retryCount + 1);
    }
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[Main] Received request");
    
    if (!req.body) {
      throw new Error('Request body is required');
    }

    const { niches } = await req.json();
    console.log("[Main] Received niches:", niches);

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('No niches provided');
    }

    const translatedNiches = niches.map(niche => {
      const translated = nicheMapping[niche]?.toLowerCase();
      console.log(`[Main] Translating niche ${niche} to ${translated}`);
      return translated || niche.toLowerCase();
    });

    console.log("[Main] Translated niches:", translatedNiches);

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

    const datesForGPT = dates.map(date => ({
      date: date.data,
      description: date.descrição,
      niches: [date['nicho 1'], date['nicho 2'], date['nicho 3']].filter(Boolean)
    }));

    const prompt = `Analyze these dates and return only those relevant to these niches: ${translatedNiches.join(', ')}. 
      Dates: ${JSON.stringify(datesForGPT)}
      Return a JSON object with a "dates" array containing objects with: date, title, category (always "commemorative"), and description.`;

    const gptData = await callOpenAIWithRetry(prompt);
    console.log("[Main] GPT Response:", gptData);

    let relevantDates = [];
    if (Array.isArray(gptData.dates)) {
      relevantDates = gptData.dates;
    } else {
      console.error("[Main] Invalid GPT response format - dates is not an array:", gptData);
      relevantDates = [];
    }

    // Add general important dates
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
      category: 'commemorative',
      description: date.descrição || ''
    }));

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