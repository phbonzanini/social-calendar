import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { OpenAI } from "https://esm.sh/openai@4.20.1";

console.log("Hello from Search Dates!")

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

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Niches array is required');
    }

    console.log("Buscando datas para os nichos:", niches);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openaiApiKey || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Primeiro, vamos verificar se há dados na tabela
    const { data: sampleData, error: sampleError } = await supabase
      .from('datas_2025')
      .select('*')
      .limit(5);

    console.log("Amostra de dados na tabela:", sampleData);
    
    if (sampleError) {
      console.error("Erro ao verificar dados:", sampleError);
      throw new Error(`Database sample error: ${sampleError.message}`);
    }

    // Construir a query usando filter para cada coluna de nicho
    let query = supabase
      .from('datas_2025')
      .select('*');

    // Adicionar condições OR para cada nicho em cada coluna
    const conditions = [];
    for (const niche of niches) {
      conditions.push(
        `nicho 1.eq.'${niche}'`,
        `nicho 2.eq.'${niche}'`,
        `nicho 3.eq.'${niche}'`
      );
    }

    // Combinar todas as condições com OR
    query = query.or(conditions.join(','));

    // Executar a query
    const { data: relevantDates, error: dbError } = await query;

    console.log("Query executada:", query);
    console.log("Resultados encontrados:", relevantDates?.length || 0);

    if (dbError) {
      console.error('Erro no banco de dados:', dbError);
      throw new Error(`Database error: "${dbError.message}"`);
    }

    if (!relevantDates || relevantDates.length === 0) {
      console.log("Nenhuma data encontrada para os nichos:", niches);
      return new Response(
        JSON.stringify({ 
          dates: [],
          message: "Nenhuma data encontrada para os nichos selecionados",
          debug: { 
            sampleData,
            searchedNiches: niches
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Datas encontradas:", relevantDates);

    // Format the dates found
    const formattedDates = relevantDates.map(date => ({
      date: date.data,
      title: date.descrição,
      category: date.tipo?.toLowerCase() || 'commemorative',
      description: date.descrição
    }));

    // Use GPT-4-mini for suggestions
    const openai = new OpenAI({ apiKey: openaiApiKey });
    const prompt = `
      Com base nestas datas comemorativas e feriados para os nichos ${niches.join(', ')},
      retorne apenas as mais relevantes que poderiam ser usadas para campanhas de marketing.
      Para cada data, forneça uma breve descrição do motivo pelo qual é relevante e como poderia ser usada.
      Datas: ${JSON.stringify(formattedDates)}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-mini",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em marketing ajudando a identificar as datas mais relevantes para campanhas de marketing."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return new Response(
      JSON.stringify({ 
        dates: formattedDates,
        aiSuggestions: completion.choices[0].message.content 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Erro ao processar a requisição"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});