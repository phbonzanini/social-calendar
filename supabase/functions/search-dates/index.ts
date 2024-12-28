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

    console.log('Iniciando análise para os nichos:', niches);
    console.log('Total de datas disponíveis:', allDates.length);

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou não fornecidos');
    }

    // Filter dates directly based on niches array overlap
    const relevantDates = allDates.filter(date => {
      // Check if any of the selected niches are in the date's niches array
      return date.niches && date.niches.some((niche: string) => 
        niches.includes(niche)
      );
    });

    console.log('Datas relevantes encontradas:', relevantDates.length);

    if (relevantDates.length === 0) {
      console.log('Nenhuma data relevante encontrada para os nichos selecionados');
      return new Response(
        JSON.stringify({ 
          dates: [],
          message: 'Nenhuma data encontrada para os nichos selecionados.' 
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Use GPT to enhance and validate the selected dates
    const prompt = `
      Analise estas datas comemorativas e confirme sua relevância para os nichos: ${niches.join(', ')}.
      
      Datas para análise:
      ${JSON.stringify(relevantDates, null, 2)}
      
      Retorne apenas as datas que têm real potencial de marketing para os nichos selecionados.
      Mantenha o formato original das datas.
      RETORNE APENAS O ARRAY JSON, sem texto adicional.
    `;

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
            content: 'Você é um especialista em marketing que analisa datas comemorativas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('Erro na resposta do GPT:', await response.text());
      // If GPT fails, return the filtered dates directly
      return new Response(
        JSON.stringify({ dates: relevantDates }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    const gptData = await response.json();
    let enhancedDates = relevantDates; // Default to filtered dates

    if (gptData.choices?.[0]?.message?.content) {
      try {
        const content = gptData.choices[0].message.content;
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
          const parsedDates = JSON.parse(match[0]);
          if (Array.isArray(parsedDates) && parsedDates.length > 0) {
            enhancedDates = parsedDates;
          }
        }
      } catch (error) {
        console.error('Erro ao processar resposta do GPT:', error);
        // Keep using the filtered dates if GPT processing fails
      }
    }

    console.log('Retornando datas processadas:', enhancedDates.length);

    return new Response(
      JSON.stringify({ dates: enhancedDates }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('Erro na função search-dates:', error);
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
