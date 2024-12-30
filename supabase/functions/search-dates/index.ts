import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from 'https://esm.sh/openai@4.28.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
      throw new Error('Nenhum nicho selecionado');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente não configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Buscando datas no banco de dados...');

    // Create an array of OR conditions for each niche
    const orConditions = niches.flatMap(niche => [
      { 'nicho 1': niche },
      { 'nicho 2': niche },
      { 'nicho 3': niche }
    ]);

    // Execute the query with proper OR conditions
    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*')
      .or(orConditions.map(condition => 
        `${Object.keys(condition)[0]}.eq.${Object.values(condition)[0]}`
      ).join(','));

    if (dbError) {
      console.error('Erro no banco de dados:', dbError);
      throw dbError;
    }

    if (!allDates || allDates.length === 0) {
      console.log('Nenhuma data encontrada');
      return new Response(
        JSON.stringify({ dates: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Datas encontradas:', allDates);

    // Format dates for OpenAI processing
    const formattedDates = allDates.map(date => ({
      date: date.data,
      title: date.descrição,
      category: date.tipo || 'commemorative',
      description: date.descrição
    }));

    // Using OpenAI to filter the most relevant dates
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    const prompt = `
    Analise estas datas comemorativas e retorne APENAS as que têm conexão DIRETA e COMERCIAL com os nichos: ${niches.join(', ')}.

    REGRAS IMPORTANTES:
    1. Retorne SOMENTE datas com relevância comercial DIRETA para os nichos
    2. Exclua datas com conexões indiretas ou subjetivas
    3. A data deve representar uma clara oportunidade de negócio
    4. Mantenha a descrição original da data

    Datas disponíveis:
    ${JSON.stringify(formattedDates)}

    Retorne apenas as datas relevantes em formato JSON com os campos:
    {
      "dates": [
        {
          "date": "YYYY-MM-DD",
          "title": "string",
          "description": "string",
          "category": "commemorative | holiday | optional"
        }
      ]
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em filtrar datas comemorativas para negócios. Seja EXTREMAMENTE rigoroso e retorne apenas datas com conexão DIRETA e COMERCIAL com os nichos solicitados."
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
    console.log('Resposta do OpenAI recebida');

    if (!response) {
      throw new Error('Resposta vazia do OpenAI');
    }

    const filteredDates = JSON.parse(response).dates || [];
    console.log(`Filtrado para ${filteredDates.length} datas relevantes`);

    return new Response(
      JSON.stringify({ dates: filteredDates }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Ocorreu um erro ao processar sua solicitação',
        details: error.stack || 'Stack trace não disponível'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});