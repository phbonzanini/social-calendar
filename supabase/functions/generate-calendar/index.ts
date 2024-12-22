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
    console.log('Using OpenAI API Key:', openAIApiKey ? 'Present' : 'Missing');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

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
            content: 'You are a helpful assistant that generates seasonal marketing calendars for businesses in Brazil. You focus on Brazilian market dates and opportunities. Always respond with valid JSON arrays.'
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
            Include at least 5 dates per niche, focusing on Brazilian holidays and commemorative dates.
            
            Example of expected format:
            [
              {
                "date": "2024-12-25",
                "title": "Natal",
                "category": "holiday",
                "description": "Uma das principais datas comemorativas para vendas no varejo."
              }
            ]`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response structure:', JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response format:', data);
      throw new Error('Invalid response format from AI');
    }

    const generatedText = data.choices[0].message.content;
    console.log('Generated text:', generatedText);

    try {
      const dates = JSON.parse(generatedText);
      
      if (!Array.isArray(dates)) {
        console.error('Generated content is not an array:', dates);
        throw new Error('Generated content is not an array');
      }

      // Validate the structure of each date object
      const isValidDate = (date: any) => {
        return date.date && date.title && date.category && date.description &&
               ['commemorative', 'holiday', 'optional'].includes(date.category);
      };

      if (!dates.every(isValidDate)) {
        console.error('Invalid date object structure detected:', dates);
        throw new Error('Invalid date object structure');
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