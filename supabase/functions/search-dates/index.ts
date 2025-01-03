import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'
import { OpenAI } from "https://esm.sh/openai@4.20.1"

console.log("Hello from Search Dates!")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { niches } = await req.json()

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Niches array is required')
    }

    console.log("Received niches:", niches)

    // Get environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!openaiApiKey || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables')
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch relevant dates based on niches using in operator
    const { data: relevantDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('data, descrição, tipo')
      .or(`nicho_1.in.(${niches.map(n => `'${n}'`).join(',')}),nicho_2.in.(${niches.map(n => `'${n}'`).join(',')}),nicho_3.in.(${niches.map(n => `'${n}'`).join(',')})`)

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log("Found dates:", relevantDates);

    if (!relevantDates || relevantDates.length === 0) {
      return new Response(
        JSON.stringify({ dates: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `
      Given these commemorative dates and holidays for the niches ${niches.join(', ')},
      return only the most relevant ones that could be used for marketing campaigns.
      For each date, provide a short description of why it's relevant and how it could be used.
      Dates: ${JSON.stringify(relevantDates)}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a marketing specialist helping to identify the most relevant dates for marketing campaigns."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const formattedDates = relevantDates.map(date => ({
      date: date.data,
      title: date.descrição,
      category: date.tipo.toLowerCase(),
      description: date.descrição
    }));

    return new Response(
      JSON.stringify({ 
        dates: formattedDates,
        aiSuggestions: completion.choices[0].message.content 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})