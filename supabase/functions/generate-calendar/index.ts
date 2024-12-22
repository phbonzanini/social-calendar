import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niches } = await req.json();
    
    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      console.error('Invalid or empty niches array received:', niches);
      throw new Error('Invalid niches provided');
    }

    console.log('Generating calendar for niches:', niches);

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
            content: 'You are a helpful assistant that generates seasonal marketing calendars for businesses in Brazil. You focus on Brazilian market dates and opportunities.'
          },
          { 
            role: 'user', 
            content: `Generate a list of important seasonal dates for the following business niches: ${niches.join(', ')}. 
            For each date, provide:
            - The date (in YYYY-MM-DD format)
            - A title
            - A category (either "commemorative", "holiday", or "optional")
            - A brief description of why it's important for the business
            
            Format the response as a JSON array of objects with these exact keys: date, title, category, description.
            Include at least 5 dates per niche, focusing on Brazilian holidays and commemorative dates.`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error('Failed to generate calendar dates');
    }

    const data = await response.json();
    console.log('OpenAI response received:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response format:', data);
      throw new Error('Invalid response format from AI');
    }

    const generatedText = data.choices[0].message.content;
    console.log('Generated text:', generatedText);

    try {
      const dates = JSON.parse(generatedText);
      
      if (!Array.isArray(dates)) {
        throw new Error('Generated content is not an array');
      }

      return new Response(JSON.stringify({ dates }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI response');
    }

  } catch (error) {
    console.error('Error in generate-calendar function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'If this error persists, please try again with different niches or contact support.'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});