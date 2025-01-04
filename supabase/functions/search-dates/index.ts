import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openAIApiKey) {
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

    // Format dates for GPT analysis
    const datesForAnalysis = allDates.map(date => ({
      date: date.data,
      title: date.descrição,
      category: date.tipo
    }));

    const systemPrompt = `You are a marketing expert that helps identify relevant commemorative dates for different business niches. You will analyze dates and determine their relevance for specific niches. You must return ONLY a JSON array with the relevant dates.`;

    const userPrompt = `Analyze these commemorative dates and determine which ones are relevant for these niches: ${niches.join(', ')}.

Dates to analyze:
${JSON.stringify(datesForAnalysis, null, 2)}

Return ONLY a JSON array with the relevant dates in this exact format:
[
  {
    "date": "2025-01-01",
    "title": "New Year's Day",
    "category": "holiday"
  }
]`;

    console.log("[DEBUG] Sending request to GPT");

    // Call GPT API
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!gptResponse.ok) {
      const errorText = await gptResponse.text();
      console.error('[ERROR] GPT API error:', errorText);
      throw new Error(`OpenAI API error: ${gptResponse.status}`);
    }

    const gptData = await gptResponse.json();
    console.log("[DEBUG] Received GPT response");

    if (!gptData.choices?.[0]?.message?.content) {
      console.error('[ERROR] Invalid GPT response structure:', gptData);
      throw new Error('Invalid GPT response structure');
    }

    try {
      const gptContent = gptData.choices[0].message.content;
      console.log("[DEBUG] Raw GPT content:", gptContent);

      let relevantDates;
      try {
        relevantDates = JSON.parse(gptContent);
      } catch (parseError) {
        console.error('[ERROR] Failed to parse GPT content:', parseError);
        console.error('[ERROR] GPT content was:', gptContent);
        throw new Error('Failed to parse GPT response as JSON');
      }

      if (!Array.isArray(relevantDates)) {
        console.error('[ERROR] GPT response is not an array:', relevantDates);
        throw new Error('GPT response is not an array');
      }

      // Map back to original date format
      const formattedDates = relevantDates.map(date => {
        const originalDate = allDates.find(d => d.data === date.date);
        if (!originalDate) {
          console.warn(`[WARN] Could not find original date for ${date.date}`);
          return {
            date: date.date,
            title: date.title,
            category: date.category || 'commemorative',
            description: date.description || date.title
          };
        }
        return {
          date: date.date,
          title: originalDate.descrição,
          category: originalDate.tipo?.toLowerCase() || 'commemorative',
          description: date.description || originalDate.descrição
        };
      });

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
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : 'No stack trace available'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});