import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import OpenAI from 'https://esm.sh/openai@4.28.0';

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
    console.log('Buscando datas para os nichos:', niches);

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou não fornecidos');
    }

    // Primeiro, buscar todas as datas do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar todas as datas da tabela datas_2025
    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*');

    if (dbError) {
      console.error('Erro ao buscar datas do Supabase:', dbError);
      throw dbError;
    }

    if (!allDates || allDates.length === 0) {
      console.log('Nenhuma data encontrada na tabela');
      return new Response(
        JSON.stringify({ dates: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar o ChatGPT para filtrar as datas mais relevantes para os nichos selecionados
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')!,
    });

    // Converter as datas do Supabase para o formato que vamos usar
    const availableDates = allDates.map(date => ({
      date: date.data,
      title: date.descrição,
      description: date.descrição,
      category: date.tipo || 'commemorative',
      nicho1: date["nicho 1"],
      nicho2: date["nicho 2"],
      nicho3: date["nicho 3"]
    }));

    const prompt = `Aqui está uma lista de datas comemorativas da nossa base de dados:
    ${JSON.stringify(availableDates, null, 2)}

    Por favor, analise estas datas e selecione APENAS as que são relevantes para os seguintes nichos: ${niches.join(', ')}.
    Uma data é relevante se um dos nichos solicitados aparecer em qualquer uma das colunas nicho1, nicho2 ou nicho3.

    Retorne apenas as datas relevantes em formato JSON, mantendo apenas os campos:
    - date (YYYY-MM-DD)
    - title (string)
    - description (string)
    - category (commemorative, holiday, ou optional)

    Não crie novas datas, use APENAS as datas fornecidas acima.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em filtrar datas comemorativas. Sua função é analisar datas existentes e selecionar apenas as relevantes para os nichos especificados. Não crie novas datas."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    console.log('Datas encontradas:', response);

    if (!response) {
      throw new Error('Resposta vazia do ChatGPT');
    }

    const filteredDates = JSON.parse(response).dates || [];

    return new Response(
      JSON.stringify({ dates: filteredDates }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Erro ao processar a busca de datas.'
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});