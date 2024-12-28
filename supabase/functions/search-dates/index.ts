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

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou não fornecidos');
    }

    // Log dos nichos recebidos
    console.log('Nichos recebidos:', niches);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar todas as datas
    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*');

    if (dbError) {
      console.error('Erro ao buscar datas:', dbError);
      throw dbError;
    }

    if (!allDates) {
      console.log('Nenhuma data encontrada');
      return new Response(
        JSON.stringify({ dates: [] }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Log do total de datas encontradas
    console.log('Total de datas no banco:', allDates.length);

    // Converter nichos para lowercase
    const selectedNichesLower = niches.map(n => n.toLowerCase());

    // Filtrar datas relevantes
    const relevantDates = allDates.filter(date => {
      // Se for feriado, incluir sempre
      if (date.tipo === 'holiday') {
        console.log('Incluindo feriado:', date.descrição);
        return true;
      }

      // Verificar cada nicho da data
      const nichos = [
        date['nicho 1'],
        date['nicho 2'],
        date['nicho 3']
      ].filter(Boolean).map(n => n.toLowerCase());

      // Log para debug
      console.log('Data:', date.descrição);
      console.log('Nichos da data:', nichos);
      console.log('Nichos selecionados:', selectedNichesLower);

      // Verificar se há interseção entre os nichos da data e os nichos selecionados
      const hasMatchingNiche = nichos.some(niche => selectedNichesLower.includes(niche));
      
      if (hasMatchingNiche) {
        console.log('Match encontrado para:', date.descrição);
      }

      return hasMatchingNiche;
    });

    // Log do total de datas relevantes
    console.log('Total de datas relevantes:', relevantDates.length);

    // Formatar datas para resposta
    const formattedDates = relevantDates.map(date => ({
      date: date.data,
      title: date.descrição,
      category: date.tipo,
      description: date.descrição
    }));

    // Ordenar datas
    formattedDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Log final das datas encontradas
    console.log('Datas encontradas:', formattedDates);

    return new Response(
      JSON.stringify({ dates: formattedDates }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('Erro na função search-dates:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Erro ao processar a busca de datas.'
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});