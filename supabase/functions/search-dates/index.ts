import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.3.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openai = new OpenAIApi(new Configuration({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
}));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niches } = await req.json();
    console.log("Received niches:", niches);

    // Fetch dates from Supabase
    const { data: dates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*');

    if (dbError) throw dbError;

    // Format dates for GPT
    const formattedDates = dates.map(date => ({
      date: date.data,
      title: date.descrição,
      type: date.tipo,
      niches: [date['nicho 1'], date['nicho 2'], date['nicho 3']].filter(Boolean)
    }));

    // Create prompt for GPT
    const prompt = `Given these dates and niches (${niches.join(', ')}), return only the relevant dates in this exact JSON format:
    {
      "dates": [
        {
          "date": "YYYY-MM-DD",
          "title": "Full title of the date",
          "category": "commemorative",
          "description": "Description of the date"
        }
      ]
    }
    
    Dates to analyze: ${JSON.stringify(formattedDates)}`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that analyzes dates and returns relevant ones based on business niches."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const response = completion.data.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    console.log("OpenAI response:", response);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate and format the response
    if (!parsedResponse.dates || !Array.isArray(parsedResponse.dates)) {
      throw new Error('Invalid response format from OpenAI');
    }

    const validatedDates = parsedResponse.dates.map(date => ({
      date: date.date,
      title: date.title || dates.find(d => d.data === date.date)?.descrição || '',
      category: date.category || 'commemorative',
      description: date.description || date.title || ''
    }));

    return new Response(
      JSON.stringify({ dates: validatedDates }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in search-dates function:', error);
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