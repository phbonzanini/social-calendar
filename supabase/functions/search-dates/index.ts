import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './cors.ts';
import { callOpenAI } from './openai.ts';
import { fetchDatesFromDB, formatDatesForAnalysis, parseRelevantDates } from './dateUtils.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[search-dates] Processing request');
    const { niches } = await req.json();
    
    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Niches array is required');
    }

    console.log('[search-dates] Selected niches:', niches);

    console.log('[search-dates] Fetching dates from DB');
    const allDates = await fetchDatesFromDB();
    console.log(`[search-dates] Found ${allDates.length} total dates in DB`);
    
    // Pre-filter dates based on the niche columns
    const preFilteredDates = allDates.filter(date => {
      const dateNiches = [
        date['nicho 1']?.toLowerCase(),
        date['nicho 2']?.toLowerCase(),
        date['nicho 3']?.toLowerCase()
      ].filter(Boolean);

      // Map English niches to Portuguese for comparison
      const nicheMapping: Record<string, string> = {
        'education': 'educação',
        'fashion': 'moda',
        'healthcare': 'saúde e bem-estar',
        'finance': 'finanças',
        'gastronomy': 'gastronomia',
        'logistics': 'logística',
        'industry': 'indústria',
        'tourism': 'turismo'
      };

      const translatedNiches = niches.map(niche => nicheMapping[niche] || niche);
      
      return translatedNiches.some(niche => 
        dateNiches.some(dateNiche => 
          dateNiche.includes(niche.toLowerCase())
        )
      );
    });

    console.log(`[search-dates] Pre-filtered to ${preFilteredDates.length} dates based on niche columns`);
    
    if (preFilteredDates.length === 0) {
      console.log('[search-dates] No dates found after pre-filtering, returning empty array');
      return new Response(
        JSON.stringify({ dates: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPrompt = `
    Você é um especialista em marketing e análise de datas comemorativas para os seguintes nichos específicos:
    ${niches.join(', ')}

    CONTEXTO IMPORTANTE:
    - Existem 447 datas comemorativas cadastradas no banco de dados
    - Cada data pode estar associada a até 3 nichos diferentes
    - As datas fornecidas já foram pré-filtradas com base nas colunas de nichos do banco
    - Você deve analisar ${preFilteredDates.length} datas pré-filtradas

    CRITÉRIOS DE ANÁLISE - uma data só deve ser incluída se atender TODOS estes critérios:

    1. RELEVÂNCIA DIRETA:
       - A data DEVE ter uma conexão DIRETA e EXPLÍCITA com o nicho
       - Exemplo válido para Gastronomia: "Dia do Chef de Cozinha"
       - Exemplo inválido para Gastronomia: "Dia do Trabalhador"

    2. POTENCIAL DE MARKETING:
       - A data deve oferecer oportunidades claras de marketing para empresas do nicho
       - Deve permitir ações promocionais ou comunicação relevante
       - Exemplo válido para Educação: "Dia do Professor"
       - Exemplo inválido para Educação: "Dia do Café"

    3. ESPECIFICIDADE DO NICHO:
       - A data deve ser específica e relevante para o setor
       - Não deve ser uma data genérica que poderia se aplicar a qualquer nicho
       - Exemplo válido para Finanças: "Dia do Economista"
       - Exemplo inválido para Finanças: "Dia da Gratidão"

    REGRAS DE EXCLUSÃO - NÃO inclua datas que:
    - Têm apenas conexão indireta ou tangencial com o nicho
    - São genéricas demais
    - Requerem interpretação forçada para relacionar ao nicho
    - Não têm potencial claro de marketing para o nicho

    Analise cuidadosamente estas datas e retorne APENAS as que têm uma conexão verdadeiramente relevante e significativa com os nichos selecionados:

    ${JSON.stringify(preFilteredDates)}

    Retorne as datas EXATAMENTE neste formato JSON:
    [{ "date": "YYYY-MM-DD", "title": "Título original", "category": "Categoria original" }]`;

    console.log('[search-dates] Calling OpenAI for strict date filtering');
    const gptData = await callOpenAI(userPrompt);

    if (!gptData.choices?.[0]?.message?.content) {
      console.error('[search-dates] Invalid GPT response:', gptData);
      throw new Error('Invalid GPT response structure');
    }

    const gptContent = gptData.choices[0].message.content.trim();
    console.log('[search-dates] Raw GPT response:', gptContent);
    
    const relevantDates = parseRelevantDates(gptContent);
    console.log(`[search-dates] GPT returned ${relevantDates.length} relevant dates`);

    // Final validation against Supabase data
    const formattedDates = relevantDates
      .filter(date => {
        const originalDate = allDates.find(d => d.data?.split('T')[0] === date.date);
        if (!originalDate) {
          console.log(`[search-dates] Removing invalid date ${date.date} - not found in Supabase`);
          return false;
        }

        // Verify that the date actually has one of the selected niches
        const dateNiches = [
          originalDate['nicho 1']?.toLowerCase(),
          originalDate['nicho 2']?.toLowerCase(),
          originalDate['nicho 3']?.toLowerCase()
        ].filter(Boolean);

        // Map English niches to Portuguese for comparison
        const nicheMapping: Record<string, string> = {
          'education': 'educação',
          'fashion': 'moda',
          'healthcare': 'saúde e bem-estar',
          'finance': 'finanças',
          'gastronomy': 'gastronomia',
          'logistics': 'logística',
          'industry': 'indústria',
          'tourism': 'turismo'
        };

        const translatedNiches = niches.map(niche => nicheMapping[niche] || niche);
        
        const hasMatchingNiche = translatedNiches.some(niche => 
          dateNiches.some(dateNiche => 
            dateNiche.includes(niche.toLowerCase())
          )
        );

        if (!hasMatchingNiche) {
          console.log(`[search-dates] Removing date ${date.date} - no matching niches`);
          return false;
        }

        return true;
      })
      .map(date => {
        const originalDate = allDates.find(d => d.data?.split('T')[0] === date.date);
        if (!originalDate) return null;
        
        return {
          date: date.date,
          title: originalDate.descrição,
          category: originalDate.tipo?.toLowerCase() || 'commemorative',
          description: originalDate.descrição
        };
      })
      .filter(Boolean);

    console.log(`[search-dates] Final filtered dates count: ${formattedDates.length}`);
    
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