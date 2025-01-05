import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RETRY_AFTER_MS = 3000; // Increased to 3 seconds
const MAX_RETRIES = 3;
const BACKOFF_MULTIPLIER = 1.5; // Each retry will wait longer

async function callOpenAIWithRetry(prompt: string, retryCount = 0): Promise<any> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  const waitTime = RETRY_AFTER_MS * Math.pow(BACKOFF_MULTIPLIER, retryCount);
  
  try {
    console.log(`[DEBUG] Attempt ${retryCount + 1}/${MAX_RETRIES} to call OpenAI API`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are a marketing expert. Return only a JSON array of relevant dates.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5, // Reduced for more consistent outputs
      }),
    });

    if (!response.ok) {
      console.error(`[ERROR] OpenAI API response status: ${response.status}`);
      const errorText = await response.text();
      console.error(`[ERROR] OpenAI API error details:`, errorText);

      if (response.status === 429 && retryCount < MAX_RETRIES) {
        console.log(`[INFO] Rate limited, waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return callOpenAIWithRetry(prompt, retryCount + 1);
      }

      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[DEBUG] Successfully received OpenAI API response`);
    return data;

  } catch (error) {
    console.error(`[ERROR] Error in OpenAI API call:`, error);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`[INFO] Retrying after error, waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return callOpenAIWithRetry(prompt, retryCount + 1);
    }
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niches } = await req.json();
    console.log("[DEBUG] Processing request for niches:", niches);

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Niches array is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error("[ERROR] Missing environment variables");
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("[DEBUG] Supabase client initialized");

    // Fetch all dates from the database
    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*');

    if (dbError) {
      console.error('[ERROR] Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!allDates || allDates.length === 0) {
      console.log("[INFO] No dates found in database");
      return new Response(
        JSON.stringify({ dates: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[DEBUG] Found ${allDates.length} dates in database`);

    // Format dates for GPT analysis - simplified to reduce tokens
    const datesForAnalysis = allDates.map(date => ({
      date: date.data,
      title: date.descrição,
      category: date.tipo?.toLowerCase() || 'commemorative'
    }));

    const userPrompt = `Return a JSON array of dates from this list that are relevant for these niches: ${niches.join(', ')}.
Dates: ${JSON.stringify(datesForAnalysis)}
Return ONLY the JSON array, no other text.`;

    console.log("[DEBUG] Sending request to GPT");

    const gptData = await callOpenAIWithRetry(userPrompt);
    console.log("[DEBUG] Received GPT response");

    if (!gptData.choices?.[0]?.message?.content) {
      console.error('[ERROR] Invalid GPT response structure:', gptData);
      throw new Error('Invalid GPT response structure');
    }

    try {
      const gptContent = gptData.choices[0].message.content.trim();
      console.log("[DEBUG] Raw GPT content:", gptContent);

      let relevantDates;
      try {
        relevantDates = JSON.parse(gptContent);
      } catch (firstError) {
        console.error('[ERROR] First parse attempt failed:', firstError);
        const jsonMatch = gptContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          relevantDates = JSON.parse(jsonMatch[0]);
        } else {
          console.error('[ERROR] Failed to parse GPT content:', firstError);
          console.error('[ERROR] GPT content was:', gptContent);
          throw new Error('Failed to parse GPT response as JSON');
        }
      }

      if (!Array.isArray(relevantDates)) {
        console.error('[ERROR] GPT response is not an array:', relevantDates);
        throw new Error('GPT response is not an array');
      }

      const formattedDates = relevantDates
        .filter(date => allDates.some(d => d.data === date.date))
        .map(date => {
          const originalDate = allDates.find(d => d.data === date.date);
          if (!originalDate) {
            console.warn(`[WARN] Could not find original date for ${date.date}`);
            return null;
          }
          return {
            date: date.date,
            title: originalDate.descrição,
            category: originalDate.tipo?.toLowerCase() || 'commemorative',
            description: originalDate.descrição
          };
        })
        .filter(date => date !== null);

      console.log(`[INFO] Returning ${formattedDates.length} relevant dates`);

      return new Response(
        JSON.stringify({ dates: formattedDates }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('[ERROR] Error processing GPT response:', error);
      throw error;
    }

  } catch (error) {
    console.error('[ERROR] Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});