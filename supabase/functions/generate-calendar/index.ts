import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    const prompt = `Generate a list of important seasonal dates for the following business niches: ${niches.join(', ')}. 
    For each date, provide:
    - The date (in YYYY-MM-DD format)
    - A title
    - A category (either "commemorative", "holiday", or "optional")
    - A brief description of why it's important for the business
    
    Format the response as a JSON array of objects with these exact keys: date, title, category, description.
    Include at least 5 dates per niche, focusing on Brazilian holidays and commemorative dates.`;

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
            content: 'You are a helpful assistant that generates seasonal marketing calendars for businesses. You focus on Brazilian market dates and opportunities.'
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    // Parse the JSON string from the response
    const dates = JSON.parse(generatedText);

    return new Response(JSON.stringify({ dates }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-calendar function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});