import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niches, allDates } = await req.json();
    console.log('Received request with niches:', niches);
    console.log('Number of dates received:', allDates?.length || 0);
    
    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou vazios');
    }

    if (!allDates || !Array.isArray(allDates) || allDates.length === 0) {
      throw new Error('Nenhuma data fornecida para análise');
    }

    const prompt = `
      Você é um especialista em marketing que analisa datas comemorativas para diferentes nichos de negócio.
      
      Analise as ${allDates.length} datas comemorativas fornecidas e identifique as mais relevantes 
      para os seguintes nichos: ${niches.join(', ')}.

      Datas para análise:
      ${JSON.stringify(allDates, null, 2)}

      Instruções importantes:
      1. Retorne APENAS as datas que têm uma conexão clara e direta com os nichos selecionados
      2. Para cada data, explique brevemente por que ela é relevante para o(s) nicho(s)
      3. Mantenha a estrutura original das datas (data, descrição, tipo)
      4. Retorne entre 5 e 15 datas mais relevantes
      5. Não modifique os campos originais
      6. Retorne apenas o array JSON com as datas selecionadas

      Formato da resposta:
      [
        {
          "data": "2025-01-01",
          "descrição": "Descrição original da data",
          "tipo": "tipo original",
          "relevância": "Breve explicação da relevância para o(s) nicho(s)"
        }
      ]
    `;

    console.log('Sending request to GPT-4o-mini for analysis');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em marketing que seleciona datas comemorativas relevantes para diferentes nichos de negócio. Retorne apenas o array JSON com as datas selecionadas.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('Error in GPT response:', await response.text());
      throw new Error('Erro na análise das datas com GPT');
    }

    const data = await response.json();
    console.log('GPT response received');

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Resposta inválida do GPT');
    }

    let relevantDates;
    try {
      const content = data.choices[0].message.content;
      // Extract JSON array from response
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        relevantDates = JSON.parse(match[0]);
        console.log('Successfully parsed relevant dates:', relevantDates.length);
      } else {
        throw new Error('Formato de resposta inválido');
      }
    } catch (error) {
      console.error('Error processing GPT response:', error);
      throw new Error('Erro ao processar datas relevantes');
    }

    return new Response(
      JSON.stringify({ dates: relevantDates }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('Error in search-dates function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Erro ao processar a busca de datas. Por favor, tente novamente.'
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});