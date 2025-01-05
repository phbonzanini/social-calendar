import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './cors.ts';
import { callOpenAI } from './openai.ts';
import { fetchDatesFromDB, formatDatesForAnalysis, parseRelevantDates } from './dateUtils.ts';

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

    const allDates = await fetchDatesFromDB();
    console.log(`[DEBUG] Found ${allDates.length} dates in database`);

    const datesForAnalysis = formatDatesForAnalysis(allDates);
    const userPrompt = `Return a JSON array of dates from this list that are relevant for these niches: ${niches.join(', ')}.
Dates: ${JSON.stringify(datesForAnalysis)}
Return ONLY the JSON array, no other text.`;

    console.log("[DEBUG] Sending request to GPT");
    const gptData = await callOpenAI(userPrompt);
    console.log("[DEBUG] Received GPT response");

    if (!gptData.choices?.[0]?.message?.content) {
      console.error('[ERROR] Invalid GPT response structure:', gptData);
      throw new Error('Invalid GPT response structure');
    }

    const gptContent = gptData.choices[0].message.content.trim();
    console.log("[DEBUG] Raw GPT content:", gptContent);

    const relevantDates = parseRelevantDates(gptContent);

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