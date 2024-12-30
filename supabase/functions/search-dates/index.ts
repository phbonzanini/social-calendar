import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from 'https://esm.sh/openai@4.28.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const { niches } = await req.json();
    console.log('Received niches:', niches);
    
    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Invalid or empty niches array provided');
    }

    // Configurar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching dates from database...');
    
    // Buscar todas as datas da tabela
    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*');

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    if (!allDates || allDates.length === 0) {
      console.log('No dates found in database');
      return new Response(
        JSON.stringify({ dates: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${allDates.length} dates in database`);

    // Preparar as datas para o ChatGPT
    const formattedDates = allDates.map(date => ({
      date: date.data,
      title: date.descrição,
      description: date.descrição,
      category: date.tipo || 'commemorative',
      nicho1: date["nicho 1"],
      nicho2: date["nicho 2"],
      nicho3: date["nicho 3"]
    }));

    if (!Deno.env.get('OPENAI_API_KEY')) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')!,
    });

    console.log('Calling OpenAI API...');

    const prompt = `
    Você é um assistente especializado em filtrar datas comemorativas para negócios. Sua tarefa é analisar uma lista de datas e retornar APENAS aquelas que têm uma conexão DIRETA e COMERCIALMENTE RELEVANTE com os nichos especificados.

    REGRAS IMPORTANTES:
    1. Retorne APENAS datas que já estão marcadas com os nichos solicitados nas colunas nicho1, nicho2 ou nicho3
    2. Se uma data não estiver explicitamente marcada com o nicho nas colunas, NÃO a inclua
    3. NÃO crie novas datas ou modifique as existentes
    4. NÃO faça conexões subjetivas ou indiretas

    EXEMPLO PARA O NICHO "MODA":
    ✅ INCLUIR: "Dia do Estilista", "Dia da Costureira"
    ❌ NÃO INCLUIR: "Dia da Beleza", "Dia do Consumidor"

    Aqui está a lista de datas da nossa base de dados:
    ${JSON.stringify(formattedDates, null, 2)}

    Por favor, analise estas datas e retorne APENAS as que são diretamente relevantes para os seguintes nichos: ${niches.join(', ')}.

    Retorne apenas as datas relevantes em formato JSON, mantendo apenas os campos:
    - date (YYYY-MM-DD)
    - title (string)
    - description (string)
    - category (commemorative, holiday, ou optional)`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em filtrar datas comemorativas para negócios. Você deve ser extremamente criterioso e retornar apenas datas com conexão direta e comercial com os nichos solicitados."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
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
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
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
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});