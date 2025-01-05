import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from './cors.ts';
import { callOpenAI } from './openai.ts';
import { filterDatesByNiches, formatDatesForGPT, validateAndFormatDates } from './dateFilters.ts';
import { buildGPTPrompt } from './gptPrompt.ts';
import { DateEntry } from './types.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[search-dates] Processing request');
    const { niches } = await req.json();
    
    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Niches array is required');
    }

    console.log('[search-dates] Selected niches:', niches);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch dates from DB
    console.log('[search-dates] Fetching dates from DB');
    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*')
      .order('data', { ascending: true });

    if (dbError) {
      console.error('[search-dates] Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!allDates || allDates.length === 0) {
      console.warn('[search-dates] No dates found in database');
      return new Response(
        JSON.stringify({ dates: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pre-filter dates based on niches
    const preFilteredDates = filterDatesByNiches(allDates as DateEntry[], niches);
    console.log(`[search-dates] Pre-filtered to ${preFilteredDates.length} dates based on niche columns`);
    
    if (preFilteredDates.length === 0) {
      console.log('[search-dates] No dates found after pre-filtering, returning empty array');
      return new Response(
        JSON.stringify({ dates: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format dates for GPT analysis
    const datesContent = formatDatesForGPT(preFilteredDates);
    const prompt = buildGPTPrompt(niches, datesContent);

    // Get GPT analysis
    console.log('[search-dates] Calling OpenAI for strict date filtering');
    const gptData = await callOpenAI(prompt);

    if (!gptData.choices?.[0]?.message?.content) {
      console.error('[search-dates] Invalid GPT response:', gptData);
      throw new Error('Invalid GPT response structure');
    }

    const gptContent = gptData.choices[0].message.content.trim();
    console.log('[search-dates] Raw GPT response:', gptContent);
    
    // Parse and validate GPT response
    let relevantDates;
    try {
      relevantDates = JSON.parse(gptContent);
    } catch (error) {
      console.error('[search-dates] Failed to parse GPT response:', error);
      const jsonMatch = gptContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          relevantDates = JSON.parse(jsonMatch[0]);
        } catch (secondError) {
          console.error('[search-dates] Second parse attempt failed:', secondError);
          throw new Error('Failed to parse GPT response as JSON');
        }
      } else {
        throw new Error('Failed to parse GPT response as JSON');
      }
    }

    console.log(`[search-dates] GPT returned ${relevantDates.length} relevant dates`);

    // Final validation and formatting
    const formattedDates = validateAndFormatDates(relevantDates, allDates as DateEntry[], niches);
    console.log(`[search-dates] Final filtered dates count: ${formattedDates.length}`);
    
    return new Response(
      JSON.stringify({ dates: formattedDates }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});