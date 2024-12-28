import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import OpenAI from 'https://esm.sh/openai@4.28.0';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log('Received niches:', niches);

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou não fornecidos');
    }

    // Primeiro, buscar todas as datas do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*')
      .or(niches.map(niche => 
        `"nicho 1".eq.'${niche}',` +
        `"nicho 2".eq.'${niche}',` +
        `"nicho 3".eq.'${niche}'`
      ).join(','));

    if (dbError) {
      console.error('Erro ao buscar datas do Supabase:', dbError);
      throw dbError;
    }

    console.log('Datas encontradas no Supabase:', allDates);

    // Se não encontrou datas no Supabase, usar o ChatGPT para ajudar a filtrar
    if (!allDates || allDates.length === 0) {
      console.log('Nenhuma data encontrada no Supabase, usando ChatGPT para assistência');
      
      const openai = new OpenAI({
        apiKey: Deno.env.get('OPENAI_API_KEY')!,
      });

      const prompt = `Com base nas datas comemorativas do ano de 2025 disponíveis no banco de dados, 
      selecione as datas mais relevantes para os seguintes nichos: ${niches.join(', ')}. 
      
      Formate a resposta como um array JSON com objetos contendo:
      - date (YYYY-MM-DD)
      - title (string)
      - description (string)
      - category (commemorative, holiday, ou optional)
      
      Use apenas datas reais e relevantes para os nichos mencionados.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em marketing e datas comemorativas. Ajude a selecionar as datas mais relevantes do banco de dados para os nichos específicos."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content;
      console.log('Resposta do ChatGPT:', response);

      if (!response) {
        throw new Error('Resposta vazia do ChatGPT');
      }

      const parsedDates = JSON.parse(response).dates || [];
      console.log('Datas processadas:', parsedDates);

      return new Response(
        JSON.stringify({ dates: parsedDates }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          } 
        }
      );
    }

    // Formatar as datas do Supabase
    const formattedDates = allDates.map(date => ({
      date: date.data,
      title: date.descrição,
      category: date.tipo || 'commemorative', // Valor padrão caso não exista
      description: date.descrição
    }));

    return new Response(
      JSON.stringify({ dates: formattedDates }),
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