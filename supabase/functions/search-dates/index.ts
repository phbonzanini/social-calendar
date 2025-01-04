import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

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
      category: date.tipo?.toLowerCase() || 'commemorative'
    }));

    const systemPrompt = `You are a marketing expert that helps identify relevant commemorative dates for different business niches. Analyze the provided dates and determine their relevance for specific niches. You must return ONLY a JSON array containing the relevant dates, with no additional text or explanation.

Each date in the array must follow this exact format:
{
  "date": "YYYY-MM-DD",
  "title": "string",
  "category": "commemorative" | "holiday" | "optional",
  "description": "string"
}`;

    const userPrompt = `Return a JSON array of dates from this list that are relevant for these niches: ${niches.join(', ')}.

Available dates:
${JSON.stringify(datesForAnalysis, null, 2)}

Remember to return ONLY the JSON array, no other text.`;

    console.log("[DEBUG] Sending request to GPT");

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-0125-preview',
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
      const gptContent = gptData.choices[0].message.content.trim();
      console.log("[DEBUG] Raw GPT content:", gptContent);

      let relevantDates;
      try {
        relevantDates = JSON.parse(gptContent);
      } catch (firstError) {
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