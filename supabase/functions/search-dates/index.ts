import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './cors.ts';
import { callOpenAI } from './openai.ts';
import { fetchDatesFromDB, formatDatesForAnalysis, parseRelevantDates } from './dateUtils.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log('[search-dates] Processing request');
    const { niches } = await req.json();
    
    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Niches array is required');
    }

    console.log('[search-dates] Fetching dates from DB');
    const allDates = await fetchDatesFromDB();
    const datesForAnalysis = formatDatesForAnalysis(allDates);
    
    const userPrompt = `
    Você é um especialista EXTREMAMENTE RIGOROSO em marketing e análise de datas comemorativas.
    
    Sua tarefa é analisar as datas fornecidas e retornar EXCLUSIVAMENTE aquelas que têm uma conexão DIRETA, EXPLÍCITA e INEQUÍVOCA com os seguintes nichos de mercado: ${niches.join(', ')}.

    CRITÉRIOS OBRIGATÓRIOS - uma data só deve ser incluída se TODOS estes critérios forem atendidos:
    1. A data DEVE mencionar EXPLICITAMENTE uma profissão, atividade ou evento que é CENTRAL para o nicho
       Exemplo válido: "Dia do Contador" para nicho de finanças
       Exemplo inválido: "Dia da Criatividade" para nicho de design (muito genérico)
    
    2. A data DEVE ser específica do setor profissional do nicho
       Exemplo válido: "Dia do Chef de Cozinha" para gastronomia
       Exemplo inválido: "Dia do Trabalho" (muito genérico)
    
    3. A data DEVE oferecer uma oportunidade de marketing ÓBVIA e DIRETA para empresas do nicho
       Exemplo válido: "Dia do Programador" para tecnologia
       Exemplo inválido: "Dia da Internet" (muito amplo)

    REGRAS ESTRITAS DE EXCLUSÃO - NÃO inclua datas que:
    - Têm apenas uma conexão tangencial ou indireta com o nicho
    - São datas genéricas ou que poderiam se aplicar a múltiplos nichos
    - Não mencionam explicitamente uma profissão ou atividade do nicho
    - Não existem na lista fornecida (NÃO CRIE novas datas)
    - Requerem interpretação subjetiva para relacionar ao nicho

    Retorne as datas EXATAMENTE neste formato JSON, mantendo o formato de data original:
    [{ "date": "YYYY-MM-DD", "title": "Título original", "category": "Categoria original" }]

    Datas para análise: ${JSON.stringify(datesForAnalysis)}`;

    console.log('[search-dates] Calling OpenAI for strict date filtering');
    const gptData = await callOpenAI(userPrompt);

    if (!gptData.choices?.[0]?.message?.content) {
      console.error('[search-dates] Invalid GPT response:', gptData);
      throw new Error('Invalid GPT response structure');
    }

    const gptContent = gptData.choices[0].message.content.trim();
    console.log('[search-dates] Raw GPT response:', gptContent);
    
    const relevantDates = parseRelevantDates(gptContent);
    if (!Array.isArray(relevantDates)) {
      throw new Error('GPT response is not an array');
    }

    // Validate each date against Supabase data
    const formattedDates = relevantDates
      .filter(date => {
        const exists = allDates.some(d => d.data === date.date);
        if (!exists) {
          console.log(`[search-dates] Removing invalid date ${date.date} - not found in Supabase`);
          return false;
        }

        // Additional validation to ensure the date is truly relevant
        const originalDate = allDates.find(d => d.data === date.date);
        if (!originalDate) return false;

        // Log each accepted date for debugging
        console.log(`[search-dates] Accepting date: ${date.date} - ${originalDate.descrição}`);
        return true;
      })
      .map(date => {
        const originalDate = allDates.find(d => d.data === date.date);
        if (!originalDate) return null;
        
        return {
          date: date.date,
          title: originalDate.descrição,
          category: originalDate.tipo?.toLowerCase() || 'commemorative',
          description: originalDate.descrição
        };
      })
      .filter(Boolean);

    console.log(`[search-dates] Final filtered dates (${formattedDates.length}):`, formattedDates);
    
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
    console.error('[search-dates] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        details: error.message
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});