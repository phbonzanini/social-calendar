import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './cors.ts';
import { callOpenAI } from './openai.ts';
import { fetchDatesFromDB, formatDatesForAnalysis, parseRelevantDates } from './dateUtils.ts';

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log('[search-dates] Processing request');
    const { niches } = await req.json();
    
    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Niches array is required');
    }

    console.log('[search-dates] Fetching dates from DB');
    const allDates = await fetchDatesFromDB();
    const datesForAnalysis = formatDatesForAnalysis(allDates);
    
    // Simplified prompt focused on filtering existing dates
    const userPrompt = `
    You are a date relevance analyzer. Review these dates and return ONLY those that are relevant for these business niches: ${niches.join(', ')}.
    
    Consider a date relevant if:
    1. It directly relates to the niche
    2. It represents a good marketing opportunity for the niche
    3. It has cultural significance that could be leveraged by the niche
    
    Return the dates in this exact JSON format, maintaining the exact same date format:
    [{ "date": "YYYY-MM-DD", "title": "Original title", "category": "Original category" }]
    
    Dates to analyze: ${JSON.stringify(datesForAnalysis)}`;

    console.log('[search-dates] Calling OpenAI for date filtering');
    const gptData = await callOpenAI(userPrompt);

    if (!gptData.choices?.[0]?.message?.content) {
      console.error('[search-dates] Invalid GPT response:', gptData);
      throw new Error('Invalid GPT response structure');
    }

    const gptContent = gptData.choices[0].message.content.trim();
    console.log('[search-dates] Processing GPT response');
    
    const relevantDates = parseRelevantDates(gptContent);
    if (!Array.isArray(relevantDates)) {
      throw new Error('GPT response is not an array');
    }

    // Only return dates that exist in our database
    const formattedDates = relevantDates
      .filter(date => allDates.some(d => d.data === date.date))
      .map(date => {
        const originalDate = allDates.find(d => d.data === date.date);
        if (!originalDate) return null;
        
        return {
          date: date.date,
          title: originalDate.descrição,
          category: originalDate.tipo?.toLowerCase() || 'commemorative',
          description: originalDate.descrição
        };
      })
      .filter(Boolean);

    console.log(`[search-dates] Returning ${formattedDates.length} filtered dates`);
    
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
    console.error('[search-dates] Error:', error);
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