import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'https://esm.sh/openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { niches } = await req.json();

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Niches array is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openaiApiKey) {
      throw new Error('Missing environment variables');
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching relevant dates...');

    // Only fetch dates for the selected niches to reduce data
    const { data: relevantDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('data, descrição, tipo')
      .or(`nicho1.eq.${niches.join(',')},nicho2.eq.${niches.join(',')},nicho3.eq.${niches.join(',')}`)
      .order('data');

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

    // Simplified data structure
    const formattedDates = relevantDates.map(date => ({
      d: date.data,
      t: date.descrição,
      c: date.tipo || 'commemorative'
    }));

    const prompt = `
    Return only relevant dates for these niches: ${niches.join(', ')}

    Rules:
    1. Include holidays (type='holiday')
    2. Include optional days (type='optional')
    3. Include universal dates (Mother's Day, Father's Day, Christmas, New Year, Black Friday)
    4. Include dates directly related to the niches
    5. Exclude indirect connections
    6. Exclude duplicates

    Dates: ${JSON.stringify(formattedDates)}

    Return JSON: {"dates":[{"date":"YYYY-MM-DD","title":"Title","category":"Type","description":"Description"}]}
    `;

    console.log('Sending prompt to GPT...');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
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
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content;
    console.log('Received response from GPT');

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
      JSON.stringify({ error: error.message, details: error.toString() }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});