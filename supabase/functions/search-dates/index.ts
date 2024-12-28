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
    console.log('Total de datas para análise:', allDates.length);

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou vazios');
    }

    if (!allDates || !Array.isArray(allDates) || allDates.length === 0) {
      return new Response(
        JSON.stringify({ dates: [] }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    const formattedDates = allDates.map(date => ({
      data: date.data,
      descricao: date.descrição,
      tipo: date.tipo
    }));

    const prompt = `
      Você é um especialista em marketing digital e calendário de conteúdo.
      
      Analise as datas comemorativas fornecidas e identifique quais são relevantes 
      para os seguintes nichos de negócio: ${niches.join(', ')}.

      Datas para análise:
      ${JSON.stringify(formattedDates, null, 2)}

      Instruções importantes:
      1. Considere TODAS as conexões possíveis entre as datas e os nichos
      2. Inclua datas que possam ser usadas para:
         - Marketing digital e conteúdo
         - Promoções e vendas
         - Engajamento nas redes sociais
         - Campanhas sazonais
      3. Mantenha os dados originais das datas
      4. Retorne TODAS as datas que tenham qualquer relevância

      Retorne apenas um array JSON com as datas selecionadas, mantendo este formato para cada data:
      {
        "data": "2025-01-01",
        "descrição": "Descrição original da data",
        "tipo": "commemorative/holiday/optional"
      }

      Retorne apenas o array JSON, sem texto adicional.
    `;

    console.log('Enviando prompt para análise');

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
            content: 'Você é um especialista em marketing digital que analisa datas comemorativas para criar conteúdo relevante. Seja criativo ao identificar oportunidades, mesmo que as conexões não sejam óbvias.'
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
      throw new Error('Erro na análise das datas');
    }

    const data = await response.json();
    console.log('Resposta recebida do GPT');

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Resposta inválida do GPT');
    }

    let relevantDates;
    try {
      const content = data.choices[0].message.content;
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        relevantDates = JSON.parse(match[0]);
        console.log('Datas relevantes encontradas:', relevantDates.length);
        
        relevantDates = relevantDates.filter(date => 
          date.data && 
          date.descrição && 
          ['commemorative', 'holiday', 'optional'].includes(date.tipo)
        );
        
        console.log('Datas válidas após filtro:', relevantDates.length);
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