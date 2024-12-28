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
    console.log('Recebido request com nichos:', niches);
    console.log('Número de datas recebidas:', allDates?.length || 0);
    
    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou vazios');
    }

    if (!allDates || !Array.isArray(allDates) || allDates.length === 0) {
      throw new Error('Nenhuma data fornecida para análise');
    }

    const prompt = `
      Você é um especialista em marketing digital que analisa datas comemorativas para criar conteúdo relevante.
      
      Sua tarefa é analisar as datas comemorativas fornecidas e identificar as mais relevantes 
      para os seguintes nichos: ${niches.join(', ')}.

      Datas para análise:
      ${JSON.stringify(allDates, null, 2)}

      Instruções importantes:
      1. Analise cada data e identifique conexões diretas E indiretas com os nichos
      2. Seja mais flexível na análise, considerando oportunidades de marketing mesmo que a conexão não seja óbvia
      3. Mantenha todos os campos originais das datas
      4. Selecione TODAS as datas que possam ter alguma relevância, sem limite máximo
      5. Não altere os dados originais
      6. Retorne apenas o array JSON com as datas selecionadas

      Formato da resposta (exemplo):
      [
        {
          "data": "2025-01-01",
          "descrição": "Dia da Confraternização Universal",
          "tipo": "commemorative",
          "niches": ["food", "fashion"],
          "relevância": "Oportunidade para campanhas de produtos para festas e confraternizações"
        }
      ]

      Retorne apenas o array JSON, sem texto adicional.
    `;

    console.log('Enviando request para GPT-4o-mini');

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
            content: 'Você é um especialista em marketing digital que analisa datas comemorativas para criar conteúdo relevante. Seja criativo e flexível ao identificar oportunidades de marketing, mesmo que as conexões não sejam óbvias. Retorne apenas o array JSON com as datas selecionadas.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('Erro na resposta do GPT:', await response.text());
      throw new Error('Erro na análise das datas com GPT');
    }

    const data = await response.json();
    console.log('Resposta do GPT recebida');

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Resposta inválida do GPT');
    }

    let relevantDates;
    try {
      const content = data.choices[0].message.content;
      // Extrair array JSON da resposta
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        relevantDates = JSON.parse(match[0]);
        console.log('Datas relevantes processadas com sucesso:', relevantDates.length);
      } else {
        throw new Error('Formato de resposta inválido');
      }
    } catch (error) {
      console.error('Erro ao processar resposta do GPT:', error);
      throw new Error('Erro ao processar datas relevantes');
    }

    return new Response(
      JSON.stringify({ dates: relevantDates }), 
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