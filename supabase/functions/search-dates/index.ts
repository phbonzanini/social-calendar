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

    // Create a more structured prompt for GPT
    const prompt = `Analyze these dates for the following niches: ${niches.join(', ')}. 
    Return ONLY dates that are relevant to these niches.
    
    The response MUST be a valid JSON object with this EXACT format:
    {
      "dates": [
        {
          "date": "2025-01-01",
          "title": "Title of the date",
          "category": "commemorative",
          "description": "Description of the date"
        }
      ]
    }

    Rules:
    1. Return ONLY a JSON object with a dates array
    2. Each date object MUST have exactly: date, title, category, description
    3. Date format MUST be YYYY-MM-DD
    4. Category MUST be one of: commemorative, holiday, optional
    5. Response MUST be valid JSON with no trailing commas
    
    Dates to analyze: ${JSON.stringify(formattedDates)}`;

    console.log("Sending prompt to OpenAI:", prompt);

    // Call OpenAI API with response_format to ensure JSON
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
            content: 'You are a JSON-only response bot. Return a JSON object with a dates array containing relevant dates based on the provided niches.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0,
        response_format: { type: "json_object" }
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
      console.error("No content in OpenAI response:", openAIResponse);
      throw new Error('No content in OpenAI response');
    }

    console.log("Content from OpenAI:", content);

    let parsedResponse;
    try {
      // If content is already an object, use it directly
      parsedResponse = typeof content === 'string' ? JSON.parse(content) : content;
      
      // Validate response structure
      if (!parsedResponse.dates || !Array.isArray(parsedResponse.dates)) {
        console.error("Invalid response structure:", parsedResponse);
        throw new Error('Response must contain a dates array');
      }
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      console.error("Raw content:", content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate and format each date
    const validatedDates = parsedResponse.dates
      .filter(date => {
        const isValid = date && 
                       typeof date.date === 'string' && 
                       typeof date.title === 'string' &&
                       typeof date.category === 'string' &&
                       typeof date.description === 'string';
        
        if (!isValid) {
          console.warn("Filtered out invalid date:", date);
        }
        return isValid;
      })
      .map(date => ({
        date: date.date,
        title: date.title || dates.find(d => d.data === date.date)?.descrição || 'Untitled Date',
        category: date.category || 'commemorative',
        description: date.description || date.title || ''
      }));

    console.log("Final validated dates:", validatedDates);

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