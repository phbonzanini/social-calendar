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
  
  // Handle CORS preflight requests
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
        { headers: corsHeaders }
      );
    }

    console.log(`Found ${allDates.length} dates in database`);

    const formattedDates = allDates.map(date => ({
      date: date.data,
      title: date.descrição,
      description: date.descrição,
      category: date.tipo || 'commemorative',
      nicho1: date["nicho 1"],
      nicho2: date["nicho 2"],
      nicho3: date["nicho 3"]
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
    Você é um assistente especializado em filtrar datas comemorativas para negócios, com foco em retornar APENAS datas com relevância comercial DIRETA para os nichos especificados.

    REGRAS CRÍTICAS:
    1. APENAS retorne datas que já estão EXPLICITAMENTE marcadas com os nichos solicitados nas colunas nicho1, nicho2 ou nicho3
    2. Se uma data não estiver marcada com o nicho nas colunas, NÃO a inclua, mesmo que pareça relacionada
    3. NÃO crie novas datas ou modifique as existentes
    4. NUNCA faça conexões indiretas ou subjetivas
    5. Cada data retornada DEVE ter uma clara oportunidade comercial para o nicho

    EXEMPLOS DE FILTRAGEM RIGOROSA:

    Para o nicho "MODA":
    ✅ INCLUIR:
    - Dia do Estilista (conexão direta com profissionais da moda)
    - Dia da Costureira (profissional essencial do setor)
    ❌ NÃO INCLUIR:
    - Dia da Beleza (muito amplo/indireto)
    - Dia do Consumidor (muito genérico)
    - Dia das Mães (mesmo que seja data de vendas)

    Para o nicho "EDUCAÇÃO":
    ✅ INCLUIR:
    - Dia do Professor (profissional central)
    - Dia Mundial da Alfabetização (tema central)
    ❌ NÃO INCLUIR:
    - Dia do Livro (muito genérico)
    - Dia da Cultura (muito amplo)

    Aqui está a lista de datas da nossa base de dados:
    ${JSON.stringify(formattedDates, null, 2)}

    Por favor, analise estas datas e retorne APENAS as que têm conexão DIRETA e COMERCIALMENTE RELEVANTE para os seguintes nichos: ${niches.join(', ')}.

    Retorne apenas as datas relevantes em formato JSON, mantendo apenas os campos:
    - date (YYYY-MM-DD)
    - title (string)
    - description (string)
    - category (commemorative, holiday, ou optional)`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em filtrar datas comemorativas para negócios. Você deve ser EXTREMAMENTE rigoroso e retornar apenas datas com conexão DIRETA e COMERCIAL com os nichos solicitados. Nunca faça conexões indiretas ou subjetivas."
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