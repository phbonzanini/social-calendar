import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import OpenAI from 'https://esm.sh/openai@4.28.0';

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
    console.log('Buscando datas para os nichos:', niches);
    
    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nenhum nicho selecionado');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openaiApiKey) {
      throw new Error('Variáveis de ambiente não configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Buscando todas as datas no banco de dados...');

    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*');

    if (dbError) {
      console.error('Erro no banco de dados:', dbError);
      throw dbError;
    }

    if (!allDates || allDates.length === 0) {
      console.log('Nenhuma data encontrada no banco de dados');
      return new Response(
        JSON.stringify({ dates: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Encontradas ${allDates.length} datas no total`);

    // Formatar as datas para o GPT
    const formattedDates = allDates.map(date => ({
      date: date.data,
      title: date.descrição,
      category: date.tipo || 'commemorative',
      description: date.descrição,
      niches: [date['nicho 1'], date['nicho 2'], date['nicho 3']].filter(Boolean)
    }));

    const openai = new OpenAI({
      apiKey: openaiApiKey
    });

    const prompt = `
    Analise estas datas comemorativas e retorne as datas relevantes seguindo estas regras:

    1. INCLUA AUTOMATICAMENTE todas as datas que são:
       - Feriados nacionais
       - Pontos facultativos
       - Datas universais como: Dia do Cliente, Dia das Mães, Dia dos Pais, Natal, Ano Novo, Black Friday, Cyber Monday, Dia dos Namorados, Dia das Crianças
       
    2. Para as demais datas, inclua as que têm conexão DIRETA e COMERCIAL com os nichos: ${niches.join(', ')}.

    REGRAS IMPORTANTES:
    1. Feriados nacionais e pontos facultativos DEVEM ser incluídos sempre
    2. Datas universais listadas acima DEVEM ser incluídas sempre
    3. Para outras datas, retorne SOMENTE as com relevância comercial DIRETA para os nichos
    4. Exclua datas com conexões indiretas ou subjetivas
    5. A data deve representar uma clara oportunidade de negócio
    6. Mantenha a descrição original da data
    7. Se uma data já tem um dos nichos solicitados em seus campos nicho1, nicho2 ou nicho3, DEVE ser incluída automaticamente

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

    console.log('Enviando prompt para o GPT...');

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em filtrar datas comemorativas para negócios. Inclua SEMPRE feriados nacionais, pontos facultativos e datas universais de varejo, além das datas específicas para os nichos solicitados."
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
    console.log('Resposta do GPT recebida');

    if (!response) {
      throw new Error('Resposta vazia do GPT');
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