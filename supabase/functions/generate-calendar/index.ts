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
      console.error('Invalid niches array:', niches);
      throw new Error('Invalid or empty niches array provided');
    }

    console.log('Generating calendar for niches:', niches);

    if (!openAIApiKey) {
      console.error('OpenAI API key is not configured');
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
            content: `You are a helpful assistant that generates seasonal marketing calendars for businesses in Brazil. 
            You focus on Brazilian market dates and opportunities. Always respond with valid JSON arrays containing date objects.
            Each date object must have exactly these properties: date (YYYY-MM-DD format), title (string), category (either "commemorative", "holiday", or "optional"), and description (string).`
          },
          {
            role: 'user',
            content: `Generate a list of important seasonal dates for the following business niches: ${niches.join(', ')}. 
            Include at least 5 dates per niche, focusing on Brazilian holidays and commemorative dates.
            
            The response must be a JSON array of objects with this exact format:
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
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data, null, 2));

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response format:', data);
      throw new Error('Invalid response format from OpenAI');
    }

    let dates;
    try {
      dates = JSON.parse(data.choices[0].message.content);
      
      if (!Array.isArray(dates)) {
        console.error('Generated content is not an array:', dates);
        throw new Error('Generated content is not an array');
      }

      // Validate each date object
      const isValidDate = (date: any) => {
        return (
          date &&
          typeof date === 'object' &&
          typeof date.date === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(date.date) &&
          typeof date.title === 'string' &&
          ['commemorative', 'holiday', 'optional'].includes(date.category) &&
          typeof date.description === 'string'
        );
      };

      if (!dates.every(isValidDate)) {
        console.error('Invalid date objects found:', dates);
        throw new Error('Invalid date object structure');
      }

    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw content:', data.choices[0].message.content);
      throw new Error('Failed to parse AI response');
    }

    return new Response(JSON.stringify({ dates }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-calendar function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate calendar dates',
        details: 'If this error persists, please try again with different niches or contact support.'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});