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
    Você é um especialista em marketing e análise de datas comemorativas. Analise RIGOROSAMENTE as datas fornecidas e retorne APENAS aquelas que têm uma conexão DIRETA, CLARA e MUITO RELEVANTE com os seguintes nichos de mercado: ${niches.join(', ')}.

    Uma data é considerada relevante SOMENTE se atender a TODOS estes critérios:
    1. Tem relação DIRETA e ÓBVIA com o nicho (ex: "Dia do Chef de Cozinha" para nicho de gastronomia)
    2. É uma data específica da profissão ou setor relacionado ao nicho
    3. Representa uma oportunidade de marketing CLARA e DIRETA para o nicho

    IMPORTANTE:
    - Seja MUITO RIGOROSO na seleção
    - NÃO inclua datas com conexão indireta ou vaga
    - NÃO inclua datas genéricas que poderiam se aplicar a vários nichos
    - NÃO inclua datas que não tenham relação ÓBVIA com o nicho
    - APENAS retorne datas que existem na lista fornecida, NÃO CRIE novas datas

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
    console.log('[search-dates] Processing GPT response:', gptContent);
    
    const relevantDates = parseRelevantDates(gptContent);
    if (!Array.isArray(relevantDates)) {
      throw new Error('GPT response is not an array');
    }

    // Strict validation to ensure dates exist in Supabase
    const formattedDates = relevantDates
      .filter(date => {
        const exists = allDates.some(d => d.data === date.date);
        if (!exists) {
          console.log(`[search-dates] Removing date ${date.date} as it doesn't exist in Supabase`);
        }
        return exists;
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

    console.log(`[search-dates] Returning ${formattedDates.length} strictly filtered dates:`, formattedDates);
    
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