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
    Você é um especialista em marketing e análise de datas comemorativas. Analise cuidadosamente as datas fornecidas e retorne APENAS aquelas que têm uma conexão DIRETA e RELEVANTE com os seguintes nichos de mercado: ${niches.join(', ')}.

    Uma data é considerada relevante SOMENTE se atender a pelo menos um destes critérios:
    1. Tem relação DIRETA com o nicho (ex: "Dia do Programador" para nicho de tecnologia)
    2. É uma data específica do setor ou profissão relacionada ao nicho
    3. Representa uma oportunidade de marketing CLARA e DIRETA para o nicho

    NÃO inclua datas que:
    - Têm apenas conexão indireta ou vaga com o nicho
    - São datas genéricas que poderiam se aplicar a qualquer nicho
    - Não oferecem uma oportunidade clara de marketing para o nicho específico

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
    console.log('[search-dates] Processing GPT response');
    
    const relevantDates = parseRelevantDates(gptContent);
    if (!Array.isArray(relevantDates)) {
      throw new Error('GPT response is not an array');
    }

    const formattedDates = relevantDates
      .filter(date => allDates.some(d => d.data === date.date))
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

    console.log(`[search-dates] Returning ${formattedDates.length} strictly filtered dates`);
    
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