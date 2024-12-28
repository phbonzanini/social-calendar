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

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')!,
    });

    const prompt = `Gere uma lista de 10 datas comemorativas relevantes para os seguintes nichos: ${niches.join(', ')}. 
    Para cada data, forneça:
    1. A data no formato YYYY-MM-DD (use o ano 2025)
    2. O título do evento
    3. Uma breve descrição
    4. A categoria (use apenas: commemorative, holiday, ou optional)
    
    Responda apenas em formato JSON, seguindo este exemplo:
    [
      {
        "date": "2025-01-01",
        "title": "Dia Mundial da Paz",
        "description": "Celebração internacional da paz e harmonia",
        "category": "holiday"
      }
    ]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em marketing e datas comemorativas. Gere apenas datas relevantes e reais, sem criar datas fictícias."
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
    console.log('OpenAI response:', response);

    if (!response) {
      throw new Error('Resposta vazia do OpenAI');
    }

    const parsedDates = JSON.parse(response).dates || [];
    console.log('Parsed dates:', parsedDates);

    return new Response(
      JSON.stringify({ dates: parsedDates }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
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