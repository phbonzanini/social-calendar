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

    console.log('Analisando datas para os nichos:', niches);
    console.log('Total de datas disponíveis:', allDates.length);

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou não fornecidos');
    }

    if (!allDates || !Array.isArray(allDates) || allDates.length === 0) {
      console.log('Nenhuma data encontrada no banco');
      return new Response(
        JSON.stringify({ dates: [] }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    const prompt = `
      Você é um especialista em marketing digital e calendário de conteúdo para redes sociais.
      
      Analise as datas comemorativas fornecidas e identifique quais são relevantes 
      para os seguintes nichos de negócio: ${niches.join(', ')}.

      Para cada data, considere:
      1. Relevância direta para vendas e promoções
      2. Oportunidades de marketing de conteúdo
      3. Engajamento em redes sociais
      4. Campanhas sazonais
      5. Conexões indiretas que podem ser aproveitadas para marketing

      Datas para análise:
      ${JSON.stringify(allDates, null, 2)}

      Retorne TODAS as datas que possam ser aproveitadas para marketing digital, mesmo que a conexão seja indireta.
      Por exemplo:
      - Para o nicho "saúde", datas como "Dia Mundial da Alimentação" são relevantes
      - Para o nicho "moda", datas como "Dia das Mães" são oportunidades de vendas
      - Para o nicho "educação", datas como "Volta às aulas" são essenciais

      Retorne apenas um array JSON com as datas selecionadas, mantendo este formato para cada data:
      {
        "data": "2025-01-01",
        "descrição": "Descrição original da data",
        "tipo": "commemorative/holiday/optional"
      }

      Retorne apenas o array JSON, sem texto adicional.
    `;

    console.log('Enviando prompt para análise do GPT');

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
            content: 'Você é um especialista em marketing digital que analisa datas comemorativas para criar oportunidades de marketing e vendas. Seja criativo ao identificar conexões entre datas e nichos de negócio.'
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
      console.log('Conteúdo da resposta:', content);
      
      // Tenta encontrar e parsear o array JSON na resposta
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        relevantDates = JSON.parse(match[0]);
        console.log('Datas relevantes encontradas:', relevantDates.length);
        
        // Valida e filtra as datas retornadas
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