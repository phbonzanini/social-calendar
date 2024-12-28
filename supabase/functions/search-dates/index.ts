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
      console.error('Invalid niches array:', niches);
      throw new Error('Nichos inválidos ou vazios');
    }

    if (!allDates || !Array.isArray(allDates) || allDates.length === 0) {
      console.error('No dates provided for analysis');
      throw new Error('Nenhuma data fornecida para análise. Verifique se há dados no banco.');
    }

    // Prepare a more detailed prompt for better analysis
    const prompt = `
      Analise cuidadosamente estas ${allDates.length} datas comemorativas e identifique as mais relevantes 
      para os seguintes nichos de negócio: ${niches.join(', ')}.

      Datas para análise:
      ${JSON.stringify(allDates, null, 2)}

      Instruções detalhadas:
      1. Analise profundamente o contexto e significado de cada data
      2. Considere a relevância comercial e potencial de marketing para os nichos especificados
      3. Inclua tanto datas específicas do nicho quanto datas que podem ser adaptadas criativamente
      4. Priorize datas com maior potencial de engajamento e conversão
      5. Considere o calendário completo para ter uma boa distribuição ao longo do ano
      6. Retorne pelo menos 10 datas relevantes, se disponíveis
      7. Mantenha todos os campos originais das datas selecionadas

      Retorne apenas as datas mais relevantes no mesmo formato do input, mantendo todos os campos originais.
      Não adicione campos novos ou modifique os existentes.
    `;

    console.log('Sending request to GPT for analysis');

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em marketing e calendário comercial, focado em identificar datas relevantes para diferentes nichos de negócio. Sua análise deve ser profunda e considerar múltiplos aspectos de cada data.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!gptResponse.ok) {
      console.error('Error in GPT response:', await gptResponse.text());
      throw new Error('Erro na análise das datas');
    }

    const gptData = await gptResponse.json();
    console.log('GPT response received');

    if (!gptData.choices?.[0]?.message?.content) {
      throw new Error('Formato de resposta do GPT inválido');
    }

    // Process GPT response
    let relevantDates;
    try {
      const content = gptData.choices[0].message.content;
      // Try to extract JSON array from response
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
        details: 'Verifique se há dados no banco de dados e tente novamente.'
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});