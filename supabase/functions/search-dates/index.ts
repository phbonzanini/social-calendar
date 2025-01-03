import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import OpenAI from 'https://esm.sh/openai@4.28.0';

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

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Niches array is required');
    }

    console.log('Processing request for niches:', niches);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openaiApiKey) {
      throw new Error('Missing environment variables');
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch only relevant dates based on niches
    const { data: relevantDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('data, descrição, tipo')
      .or(`nicho1.eq.${niches.join(',')},nicho2.eq.${niches.join(',')},nicho3.eq.${niches.join(',')}`);

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    if (!relevantDates || relevantDates.length === 0) {
      console.log('No dates found');
      return new Response(
        JSON.stringify({ dates: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${relevantDates.length} dates`);

    // Limit the number of dates to reduce token usage
    const limitedDates = relevantDates.slice(0, 10);

    const prompt = `
    Select relevant dates for these niches: ${niches.join(', ')}
    Return JSON format: {"dates":[{"date":"YYYY-MM-DD","title":"Title","category":"Type","description":"Description"}]}
    Dates: ${JSON.stringify(limitedDates)}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that filters and returns relevant dates in JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content;
    console.log('GPT response received');

    try {
      const parsedDates = JSON.parse(response);
      return new Response(
        JSON.stringify(parsedDates),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error parsing GPT response:', error);
      throw new Error('Invalid response format from GPT');
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});