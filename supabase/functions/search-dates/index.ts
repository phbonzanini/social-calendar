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
    console.log('Analisando relevância para nichos:', niches);
    console.log('Total de datas para análise:', allDates.length);
    
    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou vazios');
    }

    if (!allDates || !Array.isArray(allDates) || allDates.length === 0) {
      throw new Error('Nenhuma data fornecida para análise');
    }

    // Prepara o prompt para análise detalhada
    const prompt = `
      Analise cuidadosamente estas ${allDates.length} datas comemorativas e identifique quais são mais relevantes 
      para os seguintes nichos de negócio: ${niches.join(', ')}.

      Datas para análise:
      ${JSON.stringify(allDates, null, 2)}

      Instruções:
      1. Analise o contexto e significado de cada data
      2. Considere a relevância comercial e de marketing para os nichos
      3. Inclua tanto datas específicas quanto datas que podem ser adaptadas criativamente
      4. Priorize datas com maior potencial de engajamento
      5. Considere o calendário completo para ter uma boa distribuição ao longo do ano

      Retorne apenas as datas mais relevantes no mesmo formato do input, mantendo todos os campos originais.
      Não adicione campos novos ou modifique os existentes.
    `;

    console.log('Enviando requisição para GPT');

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
            content: 'Você é um especialista em marketing e calendário comercial, focado em identificar datas relevantes para diferentes nichos de negócio.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!gptResponse.ok) {
      console.error('Erro na resposta do GPT:', await gptResponse.text());
      throw new Error('Erro na API do GPT');
    }

    const gptData = await gptResponse.json();
    console.log('Resposta do GPT recebida');

    if (!gptData.choices?.[0]?.message?.content) {
      throw new Error('Formato de resposta do GPT inválido');
    }

    // Processa a resposta do GPT
    let relevantDates;
    try {
      const content = gptData.choices[0].message.content;
      // Tenta extrair o array JSON da resposta
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        relevantDates = JSON.parse(match[0]);
      } else {
        throw new Error('Formato de resposta inválido');
      }
    } catch (error) {
      console.error('Erro ao processar resposta do GPT:', error);
      throw new Error('Erro ao processar datas relevantes');
    }

    console.log('Total de datas relevantes encontradas:', relevantDates.length);

    return new Response(
      JSON.stringify({ dates: relevantDates }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('Erro na função search-dates:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});