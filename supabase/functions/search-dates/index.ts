import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from 'https://esm.sh/openai@4.28.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  console.log('Function called with method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { niches } = await req.json();
    console.log('Received niches:', niches);
    
    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Invalid or empty niches array provided');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Fetching dates from database...');
    
    // Pre-filter dates at database level using OR conditions for each niche
    // Note the corrected column names with spaces
    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*')
      .or(niches.map(niche => `"nicho 1".eq.${niche},"nicho 2".eq.${niche},"nicho 3".eq.${niche}`).join(','));

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    if (!allDates || allDates.length === 0) {
      console.log('No dates found in database');
      return new Response(
        JSON.stringify({ dates: [] }),
        { headers: corsHeaders }
      );
    }

    console.log(`Found ${allDates.length} potential dates in database`);

    // Simplify the data structure to reduce tokens
    const formattedDates = allDates.map(date => ({
      date: date.data,
      title: date.descrição,
      category: date.tipo || 'commemorative',
      niches: [date["nicho 1"], date["nicho 2"], date["nicho 3"]].filter(Boolean)
    }));

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({
      apiKey: openaiKey,
    });

    console.log('Calling OpenAI API...');

    const prompt = `
    Você é um especialista em filtrar datas comemorativas para negócios.
    Analise estas datas e retorne APENAS as que têm conexão DIRETA e COMERCIAL com os nichos: ${niches.join(', ')}.

    REGRAS:
    1. Retorne SOMENTE datas com relevância comercial DIRETA
    2. Exclua datas com conexões indiretas ou subjetivas
    3. A data deve representar uma clara oportunidade de negócio

    Aqui estão as datas pré-filtradas do banco:
    ${JSON.stringify(formattedDates)}

    Retorne apenas as datas relevantes em JSON com os campos:
    - date (YYYY-MM-DD)
    - title (string)
    - description (string)
    - category (commemorative, holiday, ou optional)`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em filtrar datas comemorativas para negócios. Seja EXTREMAMENTE rigoroso e retorne apenas datas com conexão DIRETA e COMERCIAL com os nichos solicitados."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    console.log('OpenAI response received');

    if (!response) {
      throw new Error('Empty response from OpenAI');
    }

    const filteredDates = JSON.parse(response).dates || [];
    console.log(`Filtered ${filteredDates.length} relevant dates`);

    return new Response(
      JSON.stringify({ dates: filteredDates }), 
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while processing your request',
        details: error.stack || 'No stack trace available'
      }),
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
});