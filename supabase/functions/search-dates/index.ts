import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niches } = await req.json();

    console.log('Received request for niches:', niches);

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou não fornecidos');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Buscando todas as datas do banco de dados...');

    // Buscar TODAS as datas disponíveis
    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*');

    if (dbError) {
      console.error('Erro ao buscar datas:', dbError);
      throw dbError;
    }

    console.log(`Total de datas encontradas no banco: ${allDates.length}`);

    // Filtrar as datas baseado nos nichos selecionados
    const relevantDates = allDates.filter(date => {
      // Sempre incluir feriados nacionais
      if (date.tipo === 'holiday') {
        console.log(`Incluindo feriado: ${date.descrição}`);
        return true;
      }

      // Para datas com nichos específicos
      if (date.niches && Array.isArray(date.niches)) {
        // Converter os nichos para lowercase para comparação
        const dateNichesLower = date.niches.map(n => n.toLowerCase());
        const selectedNichesLower = niches.map(n => n.toLowerCase());

        // Verificar se há interseção entre os nichos da data e os selecionados
        const hasMatchingNiche = dateNichesLower.some(niche => 
          selectedNichesLower.includes(niche)
        );

        if (hasMatchingNiche) {
          console.log(`Data específica encontrada para nicho:`, {
            data: date.data,
            descricao: date.descrição,
            nichos: date.niches
          });
          return true;
        }
      }

      // Incluir datas comemorativas gerais (sem nichos específicos)
      if (date.tipo === 'commemorative' && (!date.niches || date.niches.length === 0)) {
        console.log(`Incluindo data comemorativa geral: ${date.descrição}`);
        return true;
      }

      return false;
    });

    console.log(`Datas relevantes encontradas: ${relevantDates.length}`);

    // Remover duplicatas baseado na data e descrição
    const uniqueDates = Array.from(new Map(
      relevantDates.map(date => [date.data + date.descrição, date])
    ).values());

    console.log(`Após remover duplicatas: ${uniqueDates.length} datas`);

    // Formatar datas para resposta
    const formattedDates = uniqueDates.map(date => ({
      date: date.data,
      title: date.descrição,
      category: date.tipo,
      description: date.descrição,
    }));

    // Ordenar datas cronologicamente
    formattedDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log('Retornando datas formatadas:', formattedDates);

    return new Response(
      JSON.stringify({ dates: formattedDates }), 
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