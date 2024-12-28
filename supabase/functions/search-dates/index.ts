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

    if (!allDates || !Array.isArray(allDates) || allDates.length === 0) {
      console.log('Nenhuma data encontrada no banco');
      return new Response(
        JSON.stringify({ dates: [] }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    const prompt = `
      Você é um especialista em marketing digital e calendário de conteúdo para redes sociais.
      
      Analise cuidadosamente as datas comemorativas fornecidas e identifique quais são relevantes 
      para os seguintes nichos de negócio: ${niches.join(', ')}.

      Para cada data, avalie:
      1. Relevância direta para vendas e promoções
      2. Oportunidades de marketing de conteúdo
      3. Engajamento em redes sociais
      4. Campanhas sazonais
      5. Conexões indiretas que podem ser aproveitadas

      Exemplos de conexões:
      - Para o nicho "pets": Dia das Mães (donos de pets consideram seus animais como filhos)
      - Para o nicho "moda": Dia do Trabalho (looks para ambiente profissional)
      - Para o nicho "educação": Black Friday (promoções em cursos)
      - Para o nicho "saúde": Carnaval (cuidados com a saúde durante a folia)

      Datas para análise:
      ${JSON.stringify(allDates, null, 2)}

      IMPORTANTE: Retorne TODAS as datas que possam ser aproveitadas, mesmo que a conexão seja indireta.
      Seja criativo e pense em todas as possibilidades de marketing digital.

      Retorne apenas um array JSON com as datas relevantes, mantendo exatamente este formato para cada data:
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
            content: 'Você é um especialista em marketing digital que analisa datas comemorativas para criar oportunidades de marketing e vendas. Seja criativo e abrangente ao identificar conexões entre datas e nichos de negócio.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
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
      if (!match) {
        console.error('Formato de resposta inválido:', content);
        throw new Error('Formato de resposta inválido');
      }

      relevantDates = JSON.parse(match[0]);
      console.log('Datas relevantes encontradas:', relevantDates.length);
      
      // Valida e filtra as datas retornadas
      relevantDates = relevantDates.filter(date => {
        const isValid = date.data && 
          date.descrição && 
          ['commemorative', 'holiday', 'optional'].includes(date.tipo);
        
        if (!isValid) {
          console.log('Data inválida encontrada:', date);
        }
        return isValid;
      });
      
      console.log('Datas válidas após filtro:', relevantDates.length);
      
    } catch (error) {
      console.error('Erro ao processar resposta do GPT:', error);
      console.error('Conteúdo que causou erro:', data.choices[0].message.content);
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