import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
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

    console.log("Formatted dates for GPT:", formattedDates);

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

    // Call OpenAI API directly
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
            content: 'You are a helpful assistant that analyzes dates and returns relevant ones based on business niches.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const openAIResponse = await response.json();
    console.log("Raw OpenAI response:", openAIResponse);

    const content = openAIResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content);
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

    console.log("Validated dates:", validatedDates);

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